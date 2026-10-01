"""
Integration tests for TenantMiddleware

Tests tenant resolution from subdomain and custom domain,
status handling, and database context setting.

Requirements: 2.1, 2.2, 2.3, 15.2, 15.3
"""
from django.test import TestCase, RequestFactory
from django.http import HttpRequest
from datetime import datetime, timedelta
from django.utils import timezone

from apps.tenants.models import Tenant
from apps.tenants.middleware import TenantMiddleware
from apps.tenants.db_router import get_tenant_schema


class TenantMiddlewareTestCase(TestCase):
    """Test suite for tenant resolution middleware"""
    
    def setUp(self):
        """Set up test data"""
        self.factory = RequestFactory()
        self.middleware = TenantMiddleware(get_response=lambda r: None)
        
        # Create test tenants
        self.active_tenant = Tenant.objects.create(
            slug='hotel-dharan',
            hotel_name='Hotel Dharan',
            db_name='tenant_dharan',
            region='NPL',
            primary_currency='NPR',
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=30),
            tax_rate=13.00
        )
        
        self.trial_tenant = Tenant.objects.create(
            slug='hotel-kathmandu',
            hotel_name='Hotel Kathmandu',
            db_name='tenant_kathmandu',
            region='NPL',
            primary_currency='NPR',
            status=Tenant.Status.TRIAL,
            trial_ends_at=timezone.now() + timedelta(days=14),
            tax_rate=13.00
        )
        
        self.suspended_tenant = Tenant.objects.create(
            slug='hotel-suspended',
            hotel_name='Hotel Suspended',
            db_name='tenant_suspended',
            region='NPL',
            primary_currency='NPR',
            status=Tenant.Status.SUSPENDED,
            trial_ends_at=timezone.now() - timedelta(days=5),
            tax_rate=13.00
        )
        
        self.cancelled_tenant = Tenant.objects.create(
            slug='hotel-cancelled',
            hotel_name='Hotel Cancelled',
            db_name='tenant_cancelled',
            region='NPL',
            primary_currency='NPR',
            status=Tenant.Status.CANCELLED,
            trial_ends_at=timezone.now() - timedelta(days=30),
            tax_rate=13.00
        )
        
        # Tenant with custom domain
        self.custom_domain_tenant = Tenant.objects.create(
            slug='hotel-premium',
            hotel_name='Hotel Premium',
            db_name='tenant_premium',
            region='NPL',
            primary_currency='NPR',
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=365),
            tax_rate=13.00,
            custom_domain='hotelpremium.com'
        )
    
    def test_subdomain_resolution_active_tenant(self):
        """
        Test: Tenant resolved from subdomain for active tenant
        Requirement 2.1: Identify tenant using subdomain-based routing
        """
        request = self.factory.get('/', HTTP_HOST='hotel-dharan.platform.com')
        response = self.middleware.process_request(request)
        
        # Should not return error response
        self.assertIsNone(response)
        
        # Should set request.tenant
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-dharan')
        
        # Should set database context
        self.assertEqual(get_tenant_schema(), 'tenant_dharan')
    
    def test_subdomain_resolution_trial_tenant(self):
        """
        Test: Trial tenant is accessible via subdomain
        Requirement 2.1: Identify tenant using subdomain-based routing
        """
        request = self.factory.get('/', HTTP_HOST='hotel-kathmandu.platform.com')
        response = self.middleware.process_request(request)
        
        self.assertIsNone(response)
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-kathmandu')
        self.assertEqual(request.tenant.status, Tenant.Status.TRIAL)
    
    def test_custom_domain_resolution(self):
        """
        Test: Tenant resolved from custom domain (CNAME)
        Requirement 2.2: Support CNAME-based routing for custom domains
        """
        request = self.factory.get('/', HTTP_HOST='hotelpremium.com')
        response = self.middleware.process_request(request)
        
        # Should resolve tenant by custom domain
        self.assertIsNone(response)
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-premium')
        self.assertEqual(request.tenant.custom_domain, 'hotelpremium.com')
        
        # Should set database context
        self.assertEqual(get_tenant_schema(), 'tenant_premium')
    
    def test_tenant_not_found(self):
        """
        Test: Returns 404 when tenant doesn't exist
        Requirement 2.3: Return 404 when no valid tenant identifier
        """
        request = self.factory.get('/', HTTP_HOST='nonexistent.platform.com')
        response = self.middleware.process_request(request)
        
        # Should return 404 response
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 404)
        self.assertIn('Hotel Not Found', response.content.decode())
    
    def test_platform_domain_no_tenant(self):
        """
        Test: Platform domains don't require tenant resolution
        Requirement 2.3: Redirect to platform landing page when no valid tenant
        """
        platform_domains = [
            'localhost',
            'platform.nantio.com',
            'www.nantio.com',
        ]
        
        for domain in platform_domains:
            request = self.factory.get('/', HTTP_HOST=domain)
            response = self.middleware.process_request(request)
            
            # Should not return error
            self.assertIsNone(response, f"Failed for domain: {domain}")
            
            # Should set tenant to None (platform mode)
            self.assertIsNone(request.tenant, f"Failed for domain: {domain}")
            
            # Should not set database context
            self.assertIsNone(get_tenant_schema(), f"Failed for domain: {domain}")
    
    def test_suspended_tenant_access_denied(self):
        """
        Test: Suspended tenant returns 402 Payment Required
        Requirements 15.2, 4.7: Suspend tenant when subscription payment fails
        """
        request = self.factory.get('/', HTTP_HOST='hotel-suspended.platform.com')
        response = self.middleware.process_request(request)
        
        # Should return 402 Payment Required
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 402)
        self.assertIn('Subscription Suspended', response.content.decode())
    
    def test_cancelled_tenant_access_denied(self):
        """
        Test: Cancelled tenant returns 403 Forbidden
        Requirement 15.3: Handle cancelled subscription status
        """
        request = self.factory.get('/', HTTP_HOST='hotel-cancelled.platform.com')
        response = self.middleware.process_request(request)
        
        # Should return 403 Forbidden
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 403)
        self.assertIn('Subscription Cancelled', response.content.decode())
    
    def test_hostname_with_port(self):
        """
        Test: Middleware correctly strips port from hostname
        """
        request = self.factory.get('/', HTTP_HOST='hotel-dharan.platform.com:8000')
        response = self.middleware.process_request(request)
        
        # Should resolve tenant correctly
        self.assertIsNone(response)
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-dharan')
    
    def test_case_insensitive_hostname(self):
        """
        Test: Hostname resolution is case-insensitive
        """
        request = self.factory.get('/', HTTP_HOST='HOTEL-DHARAN.PLATFORM.COM')
        response = self.middleware.process_request(request)
        
        # Should resolve tenant (hostname normalized to lowercase)
        self.assertIsNone(response)
        self.assertIsNotNone(request.tenant)
        self.assertEqual(request.tenant.slug, 'hotel-dharan')
    
    def test_subdomain_priority_over_custom_domain(self):
        """
        Test: Custom domain checked first, then subdomain
        Requirement 2.2: Custom domain has priority in resolution
        """
        # Access via custom domain
        request1 = self.factory.get('/', HTTP_HOST='hotelpremium.com')
        response1 = self.middleware.process_request(request1)
        
        self.assertIsNone(response1)
        self.assertEqual(request1.tenant.slug, 'hotel-premium')
        
        # Access same tenant via subdomain
        request2 = self.factory.get('/', HTTP_HOST='hotel-premium.platform.com')
        response2 = self.middleware.process_request(request2)
        
        self.assertIsNone(response2)
        self.assertEqual(request2.tenant.slug, 'hotel-premium')
    
    def test_process_response_clears_context(self):
        """
        Test: Middleware clears tenant context after request
        Ensures no context leakage between requests
        """
        # Set up request with tenant
        request = self.factory.get('/', HTTP_HOST='hotel-dharan.platform.com')
        self.middleware.process_request(request)
        
        # Verify context is set
        self.assertEqual(get_tenant_schema(), 'tenant_dharan')
        
        # Process response (simulate request completion)
        from django.http import HttpResponse
        response = HttpResponse()
        self.middleware.process_response(request, response)
        
        # Context should be cleared
        self.assertIsNone(get_tenant_schema())
    
    def test_process_exception_clears_context(self):
        """
        Test: Middleware clears tenant context on exception
        Ensures clean state for next request
        """
        # Set up request with tenant
        request = self.factory.get('/', HTTP_HOST='hotel-dharan.platform.com')
        self.middleware.process_request(request)
        
        # Verify context is set
        self.assertEqual(get_tenant_schema(), 'tenant_dharan')
        
        # Simulate exception
        self.middleware.process_exception(request, Exception("Test error"))
        
        # Context should be cleared
        self.assertIsNone(get_tenant_schema())
