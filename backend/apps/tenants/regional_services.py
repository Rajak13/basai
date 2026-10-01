"""
Regional Localization Services: Currency Conversion & Tax Calculation

Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 13.1, 13.2, 13.3, 16.1, 16.4, 16.5
"""
import logging
from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from typing import Dict, Any, Optional
import urllib.request
import json

from django.core.cache import cache
from django.db.models import Sum, Count

from .models import Tenant

logger = logging.getLogger(__name__)

# Standard SAARC & Global fallback rates relative to USD (1 USD = X Currency)
DEFAULT_RATES_USD_BASE: Dict[str, Decimal] = {
    'USD': Decimal('1.00'),
    'NPR': Decimal('134.50'),
    'INR': Decimal('83.95'),
    'BDT': Decimal('119.80'),
    'LKR': Decimal('300.50'),
    'PKR': Decimal('278.20'),
    'BTN': Decimal('83.95'),
    'MVR': Decimal('15.45'),
    'AFN': Decimal('70.50'),
    'EUR': Decimal('0.92'),
    'GBP': Decimal('0.78'),
}

# Standard regional tax defaults
REGIONAL_TAX_DEFAULTS = {
    'NPL': {'tax_type': 'VAT', 'tax_rate': Decimal('13.00'), 'service_charge': Decimal('10.00'), 'currency': 'NPR'},
    'IND': {'tax_type': 'GST', 'tax_rate': Decimal('18.00'), 'service_charge': Decimal('0.00'), 'currency': 'INR'},
    'BGD': {'tax_type': 'VAT', 'tax_rate': Decimal('15.00'), 'service_charge': Decimal('0.00'), 'currency': 'BDT'},
    'LKR': {'tax_type': 'VAT', 'tax_rate': Decimal('18.00'), 'service_charge': Decimal('10.00'), 'currency': 'LKR'},
    'PAK': {'tax_type': 'GST', 'tax_rate': Decimal('16.00'), 'service_charge': Decimal('0.00'), 'currency': 'PKR'},
    'BTN': {'tax_type': 'Sales Tax', 'tax_rate': Decimal('10.00'), 'service_charge': Decimal('0.00'), 'currency': 'BTN'},
    'MDV': {'tax_type': 'TGST', 'tax_rate': Decimal('16.00'), 'service_charge': Decimal('10.00'), 'currency': 'MVR'},
    'AFG': {'tax_type': 'BRT', 'tax_rate': Decimal('10.00'), 'service_charge': Decimal('0.00'), 'currency': 'AFN'},
}


class CurrencyService:
    """
    Multi-currency conversion service with 24-hour rate caching.
    Supports all SAARC regional currencies.
    
    Requirements: 5.5, 5.6, 16.1, 16.4, 16.5
    """
    CACHE_KEY = "exchange_rates_usd_base"
    CACHE_TTL_SECONDS = 86400  # 24 hours

    @classmethod
    def get_exchange_rates(cls, force_refresh: bool = False) -> Dict[str, Decimal]:
        """
        Fetch exchange rates with caching.
        Falls back to default static rates if third-party API is unreachable.
        """
        if not force_refresh:
            cached = cache.get(cls.CACHE_KEY)
            if cached:
                return cached

        # Attempt to fetch live rates or use standard fallback
        rates = cls._fetch_live_rates() or DEFAULT_RATES_USD_BASE
        cache.set(cls.CACHE_KEY, rates, cls.CACHE_TTL_SECONDS)
        return rates

    @classmethod
    def _fetch_live_rates(cls) -> Optional[Dict[str, Decimal]]:
        """
        Attempt to fetch rates from open public exchange rate API.
        Silently returns None if network unavailable or offline.
        """
        url = "https://open.er-api.com/v6/latest/USD"
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Nantio-SaaS/1.0'})
            with urllib.request.urlopen(req, timeout=3) as response:
                if response.status == 200:
                    data = json.loads(response.read().decode('utf-8'))
                    if data.get('result') == 'success' and 'rates' in data:
                        rates_dict = {}
                        for curr, rate in data['rates'].items():
                            if curr in DEFAULT_RATES_USD_BASE:
                                rates_dict[curr] = Decimal(str(rate))
                        # Merge with fallbacks if any missing
                        for k, v in DEFAULT_RATES_USD_BASE.items():
                            rates_dict.setdefault(k, v)
                        return rates_dict
        except Exception as exc:
            logger.debug(f"Exchange rate API unavailable, using fallback table: {exc}")
        return None

    @classmethod
    def convert_currency(
        cls,
        amount: Decimal,
        from_currency: str,
        to_currency: str
    ) -> Decimal:
        """
        Convert monetary amount from one ISO 4217 currency to another.
        
        Args:
            amount: Decimal amount
            from_currency: Source currency (e.g., 'NPR')
            to_currency: Target currency (e.g., 'USD')
            
        Returns:
            Decimal: Converted amount rounded to 2 decimal places
        """
        from_curr = from_currency.upper()
        to_curr = to_currency.upper()

        if from_curr == to_curr:
            return amount.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

        rates = cls.get_exchange_rates()
        from_rate = rates.get(from_curr, DEFAULT_RATES_USD_BASE.get(from_curr))
        to_rate = rates.get(to_curr, DEFAULT_RATES_USD_BASE.get(to_curr))

        if not from_rate or not to_rate:
            raise ValueError(f"Unsupported currency conversion: {from_curr} to {to_curr}")

        # Convert to USD base first, then to target currency
        amount_usd = amount / from_rate
        converted = amount_usd * to_rate
        return converted.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


