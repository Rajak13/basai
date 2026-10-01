"""
Subscription Management Service

Handles subscription tiers, resource quotas, payment processing,
and tenant suspension / reactivation lifecycle.

Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 6.6, 8.5, 8.6, 11.3, 14.3, 14.4, 14.5, 15.2
"""
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.db import transaction

from .models import Tenant, Subscription, SubscriptionPayment, TenantMembership


class QuotaExceededException(Exception):
    """Raised when a tenant exceeds their subscription resource quota."""
    def __init__(self, message: str, resource_type: str = None, current_count: int = 0, limit: int = 0):
        super().__init__(message)
        self.message = message
        self.resource_type = resource_type
        self.current_count = current_count
        self.limit = limit


class TenantSuspendedException(Exception):
    """Raised when an operation is attempted on a suspended tenant."""
    pass


# Quota definitions and feature availability per Subscription Tier
TIER_CONFIGS = {
    Subscription.Tier.TRIAL: {
        'max_rooms': 5,
        'max_staff': 3,
        'max_monthly_bookings': 50,
        'price_usd': Decimal('0.00'),
        'allow_custom_domain': False,
        'allow_api_access': False,
        'allow_white_label': False,
    },
    Subscription.Tier.STARTER: {
        'max_rooms': 10,
        'max_staff': 5,
        'max_monthly_bookings': 100,
        'price_usd': Decimal('29.00'),
        'allow_custom_domain': False,
        'allow_api_access': False,
        'allow_white_label': False,
    },
    Subscription.Tier.PROFESSIONAL: {
        'max_rooms': 50,
        'max_staff': 15,
        'max_monthly_bookings': 500,
        'price_usd': Decimal('79.00'),
        'allow_custom_domain': True,
        'allow_api_access': False,
        'allow_white_label': False,
    },
    Subscription.Tier.ENTERPRISE: {
        'max_rooms': 999999,
        'max_staff': 999999,
        'max_monthly_bookings': 999999,
        'price_usd': Decimal('199.00'),
        'allow_custom_domain': True,
        'allow_api_access': True,
        'allow_white_label': True,
    },
}


