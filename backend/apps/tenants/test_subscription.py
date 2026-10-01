"""
Unit and Integration Tests for Subscription Management Service

Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 6.6, 8.5, 8.6, 11.3, 14.3, 14.4, 14.5, 15.2
"""
from decimal import Decimal
from datetime import timedelta
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import Tenant, Subscription, SubscriptionPayment, TenantMembership
from apps.tenants.subscription_service import (
    SubscriptionService,
    QuotaExceededException,
    TenantSuspendedException,
    TIER_CONFIGS,
)
from apps.tenants.db_router import set_tenant_schema, clear_tenant_schema
from apps.rooms.models import Room, RoomCategory

User = get_user_model()


class SubscriptionServiceTestCase(TestCase):
    """Unit tests for SubscriptionService quota enforcement and lifecycle."""

    def setUp(self):
        clear_tenant_schema()
        self.tenant = Tenant.objects.create(
            hotel_name="Himalayan Heights",
            slug="himalayan-heights",
            db_name="default",  # using default DB for test execution
            region="NPL",
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )

        self.subscription = Subscription.objects.create(
            tenant=self.tenant,
            tier=Subscription.Tier.TRIAL,
            max_rooms=5,
            max_staff=3,
            max_monthly_bookings=50,
            billing_cycle=Subscription.BillingCycle.MONTHLY,
            price_usd=Decimal('0.00'),
            next_billing_date=timezone.now().date() + timedelta(days=14),
        )

        self.user = User.objects.create_user(
            username="owner@himalayan.com",
            email="owner@himalayan.com",
            password="SecurePassword123!",
        )
        TenantMembership.objects.create(
            user=self.user,
            tenant=self.tenant,
            role=TenantMembership.Role.OWNER,
            is_active=True,
        )

    def tearDown(self):
        clear_tenant_schema()
        super().tearDown()

    def test_check_resource_quota_staff_success_and_exceeded(self):
        """Test staff quota enforcement succeeds below limit and fails when exceeded."""
        # Current staff count is 1 (the owner). Limit is 3.
        # Adding 1 more staff should succeed (1 + 1 <= 3)
        self.assertTrue(SubscriptionService.check_resource_quota(self.tenant, 'staff', increment=1))

        # Add 2 more staff to reach limit of 3
        u2 = User.objects.create_user(username="staff2@test.com", email="staff2@test.com")
        u3 = User.objects.create_user(username="staff3@test.com", email="staff3@test.com")
        TenantMembership.objects.create(user=u2, tenant=self.tenant, role=TenantMembership.Role.FRONT_DESK)
        TenantMembership.objects.create(user=u3, tenant=self.tenant, role=TenantMembership.Role.HOUSEKEEPING)

        # Adding 1 more staff should now raise QuotaExceededException (3 + 1 > 3)
        with self.assertRaises(QuotaExceededException) as ctx:
            SubscriptionService.check_resource_quota(self.tenant, 'staff', increment=1)
        self.assertEqual(ctx.exception.resource_type, 'staff')
        self.assertEqual(ctx.exception.current_count, 3)
        self.assertEqual(ctx.exception.limit, 3)

    @patch('apps.rooms.models.Room.objects.using')
    def test_check_resource_quota_rooms(self, mock_room_using):
        """Test room quota enforcement using mocked count."""
        mock_qs = MagicMock()
        mock_qs.count.return_value = 4
        mock_room_using.return_value = mock_qs

        # 4 + 1 <= 5: allowed
        self.assertTrue(SubscriptionService.check_resource_quota(self.tenant, 'rooms', increment=1))

        # 4 + 2 > 5: exceeded
        with self.assertRaises(QuotaExceededException) as ctx:
            SubscriptionService.check_resource_quota(self.tenant, 'rooms', increment=2)
        self.assertEqual(ctx.exception.resource_type, 'rooms')

    @patch('apps.reservations.models.Reservation.objects.using')
    def test_check_resource_quota_bookings(self, mock_res_using):
        """Test booking quota enforcement using mocked count."""
        mock_qs = MagicMock()
        mock_filter = MagicMock()
        mock_filter.count.return_value = 50
        mock_qs.filter.return_value = mock_filter
        mock_res_using.return_value = mock_qs

        # 50 + 1 > 50: exceeded
        with self.assertRaises(QuotaExceededException) as ctx:
            SubscriptionService.check_resource_quota(self.tenant, 'bookings', increment=1)
        self.assertEqual(ctx.exception.resource_type, 'bookings')

    def test_suspended_tenant_raises_tenant_suspended_exception(self):
        """Test suspended tenant raises TenantSuspendedException on quota check."""
        self.tenant.status = Tenant.Status.SUSPENDED
        self.tenant.save()

        with self.assertRaises(TenantSuspendedException):
            SubscriptionService.check_resource_quota(self.tenant, 'staff')

    def test_change_tier_upgrades_quotas_and_features(self):
        """Test upgrading to PROFESSIONAL tier expands quotas and feature flags."""
        sub = SubscriptionService.change_tier(
            subscription=self.subscription,
            new_tier=Subscription.Tier.PROFESSIONAL,
            billing_cycle=Subscription.BillingCycle.MONTHLY,
        )
        self.assertEqual(sub.tier, Subscription.Tier.PROFESSIONAL)
        self.assertEqual(sub.max_rooms, 50)
        self.assertEqual(sub.max_staff, 15)
        self.assertEqual(sub.max_monthly_bookings, 500)
        self.assertTrue(sub.allow_custom_domain)
        self.assertEqual(sub.price_usd, Decimal('79.00'))

    def test_change_tier_annual_discount(self):
        """Test annual billing cycle applies 10% discount."""
        sub = SubscriptionService.change_tier(
            subscription=self.subscription,
            new_tier=Subscription.Tier.STARTER,
            billing_cycle=Subscription.BillingCycle.ANNUAL,
        )
        # STARTER is 29/mo -> 29 * 12 * 0.90 = 313.20
        self.assertEqual(sub.price_usd, Decimal('313.20'))

    def test_payment_processing_success_flow(self):
        """Test successful subscription payment advances next billing date."""
        self.tenant.status = Tenant.Status.SUSPENDED
        self.tenant.save()

        initial_billing_date = timezone.now().date()
        payment = SubscriptionService.process_subscription_payment(
            subscription=self.subscription,
            amount=Decimal('29.00'),
            gateway="STRIPE",
        )

        self.assertEqual(payment.status, SubscriptionPayment.Status.SUCCESS)
        self.assertEqual(payment.amount, Decimal('29.00'))
        self.subscription.refresh_from_db()
        self.tenant.refresh_from_db()

        # Tenant reinstated to ACTIVE
        self.assertEqual(self.tenant.status, Tenant.Status.ACTIVE)
        # Next billing date moved forward by 30 days
        self.assertEqual(self.subscription.next_billing_date, initial_billing_date + timedelta(days=30))

    def test_payment_processing_failure_suspends_tenant(self):
        """Test failed subscription payment creates FAILED record and suspends tenant."""
        self.assertEqual(self.tenant.status, Tenant.Status.ACTIVE)

        payment = SubscriptionService.process_subscription_payment(
            subscription=self.subscription,
            simulate_failure=True,
            error_message="Insufficient funds in card",
        )

        self.assertEqual(payment.status, SubscriptionPayment.Status.FAILED)
        self.tenant.refresh_from_db()
        self.assertEqual(self.tenant.status, Tenant.Status.SUSPENDED)


