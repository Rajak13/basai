"""
Unit Tests for Regional Localization Services (CurrencyService & TaxService)

Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 13.1, 13.2, 13.3, 16.1, 16.4, 16.5
"""
from decimal import Decimal
from datetime import date, timedelta
from unittest.mock import patch
from django.test import TestCase
from django.core.cache import cache
from django.utils import timezone

from apps.tenants.models import Tenant
from apps.tenants.regional_services import (
    CurrencyService,
    TaxService,
    DEFAULT_RATES_USD_BASE,
)
from apps.tenants.db_router import set_tenant_schema, clear_tenant_schema
from apps.rooms.models import RoomCategory
from apps.reservations.models import Reservation, Folio


class RegionalServicesTestCase(TestCase):
    databases = {'default', 'tenant_test'}

    def setUp(self):
        cache.clear()
        clear_tenant_schema()

        # Nepal tenant: VAT 13%
        self.tenant_nepal = Tenant.objects.create(
            hotel_name="Dharan Mountain Lodge",
            slug="dharan-lodge",
            db_name="tenant_test",
            region="NPL",
            primary_currency="NPR",
            tax_type="VAT",
            tax_rate=Decimal('13.00'),
            tax_registration_number="PAN-123456789",
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )

        # India tenant: GST 18%
        self.tenant_india = Tenant.objects.create(
            hotel_name="Sikkim Heritage Resort",
            slug="sikkim-resort",
            db_name="tenant_india_test",
            region="IND",
            primary_currency="INR",
            tax_type="GST",
            tax_rate=Decimal('18.00'),
            tax_registration_number="GSTIN-09AAACH7409R1ZZ",
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )

    def tearDown(self):
        cache.clear()
        clear_tenant_schema()
        super().tearDown()

    def test_currency_conversion_same_currency(self):
        """Test conversion between same currency returns identical amount."""
        amount = Decimal('1500.00')
        converted = CurrencyService.convert_currency(amount, 'NPR', 'NPR')
        self.assertEqual(converted, Decimal('1500.00'))

    @patch.object(CurrencyService, '_fetch_live_rates', return_value=DEFAULT_RATES_USD_BASE)
    def test_currency_conversion_usd_to_npr_and_inr(self, mock_fetch):
        """Test converting USD to NPR and INR using exchange rates."""
        cache.clear()
        # 100 USD at 134.50 NPR/USD = 13450.00 NPR
        converted_npr = CurrencyService.convert_currency(Decimal('100.00'), 'USD', 'NPR')
        expected_npr = (Decimal('100.00') * DEFAULT_RATES_USD_BASE['NPR']).quantize(Decimal('0.01'))
        self.assertEqual(converted_npr, expected_npr)

        # 100 USD at 83.95 INR/USD = 8395.00 INR
        converted_inr = CurrencyService.convert_currency(Decimal('100.00'), 'USD', 'INR')
        expected_inr = (Decimal('100.00') * DEFAULT_RATES_USD_BASE['INR']).quantize(Decimal('0.01'))
        self.assertEqual(converted_inr, expected_inr)

    def test_currency_conversion_caching(self):
        """Test that exchange rates are cached and reused within TTL."""
        self.assertIsNone(cache.get(CurrencyService.CACHE_KEY))
        rates = CurrencyService.get_exchange_rates()
        self.assertIsNotNone(cache.get(CurrencyService.CACHE_KEY))
        self.assertEqual(cache.get(CurrencyService.CACHE_KEY), rates)

    def test_tax_calculation_nepal(self):
        """
        Test Nepal VAT calculation:
        Subtotal: 10,000 NPR
        Service Charge 10%: 1,000 NPR
        Taxable amount: 11,000 NPR
        VAT 13%: 1,430 NPR
        Total: 12,430 NPR
        """
        result = TaxService.calculate_tax(
            subtotal=Decimal('10000.00'),
            tenant=self.tenant_nepal,
            service_charge_rate=Decimal('10.00')
        )
        self.assertEqual(result['subtotal'], Decimal('10000.00'))
        self.assertEqual(result['service_charge'], Decimal('1000.00'))
        self.assertEqual(result['taxable_amount'], Decimal('11000.00'))
        self.assertEqual(result['tax_type'], 'VAT')
        self.assertEqual(result['tax_rate'], Decimal('13.00'))
        self.assertEqual(result['tax_amount'], Decimal('1430.00'))
        self.assertEqual(result['total'], Decimal('12430.00'))

    def test_tax_calculation_india_gst(self):
        """
        Test India GST calculation:
        Subtotal: 5,000 INR
        Service Charge 0%: 0 INR
        GST 18%: 900 INR
        Total: 5,900 INR
        """
        result = TaxService.calculate_tax(
            subtotal=Decimal('5000.00'),
            tenant=self.tenant_india
        )
        self.assertEqual(result['subtotal'], Decimal('5000.00'))
        self.assertEqual(result['service_charge'], Decimal('0.00'))
        self.assertEqual(result['tax_type'], 'GST')
        self.assertEqual(result['tax_rate'], Decimal('18.00'))
        self.assertEqual(result['tax_amount'], Decimal('900.00'))
        self.assertEqual(result['total'], Decimal('5900.00'))

    def test_tax_report_generation(self):
        """Test generating aggregated tax report for a tenant across folios."""
        set_tenant_schema("tenant_test")

        category = RoomCategory.objects.create(
            name="Standard Room",
            slug="standard-room",
            base_price_npr=3000.00,
            max_occupancy=2,
        )

        today = date.today()
        # Create 2 settled reservations with folios
        res1 = Reservation.objects.create(
            guest_name="Guest 1",
            guest_phone="9800000001",
            category=category,
            check_in_date=today - timedelta(days=5),
            check_out_date=today - timedelta(days=2),
            status=Reservation.Status.CHECKED_OUT,
        )
        Folio.objects.create(
            reservation=res1,
            room_charge_npr=Decimal('6000.00'),
            service_charge_npr=Decimal('600.00'),
            vat_13_npr=Decimal('858.00'),
            total_amount_npr=Decimal('7458.00'),
            paid_amount_npr=Decimal('7458.00'),
            is_settled=True,
            pan_number="PAN-123456789",
        )

        res2 = Reservation.objects.create(
            guest_name="Guest 2",
            guest_phone="9800000002",
            category=category,
            check_in_date=today - timedelta(days=3),
            check_out_date=today - timedelta(days=1),
            status=Reservation.Status.CHECKED_OUT,
        )
        Folio.objects.create(
            reservation=res2,
            room_charge_npr=Decimal('4000.00'),
            service_charge_npr=Decimal('400.00'),
            vat_13_npr=Decimal('572.00'),
            total_amount_npr=Decimal('4972.00'),
            paid_amount_npr=Decimal('4972.00'),
            is_settled=True,
            pan_number="PAN-123456789",
        )

        # Generate report for past 7 days
        report = TaxService.generate_tax_report(
            tenant=self.tenant_nepal,
            start_date=today - timedelta(days=7),
            end_date=today
        )

        self.assertEqual(report['folios_count'], 2)
        self.assertEqual(report['total_room_charges'], Decimal('10000.00'))
        self.assertEqual(report['total_service_charges'], Decimal('1000.00'))
        self.assertEqual(report['total_tax_collected'], Decimal('1430.00'))
        self.assertEqual(report['total_revenue'], Decimal('12430.00'))
        self.assertEqual(report['tax_registration_number'], "PAN-123456789")
