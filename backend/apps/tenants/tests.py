"""
Unit tests for Tenant models and provisioning service
"""
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from apps.accounts.models import User
from .models import Tenant, Subscription, TenantMembership, PaymentGatewayConfig
from .services import TenantProvisioningService, TenantProvisioningError


class TenantModelTest(TestCase):
    """Test Tenant model creation and validation"""
    
    def setUp(self):
        """Set up test data"""
        self.trial_end = timezone.now() + timedelta(days=14)
    
    def test_create_tenant_with_required_fields(self):
        """Test creating a tenant with minimum required fields"""
        tenant = Tenant.objects.create(
            slug='hotel-dharan',
            hotel_name='Hotel Dharan',
            db_name='tenant_dharan',
            region='NPL',
            trial_ends_at=self.trial_end
        )
        
        self.assertEqual(tenant.slug, 'hotel-dharan')
        self.assertEqual(tenant.hotel_name, 'Hotel Dharan')
        self.assertEqual(tenant.status, Tenant.Status.TRIAL)
        self.assertEqual(tenant.primary_currency, 'NPR')
        self.assertEqual(tenant.primary_color, '#3B60C5')
        self.assertEqual(tenant.accent_color, '#EC633D')
    
    def test_tenant_slug_validation(self):
        """Test that slug only accepts lowercase alphanumeric and hyphens"""
        # Valid slug
        tenant = Tenant.objects.create(
            slug='hotel-123-abc',
            hotel_name='Test Hotel',
            db_name='tenant_test',
            region='NPL',
            trial_ends_at=self.trial_end
        )
        self.assertEqual(tenant.slug, 'hotel-123-abc')
    
    def test_tenant_unique_slug(self):
        """Test that slug must be unique"""
        Tenant.objects.create(
            slug='hotel-unique',
            hotel_name='Hotel A',
            db_name='tenant_a',
            region='NPL',
            trial_ends_at=self.trial_end
        )
        
        # Should raise IntegrityError when trying to create duplicate slug
        with self.assertRaises(Exception):
            Tenant.objects.create(
                slug='hotel-unique',
                hotel_name='Hotel B',
                db_name='tenant_b',
                region='NPL',
                trial_ends_at=self.trial_end
            )
    
    def test_tenant_database_config(self):
        """Test get_database_config method"""
        tenant = Tenant.objects.create(
            slug='hotel-test',
            hotel_name='Test Hotel',
            db_name='tenant_test_db',
            db_host='localhost',
            db_port=5432,
            region='NPL',
            trial_ends_at=self.trial_end
        )
        
        config = tenant.get_database_config()
        
        self.assertEqual(config['ENGINE'], 'django.db.backends.postgresql')
        self.assertEqual(config['NAME'], 'tenant_test_db')
        self.assertEqual(config['HOST'], 'localhost')
        self.assertEqual(config['PORT'], 5432)


class SubscriptionModelTest(TestCase):
    """Test Subscription model"""
    
    def setUp(self):
        """Set up test tenant"""
        self.trial_end = timezone.now() + timedelta(days=14)
        self.tenant = Tenant.objects.create(
            slug='hotel-test',
            hotel_name='Test Hotel',
            db_name='tenant_test',
            region='NPL',
            trial_ends_at=self.trial_end
        )
    
    def test_create_subscription_with_defaults(self):
        """Test creating subscription with default values"""
        subscription = Subscription.objects.create(tenant=self.tenant)
        
        self.assertEqual(subscription.tier, Subscription.Tier.TRIAL)
        self.assertEqual(subscription.max_rooms, 5)
        self.assertEqual(subscription.max_staff, 3)
        self.assertEqual(subscription.max_monthly_bookings, 50)
        self.assertEqual(subscription.billing_cycle, Subscription.BillingCycle.MONTHLY)
        self.assertFalse(subscription.allow_custom_domain)
        self.assertFalse(subscription.allow_api_access)
        self.assertFalse(subscription.allow_white_label)
    
    def test_create_professional_subscription(self):
        """Test creating a professional tier subscription"""
        subscription = Subscription.objects.create(
            tenant=self.tenant,
            tier=Subscription.Tier.PROFESSIONAL,
            max_rooms=50,
            max_staff=10,
            max_monthly_bookings=500,
            price_usd=99.99,
            allow_custom_domain=True
        )
        
        self.assertEqual(subscription.tier, Subscription.Tier.PROFESSIONAL)
        self.assertEqual(subscription.max_rooms, 50)
        self.assertTrue(subscription.allow_custom_domain)


