"""
Payment Gateway Router

Resolves active payment gateways for each tenant based on central registry configuration.
Loads encrypted credentials and returns appropriate adapter instance.

Requirements: 5.7, 7.6, 7.7
"""
from typing import List, Optional
from apps.tenants.models import Tenant, PaymentGatewayConfig
from .adapters import (
    PaymentGatewayAdapter,
    EsewaAdapter,
    KhaltiAdapter,
    RazorpayAdapter,
    StripeAdapter,
)

ADAPTER_MAPPING = {
    'ESEWA': EsewaAdapter,
    'KHALTI': KhaltiAdapter,
    'RAZORPAY': RazorpayAdapter,
    'STRIPE': StripeAdapter,
}


class PaymentGatewayRouter:
    """
    Routes payment requests to the appropriate gateway adapter
    configured for the active tenant.
    """

    @classmethod
    def get_adapter(cls, tenant: Tenant, gateway_code: str) -> PaymentGatewayAdapter:
        """
        Retrieve configured adapter for the specified tenant and gateway.
        
        Args:
            tenant: Tenant instance
            gateway_code: Gateway identifier (e.g., 'ESEWA', 'KHALTI', 'STRIPE')
            
        Returns:
            PaymentGatewayAdapter configured with tenant credentials
            
        Raises:
            ValueError: If gateway is unsupported or not configured for tenant
        """
        code = gateway_code.upper()
        if code not in ADAPTER_MAPPING:
            raise ValueError(f"Unsupported payment gateway: '{gateway_code}'. Available: {list(ADAPTER_MAPPING.keys())}")

        config = PaymentGatewayConfig.objects.using('default').filter(
            tenant=tenant,
            gateway=code,
            is_active=True
        ).first()

        if not config:
            raise ValueError(f"Gateway '{code}' is not configured or is inactive for hotel '{tenant.hotel_name}'.")

        AdapterClass = ADAPTER_MAPPING[code]
        return AdapterClass(config=config)

    @classmethod
    def get_available_gateways(cls, tenant: Tenant) -> List[str]:
        """
        List all active payment gateway codes configured for this tenant.
        """
        return list(
            PaymentGatewayConfig.objects.using('default')
            .filter(tenant=tenant, is_active=True)
            .values_list('gateway', flat=True)
        )
