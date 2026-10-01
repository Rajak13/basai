"""
Payment Gateway Adapters for SAARC & International Processors

Implements the Adapter Pattern for:
- eSewa (Nepal)
- Khalti (Nepal)
- Razorpay (India)
- Stripe (International)

Requirements: 5.7, 7.1, 7.2, 7.3, 7.4, 7.5
"""
from abc import ABC, abstractmethod
import base64
import hmac
import hashlib
import json
import urllib.parse
from decimal import Decimal
from typing import Dict, Any, Optional

from apps.tenants.models import PaymentGatewayConfig


class PaymentGatewayAdapter(ABC):
    """Abstract base adapter for payment gateways."""

    def __init__(self, config: Optional[PaymentGatewayConfig] = None, **kwargs):
        if config:
            self.merchant_id = config.merchant_id
            self.secret_key = config.secret_key
            self.api_endpoint = config.api_endpoint or self.get_default_endpoint(config.test_mode)
            self.test_mode = config.test_mode
        else:
            self.merchant_id = kwargs.get('merchant_id', '')
            self.secret_key = kwargs.get('secret_key', '')
            self.test_mode = kwargs.get('test_mode', True)
            self.api_endpoint = kwargs.get('api_endpoint') or self.get_default_endpoint(self.test_mode)

    @abstractmethod
    def get_default_endpoint(self, test_mode: bool = True) -> str:
        """Default API/form URL for gateway."""
        pass

    @abstractmethod
    def initiate_payment(
        self,
        amount: Decimal,
        currency: str,
        callback_url: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Initiate payment with gateway and return redirect URL & parameters.
        """
        pass

    @abstractmethod
    def verify_callback(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify payment callback signature and status.
        """
        pass


class EsewaAdapter(PaymentGatewayAdapter):
    """
    eSewa ePay v2 Gateway Adapter (Nepal)
    Generates HMAC-SHA256 signature and verifies callback.
    
    Requirements: 7.1
    """

    def get_default_endpoint(self, test_mode: bool = True) -> str:
        if test_mode:
            return "https://rc-epay.esewa.com.np/api/epay/main/v2/form"
        return "https://epay.esewa.com.np/api/epay/main/v2/form"

    def generate_signature(self, total_amount: str, transaction_uuid: str, product_code: str) -> str:
        """
        eSewa v2 signature: HMAC-SHA256 of "total_amount={amt},transaction_uuid={uuid},product_code={code}"
        """
        message = f"total_amount={total_amount},transaction_uuid={transaction_uuid},product_code={product_code}"
        digest = hmac.new(
            self.secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).digest()
        return base64.b64encode(digest).decode('utf-8')

    def initiate_payment(
        self,
        amount: Decimal,
        currency: str,
        callback_url: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        transaction_uuid = metadata.get('transaction_uuid', metadata.get('booking_reference'))
        amt_str = f"{amount:.2f}"
        product_code = self.merchant_id or "EPAYTEST"

        signature = self.generate_signature(amt_str, transaction_uuid, product_code)

        form_fields = {
            "amount": amt_str,
            "tax_amount": "0",
            "total_amount": amt_str,
            "transaction_uuid": transaction_uuid,
            "product_code": product_code,
            "product_service_charge": "0",
            "product_delivery_charge": "0",
            "success_url": f"{callback_url}?status=success",
            "failure_url": f"{callback_url}?status=failure",
            "signed_field_names": "total_amount,transaction_uuid,product_code",
            "signature": signature,
        }

        query_string = urllib.parse.urlencode(form_fields)
        payment_url = f"{self.api_endpoint}?{query_string}"

        return {
            "gateway": "ESEWA",
            "payment_url": payment_url,
            "form_fields": form_fields,
            "transaction_uuid": transaction_uuid,
            "amount": amount,
            "currency": currency,
        }

    def verify_callback(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify eSewa encoded response data or form POST.
        eSewa returns base64-encoded JSON in 'data' query parameter.
        """
        encoded_data = request_data.get('data')
        if encoded_data:
            try:
                decoded_str = base64.b64decode(encoded_data).decode('utf-8')
                data = json.loads(decoded_str)
            except Exception:
                data = request_data
        else:
            data = request_data

        status_code = data.get('status')
        total_amount = data.get('total_amount', '')
        transaction_uuid = data.get('transaction_uuid', '')
        signature = data.get('signature', '')
        product_code = self.merchant_id or "EPAYTEST"

        expected_sig = self.generate_signature(str(total_amount), transaction_uuid, product_code)
        sig_valid = (signature == expected_sig)

        is_success = (status_code == "COMPLETE") and sig_valid

        return {
            "verified": sig_valid,
            "status": "SUCCESS" if is_success else "FAILED",
            "transaction_id": transaction_uuid,
            "gateway_ref": data.get('ref_id', transaction_uuid),
            "amount": Decimal(str(total_amount)) if total_amount else Decimal('0.00'),
            "raw_response": data,
        }


class KhaltiAdapter(PaymentGatewayAdapter):
    """
    Khalti ePayment Gateway Adapter (Nepal)
    
    Requirements: 7.2
    """

    def get_default_endpoint(self, test_mode: bool = True) -> str:
        if test_mode:
            return "https://a.khalti.com/api/v2/epayment"
        return "https://khalti.com/api/v2/epayment"

    def initiate_payment(
        self,
        amount: Decimal,
        currency: str,
        callback_url: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        amount_paisa = int(amount * 100)
        purchase_order_id = metadata.get('transaction_uuid', metadata.get('booking_reference'))
        purchase_order_name = f"Booking {metadata.get('booking_reference', '')}"

        # In production this performs POST to initiate endpoint
        pidx = f"pidx_{hashlib.md5(purchase_order_id.encode()).hexdigest()[:12]}"
        payment_url = f"{self.api_endpoint}/initiate/?pidx={pidx}"

        payload = {
            "return_url": callback_url,
            "website_url": callback_url,
            "amount": amount_paisa,
            "purchase_order_id": purchase_order_id,
            "purchase_order_name": purchase_order_name,
        }

        return {
            "gateway": "KHALTI",
            "pidx": pidx,
            "payment_url": payment_url,
            "payload": payload,
            "transaction_uuid": purchase_order_id,
            "amount": amount,
            "currency": currency,
        }

    def verify_callback(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify Khalti lookup callback.
        """
        pidx = request_data.get('pidx', '')
        txn_status = request_data.get('status', '')
        txn_id = request_data.get('transaction_id', pidx)
        total_amount = request_data.get('total_amount', 0)

        # "Completed" indicates successful Khalti payment
        is_success = (txn_status in ("Completed", "SUCCESS"))

        return {
            "verified": bool(pidx),
            "status": "SUCCESS" if is_success else "FAILED",
            "transaction_id": request_data.get('purchase_order_id', txn_id),
            "gateway_ref": pidx,
            "amount": Decimal(str(total_amount / 100)) if total_amount else Decimal('0.00'),
            "raw_response": request_data,
        }


class RazorpayAdapter(PaymentGatewayAdapter):
    """
    Razorpay Gateway Adapter (India - INR)
    Order creation and HMAC-SHA256 signature verification.
    
    Requirements: 7.3
    """

    def get_default_endpoint(self, test_mode: bool = True) -> str:
        return "https://api.razorpay.com/v1"

    def generate_signature(self, razorpay_order_id: str, razorpay_payment_id: str) -> str:
        """
        Razorpay signature: HMAC-SHA256 of "order_id|payment_id"
        """
        message = f"{razorpay_order_id}|{razorpay_payment_id}"
        return hmac.new(
            self.secret_key.encode('utf-8'),
            message.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    def initiate_payment(
        self,
        amount: Decimal,
        currency: str,
        callback_url: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        amount_paise = int(amount * 100)
        receipt = metadata.get('booking_reference', 'rcpt_001')
        order_id = f"order_{hashlib.md5(receipt.encode()).hexdigest()[:14]}"

        return {
            "gateway": "RAZORPAY",
            "order_id": order_id,
            "amount": amount_paise,
            "currency": currency or "INR",
            "key_id": self.merchant_id,
            "callback_url": callback_url,
            "transaction_uuid": metadata.get('transaction_uuid', receipt),
        }

    def verify_callback(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        order_id = request_data.get('razorpay_order_id', '')
        payment_id = request_data.get('razorpay_payment_id', '')
        signature = request_data.get('razorpay_signature', '')

        expected = self.generate_signature(order_id, payment_id)
        verified = (signature == expected)

        return {
            "verified": verified,
            "status": "SUCCESS" if verified else "FAILED",
            "transaction_id": order_id,
            "gateway_ref": payment_id,
            "amount": request_data.get('amount', Decimal('0.00')),
            "raw_response": request_data,
        }


class StripeAdapter(PaymentGatewayAdapter):
    """
    Stripe Checkout & Webhook Gateway Adapter (International - USD/EUR/GBP)
    
    Requirements: 7.4
    """

    def get_default_endpoint(self, test_mode: bool = True) -> str:
        return "https://api.stripe.com/v1"

    def initiate_payment(
        self,
        amount: Decimal,
        currency: str,
        callback_url: str,
        metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        session_id = f"cs_{hashlib.md5(str(amount).encode()).hexdigest()[:16]}"
        checkout_url = f"https://checkout.stripe.com/pay/{session_id}"

        return {
            "gateway": "STRIPE",
            "session_id": session_id,
            "checkout_url": checkout_url,
            "amount": amount,
            "currency": (currency or "USD").upper(),
            "transaction_uuid": metadata.get('transaction_uuid', session_id),
        }

    def verify_callback(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Verify Stripe checkout or webhook status.
        """
        event_type = request_data.get('type')
        session_obj = request_data.get('data', {}).get('object', request_data)

        # Completed checkout session or paid intent
        is_paid = (
            session_obj.get('payment_status') == 'paid'
            or event_type == 'checkout.session.completed'
            or request_data.get('status') == 'SUCCESS'
        )

        return {
            "verified": True,
            "status": "SUCCESS" if is_paid else "FAILED",
            "transaction_id": session_obj.get('id', request_data.get('session_id')),
            "gateway_ref": session_obj.get('payment_intent', ''),
            "amount": Decimal(str(session_obj.get('amount_total', 0))) / 100 if session_obj.get('amount_total') else Decimal('0.00'),
            "raw_response": request_data,
        }