class TenantMembershipModelTest(TestCase):
    """Test TenantMembership model"""
    
    def setUp(self):
        """Set up test data"""
        self.trial_end = timezone.now() + timedelta(days=14)
        self.tenant = Tenant.objects.create(
            slug='hotel-test',
            hotel_name='Test Hotel',
            db_name='tenant_test',
            region='NPL',
            trial_ends_at=self.trial_end
        )
        
        self.user = User.objects.create_user(
            username='owner@hotel.com',
            email='owner@hotel.com',
            password='testpass123'
        )
    
    def test_create_owner_membership(self):
        """Test creating an owner membership"""
        membership = TenantMembership.objects.create(
            user=self.user,
            tenant=self.tenant,
            role=TenantMembership.Role.OWNER
        )
        
        self.assertEqual(membership.user, self.user)
        self.assertEqual(membership.tenant, self.tenant)
        self.assertEqual(membership.role, TenantMembership.Role.OWNER)
        self.assertTrue(membership.is_active)
    
    def test_unique_user_tenant_combination(self):
        """Test that a user can only have one membership per tenant"""
        TenantMembership.objects.create(
            user=self.user,
            tenant=self.tenant,
            role=TenantMembership.Role.OWNER
        )
        
        # Should raise IntegrityError for duplicate user-tenant combination
        with self.assertRaises(Exception):
            TenantMembership.objects.create(
                user=self.user,
                tenant=self.tenant,
                role=TenantMembership.Role.MANAGER
            )
    
    def test_user_multiple_tenants(self):
        """Test that a user can have memberships in multiple tenants"""
        tenant2 = Tenant.objects.create(
            slug='hotel-second',
            hotel_name='Second Hotel',
            db_name='tenant_second',
            region='IND',
            trial_ends_at=self.trial_end
        )
        
        membership1 = TenantMembership.objects.create(
            user=self.user,
            tenant=self.tenant,
            role=TenantMembership.Role.OWNER
        )
        
        membership2 = TenantMembership.objects.create(
            user=self.user,
            tenant=tenant2,
            role=TenantMembership.Role.MANAGER
        )
        
        self.assertEqual(self.user.memberships.count(), 2)
        self.assertNotEqual(membership1.tenant, membership2.tenant)


class PaymentGatewayConfigModelTest(TestCase):
    """Test PaymentGatewayConfig model"""
    
    def setUp(self):
        """Set up test tenant"""
        self.trial_end = timezone.now() + timedelta(days=14)
        self.tenant = Tenant.objects.create(
            slug='hotel-test',
            hotel_name='Test Hotel',
            db_name='tenant_test',
            region='NPL',
            trial_ends_at=self.trial_end
        )
    
    def test_create_payment_gateway_config(self):
        """Test creating a payment gateway configuration"""
        config = PaymentGatewayConfig.objects.create(
            tenant=self.tenant,
            gateway='ESEWA',
            merchant_id='ESEWA-12345',
            secret_key='secret_key_here',
            api_endpoint='https://esewa.com.np/api'
        )
        
        self.assertEqual(config.tenant, self.tenant)
        self.assertEqual(config.gateway, 'ESEWA')
        self.assertTrue(config.is_active)
        self.assertTrue(config.test_mode)
    
    def test_unique_tenant_gateway_combination(self):
        """Test that a tenant can only have one config per gateway"""
        PaymentGatewayConfig.objects.create(
            tenant=self.tenant,
            gateway='KHALTI',
            merchant_id='KHALTI-12345',
            secret_key='secret',
            api_endpoint='https://khalti.com/api'
        )
        
        # Should raise IntegrityError for duplicate tenant-gateway combination
        with self.assertRaises(Exception):
            PaymentGatewayConfig.objects.create(
                tenant=self.tenant,
                gateway='KHALTI',
                merchant_id='KHALTI-67890',
                secret_key='secret2',
                api_endpoint='https://khalti.com/api'
            )
    
    def test_tenant_multiple_gateways(self):
        """Test that a tenant can have multiple payment gateway configs"""
        PaymentGatewayConfig.objects.create(
            tenant=self.tenant,
            gateway='ESEWA',
            merchant_id='ESEWA-12345',
            secret_key='secret',
            api_endpoint='https://esewa.com.np/api'
        )
        
        PaymentGatewayConfig.objects.create(
            tenant=self.tenant,
            gateway='KHALTI',
            merchant_id='KHALTI-12345',
            secret_key='secret',
            api_endpoint='https://khalti.com/api'
        )
        
        self.assertEqual(self.tenant.payment_configs.count(), 2)