class SubscriptionService:
    """
    Manages tenant subscription quotas, tier upgrades/downgrades,
    billing payments, and tenant lifecycle state changes.
    """

    @staticmethod
    def check_resource_quota(tenant: Tenant, resource_type: str, increment: int = 1) -> bool:
        """
        Verify that creating an additional resource will not exceed the tenant's quota.
        
        Args:
            tenant: Tenant instance to check quota for
            resource_type: 'rooms', 'staff', or 'bookings'
            increment: Number of units to add (default: 1)
            
        Returns:
            bool: True if allowed
            
        Raises:
            TenantSuspendedException: If tenant subscription is suspended
            QuotaExceededException: If quota limit reached
        """
        # Ensure tenant is not suspended or inactive
        if tenant.status == Tenant.Status.SUSPENDED:
            raise TenantSuspendedException(
                f"Tenant '{tenant.hotel_name}' is suspended due to payment failure. "
                "Feature usage is restricted until payment is resolved."
            )
        if tenant.status in (Tenant.Status.CANCELLED, Tenant.Status.ARCHIVED):
            raise QuotaExceededException(
                f"Tenant '{tenant.hotel_name}' is {tenant.status.lower()}."
            )

        try:
            subscription = tenant.subscription
        except Subscription.DoesNotExist:
            # Fallback or auto-create trial if missing
            subscription = Subscription.objects.create(
                tenant=tenant,
                tier=Subscription.Tier.TRIAL,
                **TIER_CONFIGS[Subscription.Tier.TRIAL]
            )

        resource_type = resource_type.lower()

        if resource_type in ('rooms', 'room'):
            from apps.rooms.models import Room
            # Use tenant database schema
            current_count = Room.objects.using(tenant.db_name).count()
            limit = subscription.max_rooms
            if current_count + increment > limit:
                raise QuotaExceededException(
                    f"Room limit reached ({current_count}/{limit}) for {subscription.get_tier_display()}. "
                    "Upgrade your subscription to add more rooms.",
                    resource_type='rooms',
                    current_count=current_count,
                    limit=limit
                )

        elif resource_type in ('staff', 'staff_members', 'membership'):
            # Staff memberships are tracked in central database
            current_count = TenantMembership.objects.filter(
                tenant=tenant,
                is_active=True
            ).count()
            limit = subscription.max_staff
            if current_count + increment > limit:
                raise QuotaExceededException(
                    f"Staff limit reached ({current_count}/{limit}) for {subscription.get_tier_display()}. "
                    "Upgrade your subscription to add more staff members.",
                    resource_type='staff',
                    current_count=current_count,
                    limit=limit
                )

        elif resource_type in ('bookings', 'booking', 'reservations', 'reservation'):
            from apps.reservations.models import Reservation
            now = timezone.now()
            current_count = Reservation.objects.using(tenant.db_name).filter(
                created_at__year=now.year,
                created_at__month=now.month
            ).count()
            limit = subscription.max_monthly_bookings
            if current_count + increment > limit:
                raise QuotaExceededException(
                    f"Monthly booking limit reached ({current_count}/{limit}) for {subscription.get_tier_display()}. "
                    "Upgrade your subscription to accept more bookings this month.",
                    resource_type='bookings',
                    current_count=current_count,
                    limit=limit
                )
        else:
            raise ValueError(f"Unknown resource type: {resource_type}")

        return True

    @staticmethod
    def change_tier(
        subscription: Subscription,
        new_tier: str,
        billing_cycle: str = None
    ) -> Subscription:
        """
        Upgrade or downgrade a tenant's subscription tier.
        Immediately updates quotas and feature gates.
        
        Requirements: 14.4, 14.5
        """
        if new_tier not in TIER_CONFIGS:
            raise ValueError(f"Invalid subscription tier: {new_tier}. Choose from {list(TIER_CONFIGS.keys())}")

        config = TIER_CONFIGS[new_tier]
        subscription.tier = new_tier
        subscription.max_rooms = config['max_rooms']
        subscription.max_staff = config['max_staff']
        subscription.max_monthly_bookings = config['max_monthly_bookings']
        subscription.allow_custom_domain = config['allow_custom_domain']
        subscription.allow_api_access = config['allow_api_access']
        subscription.allow_white_label = config['allow_white_label']

        if billing_cycle:
            subscription.billing_cycle = billing_cycle

        # Adjust price based on billing cycle (10% discount for annual)
        base_price = config['price_usd']
        if subscription.billing_cycle == Subscription.BillingCycle.ANNUAL:
            subscription.price_usd = (base_price * Decimal('12') * Decimal('0.90')).quantize(Decimal('0.01'))
        else:
            subscription.price_usd = base_price

        subscription.save()
        return subscription

    @staticmethod
    def process_subscription_payment(
        subscription: Subscription,
        amount: Decimal = None,
        gateway: str = "STRIPE",
        transaction_id: str = None,
        simulate_failure: bool = False,
        error_message: str = None
    ) -> SubscriptionPayment:
        """
        Process recurring subscription charge and update tenant billing dates or suspension.
        
        Requirements: 4.5, 4.6, 4.7, 15.2
        """
        charge_amount = amount if amount is not None else subscription.price_usd

        with transaction.atomic():
            if simulate_failure:
                payment = SubscriptionPayment.objects.create(
                    subscription=subscription,
                    amount=charge_amount,
                    currency="USD",
                    status=SubscriptionPayment.Status.FAILED,
                    gateway=gateway,
                    transaction_id=transaction_id or "",
                    billing_cycle=subscription.billing_cycle,
                    error_message=error_message or "Payment card declined or insufficient funds"
                )
                # Suspend tenant upon payment failure
                SubscriptionService.suspend_tenant(
                    subscription.tenant,
                    reason=f"Subscription charge of ${charge_amount} failed."
                )
                return payment

            # Payment succeeded
            import uuid
            txn_id = transaction_id or f"txn_{uuid.uuid4().hex[:16]}"
            payment = SubscriptionPayment.objects.create(
                subscription=subscription,
                amount=charge_amount,
                currency="USD",
                status=SubscriptionPayment.Status.SUCCESS,
                gateway=gateway,
                transaction_id=txn_id,
                billing_cycle=subscription.billing_cycle,
                error_message=""
            )

            # Advance next billing date
            today = timezone.now().date()
            if subscription.billing_cycle == Subscription.BillingCycle.ANNUAL:
                subscription.next_billing_date = today + timedelta(days=365)
            else:
                subscription.next_billing_date = today + timedelta(days=30)
            subscription.save()

            # If tenant was suspended, reactivate
            if subscription.tenant.status in (Tenant.Status.SUSPENDED, Tenant.Status.TRIAL):
                SubscriptionService.reactivate_tenant(subscription.tenant)

            return payment

    @staticmethod
    def suspend_tenant(tenant: Tenant, reason: str = "Payment failed") -> Tenant:
        """
        Suspend tenant when billing fails or administrative action taken.
        """
        tenant.status = Tenant.Status.SUSPENDED
        tenant.save(update_fields=['status', 'updated_at'])
        return tenant

    @staticmethod
    def reactivate_tenant(tenant: Tenant) -> Tenant:
        """
        Reactivate a suspended tenant after resolution.
        """
        tenant.status = Tenant.Status.ACTIVE
        tenant.save(update_fields=['status', 'updated_at'])
        return tenant