class SubscriptionApiIntegrationTestCase(TestCase):
    """Integration tests for Subscription and Staff API endpoints."""

    def setUp(self):
        self.client = APIClient()
        self.tenant = Tenant.objects.create(
            hotel_name="Resort Pokhara",
            slug="resort-pokhara",
            db_name="default",
            region="NPL",
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )
        self.subscription = Subscription.objects.create(
            tenant=self.tenant,
            tier=Subscription.Tier.TRIAL,
            max_rooms=1,
            max_staff=2,
            max_monthly_bookings=10,
            billing_cycle=Subscription.BillingCycle.MONTHLY,
            price_usd=Decimal('0.00'),
        )
        self.owner = User.objects.create_user(
            username="owner@resort.com",
            email="owner@resort.com",
            password="SecurePassword123!",
        )
        TenantMembership.objects.create(
            user=self.owner,
            tenant=self.tenant,
            role=TenantMembership.Role.OWNER,
            is_active=True,
        )
        self.client.force_authenticate(user=self.owner)

    def test_staff_creation_respects_quota(self):
        """Test creating staff via API respects subscription staff quota."""
        # Request with tenant context attached via subdomain
        headers = {'HTTP_HOST': 'resort-pokhara.nantio.com'}

        # Currently 1 member (owner), max is 2.
        # Adding 1st staff should succeed (now 2)
        response = self.client.post(
            '/api/tenants/staff/',
            {'email': 'staff1@resort.com', 'role': 'FRONT_DESK'},
            format='json',
            **headers
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # Adding 2nd staff should exceed quota (2 + 1 > 2) -> 403 Forbidden
        response = self.client.post(
            '/api/tenants/staff/',
            {'email': 'staff2@resort.com', 'role': 'FRONT_DESK'},
            format='json',
            **headers
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get('code'), 'QUOTA_EXCEEDED')

    def test_subscription_upgrade_via_api(self):
        """Test upgrading tier via /api/tenants/subscription/ API."""
        headers = {'HTTP_HOST': 'resort-pokhara.nantio.com'}
        response = self.client.post(
            '/api/tenants/subscription/',
            {'tier': 'PROFESSIONAL', 'billing_cycle': 'MONTHLY'},
            format='json',
            **headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['tier'], 'PROFESSIONAL')
        self.assertEqual(response.data['max_rooms'], 50)
        self.assertEqual(response.data['max_staff'], 15)

    def test_subscription_payment_api(self):
        """Test processing payment via /api/tenants/subscription/pay/ API."""
        headers = {'HTTP_HOST': 'resort-pokhara.nantio.com'}
        response = self.client.post(
            '/api/tenants/subscription/pay/',
            {'gateway': 'STRIPE'},
            format='json',
            **headers
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'SUCCESS')