class TenantMiddlewareTest(TestCase):
    """
    Test tenant resolution middleware functionality
    
    Requirements: 1.1, 1.3, 2.1, 2.2, 2.3, 15.2, 15.3
    """
    
    def setUp(self):
        """Set up test fixtures"""
        from django.test import RequestFactory
        from django.http import HttpResponse
        from apps.tenants.middleware import TenantMiddleware
        
        self.factory = RequestFactory()
        self.middleware = TenantMiddleware(get_response=lambda r: HttpResponse("OK"))
        
        # Create test tenants with different statuses
        self.active_tenant = Tenant.objects.create(
            slug='hotel-dharan',
            hotel_name='Hotel Dharan',
            db_name='tenant_dharan',
            region='NPL',
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=30)
        )
        
        self.trial_tenant = Tenant.objects.create(
            slug='hotel-trial',
            hotel_name='Hotel Trial',
            db_name='tenant_trial',
            region='IND',
            status=Tenant.Status.TRIAL,
            trial_ends_at=timezone.now() + timedelta(days=14)
        )
        
        self.suspended_tenant = Tenant.objects.create(
            slug='hotel-suspended',
            hotel_name='Hotel Suspended',
            db_name='tenant_suspended',
            region='BGD',
            status=Tenant.Status.SUSPENDED,
            trial_ends_at=timezone.now() - timedelta(days=5)
        )
        
        self.cancelled_tenant = Tenant.objects.create(
            slug='hotel-cancelled',
            hotel_name='Hotel Cancelled',
            db_name='tenant_cancelled',
            region='LKR',
            status=Tenant.Status.CANCELLED,
            trial_ends_at=timezone.now() - timedelta(days=30)
        )
        
        # Tenant with custom domain
        self.custom_domain_tenant = Tenant.objects.create(
            slug='hotel-custom',
            hotel_name='Hotel Custom',
            db_name='tenant_custom',
            region='PAK',
            status=Tenant.Status.ACTIVE,
            custom_domain='myboutique.com',
            trial_ends_at=timezone.now() + timedelta(days=30)
        )
    
    def tearDown(self):
        """Clean up after tests"""
        from apps.tenants.db_router import clear_tenant_schema
        clear_tenant_schema()
    
    def test_subdomain_resolution_active_tenant(self):
        """Test successful tenant resolution via subdomain for active tenant"""
        from apps.tenants.db_router import get_tenant_schema
        
        request = self.factory.get('/', HTTP_HOST='hotel-dharan.nantio.com')
        response = self.middleware.process_request(request)
        
        # Should allow request to continue (return None)
        self.assertIsNone(response)
        
        # Should set tenant on request
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-dharan')
        self.assertEqual(request.tenant.status, Tenant.Status.ACTIVE)
        
        # Should set database context
        self.assertEqual(get_tenant_schema(), 'tenant_dharan')
    
    def test_subdomain_resolution_trial_tenant(self):
        """Test successful tenant resolution for trial tenant"""
        from apps.tenants.db_router import get_tenant_schema
        
        request = self.factory.get('/', HTTP_HOST='hotel-trial.nantio.com')
        response = self.middleware.process_request(request)
        
        self.assertIsNone(response)
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-trial')
        self.assertEqual(request.tenant.status, Tenant.Status.TRIAL)
        self.assertEqual(get_tenant_schema(), 'tenant_trial')
    
    def test_custom_domain_resolution(self):
        """Test tenant resolution via custom domain"""
        from apps.tenants.db_router import get_tenant_schema
        from django.http import HttpResponseNotFound
        
        request = self.factory.get('/', HTTP_HOST='myboutique.com')
        response = self.middleware.process_request(request)
        
        self.assertIsNone(response)
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-custom')
        self.assertEqual(request.tenant.custom_domain, 'myboutique.com')
        self.assertEqual(get_tenant_schema(), 'tenant_custom')
    
    def test_suspended_tenant_returns_402(self):
        """Test that suspended tenant returns 402 Payment Required"""
        from django.http import HttpResponse
        
        request = self.factory.get('/', HTTP_HOST='hotel-suspended.nantio.com')
        response = self.middleware.process_request(request)
        
        # Should return HTTP 402 response
        self.assertIsInstance(response, HttpResponse)
        self.assertEqual(response.status_code, 402)
        self.assertIn('suspended', response.content.decode().lower())
    
    def test_cancelled_tenant_returns_403(self):
        """Test that cancelled tenant returns 403 Forbidden"""
        from django.http import HttpResponse
        
        request = self.factory.get('/', HTTP_HOST='hotel-cancelled.nantio.com')
        response = self.middleware.process_request(request)
        
        self.assertIsInstance(response, HttpResponse)
        self.assertEqual(response.status_code, 403)
        self.assertIn('cancelled', response.content.decode().lower())
    
    def test_nonexistent_tenant_returns_404(self):
        """Test that non-existent tenant returns 404"""
        from django.http import HttpResponseNotFound
        
        request = self.factory.get('/', HTTP_HOST='nonexistent.nantio.com')
        response = self.middleware.process_request(request)
        
        self.assertIsInstance(response, HttpResponseNotFound)
        self.assertEqual(response.status_code, 404)
    
    def test_platform_domain_no_tenant(self):
        """Test platform domains don't resolve to tenants"""
        platform_domains = [
            'nantio.com',
            'www.nantio.com',
            'localhost',
            '127.0.0.1',
        ]
        
        for domain in platform_domains:
            request = self.factory.get('/', HTTP_HOST=domain)
            response = self.middleware.process_request(request)
            
            # Should allow request to continue
            self.assertIsNone(response, f"Failed for domain: {domain}")
            
            # Should set tenant to None (platform mode)
            self.assertIsNone(request.tenant, f"Failed for domain: {domain}")
    
    def test_hostname_with_port(self):
        """Test hostname with port number is handled correctly"""
        request = self.factory.get('/', HTTP_HOST='hotel-dharan.nantio.com:8000')
        response = self.middleware.process_request(request)
        
        self.assertIsNone(response)
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-dharan')
    
    def test_case_insensitive_hostname(self):
        """Test hostname resolution is case-insensitive"""
        request = self.factory.get('/', HTTP_HOST='Hotel-Dharan.NANTIO.COM')
        response = self.middleware.process_request(request)
        
        self.assertIsNone(response)
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-dharan')
    
    def test_tenant_context_cleanup(self):
        """Test that tenant context is cleaned up after response"""
        from apps.tenants.db_router import get_tenant_schema
        from django.http import HttpResponse
        
        request = self.factory.get('/', HTTP_HOST='hotel-dharan.nantio.com')
        self.middleware.process_request(request)
        
        # Verify context is set
        self.assertEqual(get_tenant_schema(), 'tenant_dharan')
        
        # Process response to trigger cleanup
        response = HttpResponse("OK")
        self.middleware.process_response(request, response)
        
        # Verify context is cleared
        self.assertIsNone(get_tenant_schema())
    
    def test_archived_tenant_returns_410(self):
        """Test that archived tenant returns 410 Gone"""
        from django.http import HttpResponse
        
        archived_tenant = Tenant.objects.create(
            slug='hotel-archived',
            hotel_name='Hotel Archived',
            db_name='tenant_archived',
            region='BTN',
            status=Tenant.Status.ARCHIVED,
            trial_ends_at=timezone.now() - timedelta(days=100)
        )
        
        request = self.factory.get('/', HTTP_HOST='hotel-archived.nantio.com')
        response = self.middleware.process_request(request)
        
        self.assertIsInstance(response, HttpResponse)
        self.assertEqual(response.status_code, 410)
        self.assertIn('archived', response.content.decode().lower())
