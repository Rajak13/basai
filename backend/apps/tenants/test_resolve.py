"""
Tests for /api/tenants/resolve endpoint.

Requirements: 2.1, 2.2, 2.3, 7.6
"""
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import Tenant
from apps.tenants.db_router import clear_tenant_schema


class TenantResolveApiTestCase(TestCase):
    databases = {'default', 'tenant_test'}

    def setUp(self):
        cache.clear()
        clear_tenant_schema()
        self.client = APIClient()

        self.tenant = Tenant.objects.create(
            hotel_name="Hotel Nirvana Dharan",
            slug="nirvana-dharan",
            db_name="tenant_nirvana_test",
            region="NPL",
            primary_currency="NPR",
            primary_color="#1A4D2E",
            accent_color="#E8DFCA",
            custom_domain="hotel-nirvana.com",
            tax_type="VAT",
            tax_rate=Decimal('13.00'),
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )

    def tearDown(self):
        cache.clear()
        clear_tenant_schema()
        super().tearDown()

    def test_resolve_by_subdomain(self):
        """Test resolving tenant by subdomain in Host header."""
        response = self.client.get(
            '/api/tenants/resolve',
            HTTP_HOST='nirvana-dharan.nantio.com'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'nirvana-dharan')
        self.assertEqual(response.data['hotel_name'], 'Hotel Nirvana Dharan')
        self.assertEqual(response.data['primary_color'], '#1A4D2E')
        self.assertEqual(response.data['currency'], 'NPR')

    def test_resolve_by_custom_domain(self):
        """Test resolving tenant by custom domain."""
        response = self.client.get(
            '/api/tenants/resolve',
            HTTP_HOST='hotel-nirvana.com'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'nirvana-dharan')

    def test_resolve_by_x_host_header(self):
        """Test resolving tenant using explicit X-Host header."""
        response = self.client.get(
            '/api/tenants/resolve',
            HTTP_X_HOST='nirvana-dharan.localhost'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['slug'], 'nirvana-dharan')

    def test_resolve_unknown_host_returns_404(self):
        """Test resolving unknown host returns 404."""
        response = self.client.get(
            '/api/tenants/resolve',
            HTTP_HOST='unknown-hotel.nantio.com'
        )
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_resolve_caching(self):
        """Test response is cached in Django cache for 5 minutes."""
        response = self.client.get(
            '/api/tenants/resolve',
            HTTP_HOST='nirvana-dharan.nantio.com'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        cached = cache.get("tenant_resolve_nirvana-dharan.nantio.com")
        self.assertIsNotNone(cached)
        self.assertEqual(cached['slug'], 'nirvana-dharan')