class TaxService:
    """
    Tax and Service Charge calculation service using tenant configuration.
    
    Requirements: 5.3, 5.4, 13.3
    """

    @classmethod
    def calculate_tax(
        cls,
        subtotal: Decimal,
        tenant: Optional[Tenant] = None,
        tax_rate: Optional[Decimal] = None,
        tax_type: Optional[str] = None,
        service_charge_rate: Optional[Decimal] = None
    ) -> Dict[str, Any]:
        """
        Calculate taxes and service charges on a given subtotal.
        
        In Nepal (and several SAARC countries):
        1. Service charge (typically 10%) is applied to room charge subtotal.
        2. VAT/GST is applied to (Subtotal + Service Charge).
        
        Args:
            subtotal: Gross charge amount before tax
            tenant: Optional tenant instance providing tax configuration
            tax_rate: Explicit tax rate percentage (overrides tenant if provided)
            tax_type: 'VAT', 'GST', etc.
            service_charge_rate: Optional percentage (e.g. 10.00)
            
        Returns:
            Dict containing detailed breakdown
        """
        subtotal = Decimal(str(subtotal))

        # Resolve tax settings
        if tenant:
            effective_tax_rate = tax_rate if tax_rate is not None else tenant.tax_rate
            effective_tax_type = tax_type or tenant.tax_type or "VAT"
            defaults = REGIONAL_TAX_DEFAULTS.get(tenant.region, {})
            effective_sc_rate = (
                service_charge_rate
                if service_charge_rate is not None
                else defaults.get('service_charge', Decimal('0.00'))
            )
        else:
            effective_tax_rate = tax_rate if tax_rate is not None else Decimal('13.00')
            effective_tax_type = tax_type or "VAT"
            effective_sc_rate = service_charge_rate if service_charge_rate is not None else Decimal('0.00')

        # 1. Service charge
        service_charge = (subtotal * (effective_sc_rate / Decimal('100.00'))).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

        # 2. Taxable amount
        taxable_amount = subtotal + service_charge

        # 3. Tax / VAT
        tax_amount = (taxable_amount * (effective_tax_rate / Decimal('100.00'))).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

        # 4. Total
        total = (taxable_amount + tax_amount).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP
        )

        return {
            'subtotal': subtotal,
            'service_charge_rate': effective_sc_rate,
            'service_charge': service_charge,
            'taxable_amount': taxable_amount,
            'tax_type': effective_tax_type,
            'tax_rate': effective_tax_rate,
            'tax_amount': tax_amount,
            'total': total,
        }

    @classmethod
    def generate_tax_report(
        cls,
        tenant: Tenant,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Generate aggregate tax and billing compliance report for a tenant.
        Queries Folio records in the tenant's database schema.
        
        Requirements: 13.3, 5.4
        """
        from apps.reservations.models import Folio

        folios = Folio.objects.using(tenant.db_name).filter(
            reservation__check_out_date__gte=start_date,
            reservation__check_out_date__lte=end_date,
            is_settled=True
        )

        aggregates = folios.aggregate(
            total_room_charges=Sum('room_charge_npr'),
            total_service_charges=Sum('service_charge_npr'),
            total_vat=Sum('vat_13_npr'),
            total_settled_amount=Sum('total_amount_npr'),
            total_folios_count=Count('id')
        )

        return {
            'tenant_slug': tenant.slug,
            'hotel_name': tenant.hotel_name,
            'region': tenant.region,
            'tax_type': tenant.tax_type or "VAT",
            'tax_registration_number': tenant.tax_registration_number,
            'period_start': start_date.isoformat(),
            'period_end': end_date.isoformat(),
            'folios_count': aggregates['total_folios_count'] or 0,
            'total_room_charges': aggregates['total_room_charges'] or Decimal('0.00'),
            'total_service_charges': aggregates['total_service_charges'] or Decimal('0.00'),
            'total_tax_collected': aggregates['total_vat'] or Decimal('0.00'),
            'total_revenue': aggregates['total_settled_amount'] or Decimal('0.00'),
        }
