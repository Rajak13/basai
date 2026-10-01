"""
Unit Tests for Payment Gateway Router and Adapters

Requirements: 5.7, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
"""
from decimal import Decimal
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import Tenant, PaymentGatewayConfig
from apps.payments.adapters import (
    EsewaAdapter,
    KhaltiAdapter,
    RazorpayAdapter,
    StripeAdapter,
)
from apps.payments.gateway_router import PaymentGatewayRouter
from apps.tenants.db_router import set_tenant_schema, clear_tenant_schema


class PaymentGatewayAdaptersTestCase(TestCase):
    databases = {'default', 'tenant_test'}

    def setUp(self):
        clear_tenant_schema()
        self.tenant = Tenant.objects.create(
            hotel_name="Siddhartha Boutique Hotel",
            slug="siddhartha-hotel",
            db_name="tenant_test",
            region="NPL",
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )

        # Configure eSewa
        self.esewa_config = PaymentGatewayConfig.objects.create(
            tenant=self.tenant,
            gateway="ESEWA",
            merchant_id="EPAYTEST",
            secret_key="8gBm/:&EnhH.1/q(",
            api_endpoint="https://rc-epay.esewa.com.np/api/epay/main/v2/form",
            is_active=True,
            test_mode=True,
        )

        # Configure Khalti
        self.khalti_config = PaymentGatewayConfig.objects.create(
            tenant=self.tenant,
            gateway="KHALTI",
            merchant_id="khalti_merchant",
            secret_key="live_secret_key_12345",
            api_endpoint="https://a.khalti.com/api/v2/epayment",
            is_active=True,
            test_mode=True,
        )

        # Configure Razorpay
        self.razorpay_config = PaymentGatewayConfig.objects.create(
            tenant=self.tenant,
            gateway="RAZORPAY",
            merchant_id="rzp_test_12345",
            secret_key="rzp_secret_67890",
            api_endpoint="https://api.razorpay.com/v1",
            is_active=True,
            test_mode=True,
        )

        # Configure Stripe
        self.stripe_config = PaymentGatewayConfig.objects.create(
            tenant=self.tenant,
            gateway="STRIPE",
            merchant_id="acct_stripe_123",
            secret_key="sk_test_stripe_456",
            api_endpoint="https://api.stripe.com/v1",
            is_active=True,
            test_mode=True,
        )

    def tearDown(self):
        clear_tenant_schema()
        super().tearDown()

    def test_payment_gateway_router_resolves_adapters(self):
        """Test PaymentGatewayRouter returns appropriate adapter instances."""
        esewa = PaymentGatewayRouter.get_adapter(self.tenant, "ESEWA")
        self.assertIsInstance(esewa, EsewaAdapter)
        self.assertEqual(esewa.merchant_id, "EPAYTEST")

        khalti = PaymentGatewayRouter.get_adapter(self.tenant, "KHALTI")
        self.assertIsInstance(khalti, KhaltiAdapter)

        razorpay = PaymentGatewayRouter.get_adapter(self.tenant, "RAZORPAY")
        self.assertIsInstance(razorpay, RazorpayAdapter)

        stripe = PaymentGatewayRouter.get_adapter(self.tenant, "STRIPE")
        self.assertIsInstance(stripe, StripeAdapter)

    def test_router_raises_for_unconfigured_gateway(self):
        """Test router raises ValueError when gateway is inactive or not configured."""
        self.esewa_config.is_active = False
        self.esewa_config.save()

        with self.assertRaises(ValueError):
            PaymentGatewayRouter.get_adapter(self.tenant, "ESEWA")

    def test_esewa_adapter_initiation_and_verification(self):
        """Test eSewa v2 signature generation and successful callback verification."""
        adapter = EsewaAdapter(config=self.esewa_config)
        init = adapter.initiate_payment(
            amount=Decimal('5000.00'),
            currency='NPR',
            callback_url='https://platform.com/callback',
            metadata={'transaction_uuid': 'TXN-123456', 'booking_reference': 'DHR-001'}
        )

        self.assertEqual(init['gateway'], 'ESEWA')
        self.assertIn('signature', init['form_fields'])
        self.assertIn('rc-epay.esewa.com.np', init['payment_url'])

        # Verify signature matching
        signature = init['form_fields']['signature']
        callback_payload = {
            'status': 'COMPLETE',
            'total_amount': '5000.00',
            'transaction_uuid': 'TXN-123456',
            'signature': signature,
            'ref_id': 'ESEWA_REF_999',
        }
        verification = adapter.verify_callback(callback_payload)
        self.assertTrue(verification['verified'])
        self.assertEqual(verification['status'], 'SUCCESS')
        self.assertEqual(verification['transaction_id'], 'TXN-123456')

    def test_khalti_adapter_initiation_and_verification(self):
        """Test Khalti initiation payload and callback verification."""
        adapter = KhaltiAdapter(config=self.khalti_config)
        init = adapter.initiate_payment(
            amount=Decimal('2500.00'),
            currency='NPR',
            callback_url='https://platform.com/khalti-callback',
            metadata={'transaction_uuid': 'TXN-KHL-123', 'booking_reference': 'DHR-002'}
        )

        self.assertEqual(init['gateway'], 'KHALTI')
        self.assertEqual(init['payload']['amount'], 250000)  # paisa
        self.assertIn('pidx', init)

        # Successful callback
        callback_payload = {
            'pidx': init['pidx'],
            'status': 'Completed',
            'total_amount': 250000,
            'purchase_order_id': 'TXN-KHL-123',
        }
        verification = adapter.verify_callback(callback_payload)
        self.assertTrue(verification['verified'])
        self.assertEqual(verification['status'], 'SUCCESS')

    def test_razorpay_adapter_order_and_signature_verification(self):
        """Test Razorpay order creation and HMAC signature verification."""
        adapter = RazorpayAdapter(config=self.razorpay_config)
        init = adapter.initiate_payment(
            amount=Decimal('3500.00'),
            currency='INR',
            callback_url='https://platform.com/razorpay-callback',
            metadata={'transaction_uuid': 'TXN-RZP-999', 'booking_reference': 'SIK-001'}
        )

        self.assertEqual(init['gateway'], 'RAZORPAY')
        order_id = init['order_id']
        payment_id = 'pay_test_987654'

        valid_signature = adapter.generate_signature(order_id, payment_id)

        # Correct signature
        callback_payload = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': valid_signature,
        }
        verification = adapter.verify_callback(callback_payload)
        self.assertTrue(verification['verified'])
        self.assertEqual(verification['status'], 'SUCCESS')

        # Invalid signature
        invalid_payload = {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': 'tampered_signature',
        }
        fail_verification = adapter.verify_callback(invalid_payload)
        self.assertFalse(fail_verification['verified'])
        self.assertEqual(fail_verification['status'], 'FAILED')

    def test_stripe_adapter_checkout_and_webhook_verification(self):
        """Test Stripe checkout creation and webhook verification."""
        adapter = StripeAdapter(config=self.stripe_config)
        init = adapter.initiate_payment(
            amount=Decimal('150.00'),
            currency='USD',
            callback_url='https://platform.com/stripe-callback',
            metadata={'transaction_uuid': 'TXN-ST-001'}
        )

        self.assertEqual(init['gateway'], 'STRIPE')
        self.assertIn('checkout.stripe.com', init['checkout_url'])

        # Successful webhook payload
        webhook_payload = {
            'type': 'checkout.session.completed',
            'data': {
                'object': {
                    'id': init['session_id'],
                    'payment_status': 'paid',
                    'amount_total': 15000,
                    'payment_intent': 'pi_stripe_123',
                }
            }
        }
        verification = adapter.verify_callback(webhook_payload)
        self.assertTrue(verification['verified'])
        self.assertEqual(verification['status'], 'SUCCESS')
        self.assertEqual(verification['amount'], Decimal('150.00'))
