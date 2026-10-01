"""
Integration Tests for Hotel Onboarding Flow

Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
"""
from decimal import Decimal
from unittest.mock import patch
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import Tenant, PaymentGatewayConfig
from apps.tenants.onboarding_service import (
    OnboardingService,
    EmailVerificationService,
)
from apps.tenants.db_router import set_tenant_schema, clear_tenant_schema
from apps.rooms.models import RoomCategory

User = get_user_model()


class OnboardingFlowIntegrationTestCase(TestCase):
    databases = {'default', 'tenant_test'}

    def setUp(self):
        clear_tenant_schema()
        self.client = APIClient()

    def tearDown(self):
        clear_tenant_schema()
        super().tearDown()

    def test_check_slug_availability(self):
        """Test slug availability validation endpoint."""
        # Valid available slug
        res = self.client.post('/api/onboarding/check-slug', {'slug': 'hotel-everest'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['available'])

        # Reserved slug
        res = self.client.post('/api/onboarding/check-slug', {'slug': 'admin'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['available'])

        # Invalid formatting (spaces / uppercase / special chars)
        res = self.client.post('/api/onboarding/check-slug', {'slug': 'Hotel Everest!'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(res.data['available'])

    def test_complete_onboarding_lifecycle(self):
        """
        Test the end-to-end multi-step onboarding lifecycle:
        1. Create tenant & owner user
        2. Verify email
        3. Configure tax & currency
        4. Configure payment gateway
        5. Create initial room categories
        6. Finalize onboarding and verify active status
        """
        # Step 1: Create tenant
        create_payload = {
            'hotel_name': 'Himalayan Luxury Inn',
            'slug': 'himalayan-inn',
            'region': 'NPL',
            'owner_email': 'owner@himalayaninn.com',
            'owner_password': 'SecurePassword123!',
            'mock_db': True,
        }
        res_step1 = self.client.post('/api/onboarding/create-tenant', create_payload, format='json')
        self.assertEqual(res_step1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res_step1.data['tenant_slug'], 'himalayan-inn')
        token = res_step1.data['verification_token']
        self.assertTrue(token)

        tenant = Tenant.objects.get(slug='himalayan-inn')
        self.assertEqual(tenant.status, Tenant.Status.TRIAL)

        # Step 2: Verify email
        res_step2 = self.client.post('/api/onboarding/verify-email', {'token': token}, format='json')
        self.assertEqual(res_step2.status_code, status.HTTP_200_OK)
        self.assertTrue(res_step2.data['verified'])

        owner = User.objects.get(email='owner@himalayaninn.com')
        self.assertTrue(owner.email_verified)

        # Step 3: Configure tax
        tax_payload = {
            'tenant_slug': 'himalayan-inn',
            'tax_type': 'VAT',
            'tax_rate': '13.00',
            'tax_registration_number': 'PAN-987654321',
            'primary_currency': 'NPR',
        }
        res_step3 = self.client.post('/api/onboarding/configure-tax', tax_payload, format='json')
        self.assertEqual(res_step3.status_code, status.HTTP_200_OK)
        tenant.refresh_from_db()
        self.assertEqual(tenant.tax_type, 'VAT')
        self.assertEqual(tenant.tax_rate, Decimal('13.00'))

        # Step 4: Configure payment gateway
        payment_payload = {
            'tenant_slug': 'himalayan-inn',
            'gateway': 'ESEWA',
            'merchant_id': 'EPAYTEST',
            'secret_key': 'test_secret_key',
            'test_mode': True,
        }
        res_step4 = self.client.post('/api/onboarding/configure-payment', payment_payload, format='json')
        self.assertEqual(res_step4.status_code, status.HTTP_200_OK)
        config = PaymentGatewayConfig.objects.get(tenant=tenant, gateway='ESEWA')
        self.assertEqual(config.merchant_id, 'EPAYTEST')

        # Step 5: Create initial room categories (in tenant_test DB)
        tenant.db_name = 'tenant_test'
        tenant.save()

        rooms_payload = {
            'tenant_slug': 'himalayan-inn',
            'categories': [
                {'name': 'Deluxe Room', 'price': '5000.00', 'max_occupancy': 2},
                {'name': 'Executive Suite', 'price': '10000.00', 'max_occupancy': 4},
            ]
        }
        res_step5 = self.client.post('/api/onboarding/create-rooms', rooms_payload, format='json')
        self.assertEqual(res_step5.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res_step5.data['categories']), 2)

        set_tenant_schema('tenant_test')
        cat_count = RoomCategory.objects.using('tenant_test').filter(slug__in=['deluxe-room', 'executive-suite']).count()
        self.assertEqual(cat_count, 2)

        # Step 6: Finalize onboarding
        res_step6 = self.client.post('/api/onboarding/complete', {'tenant_slug': 'himalayan-inn'}, format='json')
        self.assertEqual(res_step6.status_code, status.HTTP_200_OK)
        tenant.refresh_from_db()
        self.assertEqual(tenant.status, Tenant.Status.ACTIVE)

    def test_invalid_email_verification_token(self):
        """Test invalid token returns 400 error."""
        res = self.client.post('/api/onboarding/verify-email', {'token': 'invalid-tampered-token'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', res.data)
