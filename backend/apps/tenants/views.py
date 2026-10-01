"""
Tenant management and subscription views.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Tenant, Subscription, SubscriptionPayment, TenantMembership
from .serializers import (
    SubscriptionSerializer,
    SubscriptionPaymentSerializer,
    TenantMembershipSerializer,
    StaffCreateSerializer,
)
from .subscription_service import (
    SubscriptionService,
    QuotaExceededException,
    TenantSuspendedException,
)

User = get_user_model()


class StaffViewSet(viewsets.ModelViewSet):
    """
    Staff account management for the active tenant.
    Enforces staff quota limits before adding new staff.
    
    Requirements: 4.4, 11.1, 11.2, 11.3
    """
    serializer_class = TenantMembershipSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            return TenantMembership.objects.none()
        return TenantMembership.objects.filter(tenant=tenant)

    def create(self, request, *args, **kwargs):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response(
                {"error": "No active hotel tenant found for this request domain"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        # Enforce staff resource quota
        try:
            SubscriptionService.check_resource_quota(tenant, 'staff')
        except (QuotaExceededException, TenantSuspendedException) as exc:
            return Response(
                {"error": str(exc), "code": "QUOTA_EXCEEDED"},
                status=status.HTTP_403_FORBIDDEN
            )

        email = validated_data['email']
        role = validated_data['role']

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': validated_data.get('first_name', ''),
                'last_name': validated_data.get('last_name', ''),
                'phone_number': validated_data.get('phone_number', ''),
            }
        )

        membership, m_created = TenantMembership.objects.get_or_create(
            user=user,
            tenant=tenant,
            defaults={'role': role, 'is_active': True}
        )
        if not m_created:
            if not membership.is_active:
                membership.is_active = True
                membership.role = role
                membership.save()
            else:
                return Response(
                    {"error": "User already has an active staff account for this hotel."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            TenantMembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED
        )


class SubscriptionView(APIView):
    """
    View and manage subscription for the active tenant.
    
    Requirements: 4.1, 4.3, 14.1, 14.4
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response(
                {"error": "Tenant context required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        subscription, _ = Subscription.objects.get_or_create(
            tenant=tenant,
            defaults={'tier': Subscription.Tier.TRIAL}
        )
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)

    def post(self, request):
        """Change subscription tier or billing cycle"""
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response(
                {"error": "Tenant context required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        new_tier = request.data.get('tier')
        billing_cycle = request.data.get('billing_cycle')

        try:
            subscription = SubscriptionService.change_tier(
                subscription=tenant.subscription,
                new_tier=new_tier,
                billing_cycle=billing_cycle
            )
            return Response(SubscriptionSerializer(subscription).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionPaymentView(APIView):
    """
    Process subscription payments and track billing history.
    
    Requirements: 4.5, 4.6, 4.7
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response(
                {"error": "Tenant context required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        subscription = tenant.subscription
        gateway = request.data.get('gateway', 'STRIPE')
        simulate_failure = request.data.get('simulate_failure', False)

        payment = SubscriptionService.process_subscription_payment(
            subscription=subscription,
            gateway=gateway,
            simulate_failure=simulate_failure
        )
        serializer = SubscriptionPaymentSerializer(payment)
        status_code = status.HTTP_200_OK if payment.status == SubscriptionPayment.Status.SUCCESS else status.HTTP_402_PAYMENT_REQUIRED
        return Response(serializer.data, status=status_code)


class TenantResolveView(APIView):
    """
    Resolve tenant branding and configuration from hostname.
    Accepts X-Host header or request hostname, cached for 5 minutes.
    
    Requirements: 2.1, 2.2, 2.3, 7.6
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.core.cache import cache
        raw_host = request.headers.get('X-Host') or request.get_host()
        hostname = raw_host.split(':')[0].strip().lower()

        cache_key = f"tenant_resolve_{hostname}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # 1. Custom domain lookup
        tenant = Tenant.objects.using('default').filter(
            custom_domain=hostname,
            status__in=[Tenant.Status.ACTIVE, Tenant.Status.TRIAL]
        ).first()

        # 2. Subdomain lookup
        if not tenant:
            parts = hostname.split('.')
            if len(parts) >= 2:
                subdomain = parts[0]
                tenant = Tenant.objects.using('default').filter(
                    slug=subdomain,
                    status__in=[Tenant.Status.ACTIVE, Tenant.Status.TRIAL]
                ).first()

        # 3. Direct slug match (e.g. for development testing)
        if not tenant:
            tenant = Tenant.objects.using('default').filter(
                slug=hostname,
                status__in=[Tenant.Status.ACTIVE, Tenant.Status.TRIAL]
            ).first()

        if not tenant:
            return Response(
                {"error": f"Tenant not found for host '{hostname}'"},
                status=status.HTTP_404_NOT_FOUND
            )

        data = {
            "id": str(tenant.id),
            "slug": tenant.slug,
            "hotel_name": tenant.hotel_name,
            "logo_url": tenant.logo_url,
            "primary_color": tenant.primary_color,
            "accent_color": tenant.accent_color,
            "currency": tenant.primary_currency,
            "region": tenant.region,
            "status": tenant.status,
            "custom_domain": tenant.custom_domain,
            "tax_type": tenant.tax_type,
            "tax_rate": str(tenant.tax_rate),
            "trial_ends_at": tenant.trial_ends_at.isoformat() if tenant.trial_ends_at else None,
        }

        # Cache for 5 minutes (300 seconds)
        cache.set(cache_key, data, 300)
        return Response(data)

