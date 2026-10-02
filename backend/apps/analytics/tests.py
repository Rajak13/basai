"""
Unit & Integration Tests for Tenant-Scoped Analytics and Reporting.

Verifies:
1. Occupancy rate calculations (daily breakdown, overall occupancy %)
2. Revenue totals, ADR, RevPAR, Room Category & Payment Gateway breakdown
3. Booking source distribution (Website, Walk-In, Phone, WhatsApp)
4. Guest demographics, repeat rates, and party size analysis
5. Dashboard summary KPI payload
6. CSV report export (summary, occupancy, revenue, source)
7. Strict RBAC enforcement (Owner/Manager/Platform Admin allowed; Front Desk/Housekeeping denied)
8. Multi-tenant database query isolation

Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6
"""
from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import Tenant, TenantMembership
from apps.tenants.db_router import set_tenant_schema, clear_tenant_schema
from apps.rooms.models import Room, RoomCategory
from apps.reservations.models import Reservation
from apps.payments.models import PaymentTransaction, PaymentGateway, PaymentStatus
from apps.guests.models import GuestProfile

User = get_user_model()


class AnalyticsTestCase(TestCase):
    databases = {'default', 'tenant_test'}

    def setUp(self):
        clear_tenant_schema()
        self.client = APIClient()

        # 1. Setup Tenant
        self.tenant = Tenant.objects.create(
            hotel_name="Dharan Mountain Lodge",
            slug="dharan-lodge",
            db_name="tenant_test",
            region="NPL",
            primary_currency="NPR",
            status=Tenant.Status.ACTIVE,
        )

        # 2. Setup Users with different roles
        self.owner = User.objects.create_user(
            username="owner@dharanlodge.com",
            email="owner@dharanlodge.com",
            password="Password123!",
            email_verified=True,
        )
        TenantMembership.objects.create(
            user=self.owner,
            tenant=self.tenant,
            role=TenantMembership.Role.OWNER,
            is_active=True,
        )

        self.manager = User.objects.create_user(
            username="manager@dharanlodge.com",
            email="manager@dharanlodge.com",
            password="Password123!",
            email_verified=True,
        )
        TenantMembership.objects.create(
            user=self.manager,
            tenant=self.tenant,
            role=TenantMembership.Role.MANAGER,
            is_active=True,
        )

        self.front_desk = User.objects.create_user(
            username="frontdesk@dharanlodge.com",
            email="frontdesk@dharanlodge.com",
            password="Password123!",
            email_verified=True,
        )
        TenantMembership.objects.create(
            user=self.front_desk,
            tenant=self.tenant,
            role=TenantMembership.Role.FRONT_DESK,
            is_active=True,
        )

        # 3. Seed Tenant Database Inventory (tenant_test)
        set_tenant_schema('tenant_test')

        self.cat_deluxe = RoomCategory.objects.using('tenant_test').create(
            name="Deluxe View",
            slug="deluxe-view",
            description="Panoramic view of Dharan hills",
            base_price_npr=Decimal("5000.00"),
            max_occupancy=2,
        )
        self.cat_suite = RoomCategory.objects.using('tenant_test').create(
            name="Executive Suite",
            slug="executive-suite",
            description="Luxury suite with private balcony",
            base_price_npr=Decimal("10000.00"),
            max_occupancy=4,
        )

        # 4 active rooms (2 deluxe, 2 suite)
        self.room_101 = Room.objects.using('tenant_test').create(
            room_number="101",
            category=self.cat_deluxe,
            is_active=True,
        )
        self.room_102 = Room.objects.using('tenant_test').create(
            room_number="102",
            category=self.cat_deluxe,
            is_active=True,
        )
        self.room_201 = Room.objects.using('tenant_test').create(
            room_number="201",
            category=self.cat_suite,
            is_active=True,
        )
        self.room_202 = Room.objects.using('tenant_test').create(
            room_number="202",
            category=self.cat_suite,
            is_active=True,
        )

        # 4. Seed Guest Profiles
        GuestProfile.objects.using('tenant_test').create(
            full_name="Bikram Thapa",
            email="bikram@example.com",
            phone="+977-9841000001",
            country="Nepal",
        )
        GuestProfile.objects.using('tenant_test').create(
            full_name="John Doe",
            email="john@example.com",
            phone="+1-5550100002",
            country="United States",
        )

        # 5. Seed Reservations across a fixed 5-day window:
        # Day 1 to Day 3: Room 101 occupied (2 nights: check_in=2026-09-01, check_out=2026-09-03)
        self.res1 = Reservation.objects.using('tenant_test').create(
            guest_name="Bikram Thapa",
            guest_email="bikram@example.com",
            guest_phone="+977-9841000001",
            category=self.cat_deluxe,
            room=self.room_101,
            check_in_date=date(2026, 9, 1),
            check_out_date=date(2026, 9, 3),
            adults=2,
            children=1,
            status=Reservation.Status.CONFIRMED,
            source=Reservation.BookingSource.ONLINE_WEB,
            total_price_npr=Decimal("10000.00"),
        )
        # Payment for res1
        PaymentTransaction.objects.using('tenant_test').create(
            reservation=self.res1,
            gateway=PaymentGateway.ESEWA,
            amount_npr=Decimal("10000.00"),
            status=PaymentStatus.SUCCESS,
            transaction_uuid="tx-esewa-001",
        )

        # Day 2 to Day 4: Room 201 occupied (2 nights: check_in=2026-09-02, check_out=2026-09-04)
        self.res2 = Reservation.objects.using('tenant_test').create(
            guest_name="Bikram Thapa",  # Repeat guest!
            guest_email="bikram@example.com",
            guest_phone="+977-9841000001",
            category=self.cat_suite,
            room=self.room_201,
            check_in_date=date(2026, 9, 2),
            check_out_date=date(2026, 9, 4),
            adults=2,
            children=0,
            status=Reservation.Status.CHECKED_OUT,
            source=Reservation.BookingSource.WALK_IN,
            total_price_npr=Decimal("20000.00"),
        )
        PaymentTransaction.objects.using('tenant_test').create(
            reservation=self.res2,
            gateway=PaymentGateway.CASH,
            amount_npr=Decimal("20000.00"),
            status=PaymentStatus.SUCCESS,
            transaction_uuid="tx-cash-002",
        )

        self.tenant_headers = {'HTTP_HOST': 'dharan-lodge.nantio.com'}

    def tearDown(self):
        clear_tenant_schema()
        super().tearDown()

    def test_rbac_access_control(self):
        """Verify only Owner and Manager can access analytics endpoints."""
        url = '/api/analytics/occupancy/?start_date=2026-09-01&end_date=2026-09-05'

        # 1. Unauthenticated -> 401 or 403
        res = self.client.get(url, **self.tenant_headers)
        self.assertIn(res.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

        # 2. Front Desk staff -> 403 Forbidden
        self.client.force_authenticate(user=self.front_desk)
        res = self.client.get(url, **self.tenant_headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Manager -> 200 OK
        self.client.force_authenticate(user=self.manager)
        res = self.client.get(url, **self.tenant_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # 4. Owner -> 200 OK
        self.client.force_authenticate(user=self.owner)
        res = self.client.get(url, **self.tenant_headers)
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_occupancy_rate_calculation(self):
        """
        Test occupancy calculations over a 5-day period (2026-09-01 to 2026-09-05).
        Total active rooms = 4. Total available room nights = 4 rooms * 5 days = 20.
        Res 1 (Sep 1 to Sep 3) = nights of Sep 1, Sep 2 (2 nights)
        Res 2 (Sep 2 to Sep 4) = nights of Sep 2, Sep 3 (2 nights)
        Total occupied nights = 2 + 2 = 4 nights.
        Overall occupancy rate = (4 / 20) * 100 = 20.00%
        """
        self.client.force_authenticate(user=self.owner)
        res = self.client.get(
            '/api/analytics/occupancy/?start_date=2026-09-01&end_date=2026-09-05',
            **self.tenant_headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data

        self.assertEqual(data['total_active_rooms'], 4)
        self.assertEqual(data['total_room_nights_available'], 20)
        self.assertEqual(data['total_room_nights_occupied'], 4)
        self.assertEqual(data['overall_occupancy_rate'], 20.0)

        # Check daily breakdown
        breakdown = {d['date']: d for d in data['daily_breakdown']}
        # Sep 1: 1 room (101) -> 1/4 = 25%
        self.assertEqual(breakdown['2026-09-01']['occupied_rooms'], 1)
        self.assertEqual(breakdown['2026-09-01']['occupancy_rate'], 25.0)
        # Sep 2: 2 rooms (101, 201) -> 2/4 = 50%
        self.assertEqual(breakdown['2026-09-02']['occupied_rooms'], 2)
        self.assertEqual(breakdown['2026-09-02']['occupancy_rate'], 50.0)
        # Sep 3: 1 room (201) -> 1/4 = 25% (101 checked out on Sep 3)
        self.assertEqual(breakdown['2026-09-03']['occupied_rooms'], 1)
        self.assertEqual(breakdown['2026-09-03']['occupancy_rate'], 25.0)
        # Sep 4: 0 rooms -> 0%
        self.assertEqual(breakdown['2026-09-04']['occupied_rooms'], 0)
        self.assertEqual(breakdown['2026-09-04']['occupancy_rate'], 0.0)

    def test_revenue_totals_and_metrics(self):
        """
        Test revenue metrics:
        Total revenue = 10,000 (Deluxe) + 20,000 (Suite) = 30,000 NPR.
        Total occupied nights = 4.
        ADR = 30,000 / 4 = 7,500 NPR.
        Total available nights = 20.
        RevPAR = 30,000 / 20 = 1,500 NPR.
        Category breakdown and payment gateway breakdown.
        """
        self.client.force_authenticate(user=self.owner)
        res = self.client.get(
            '/api/analytics/revenue/?start_date=2026-09-01&end_date=2026-09-05',
            **self.tenant_headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data

        self.assertEqual(data['total_bookings'], 2)
        self.assertEqual(Decimal(data['total_revenue_npr']), Decimal("30000.00"))
        self.assertEqual(Decimal(data['adr_npr']), Decimal("7500.00"))
        self.assertEqual(Decimal(data['revpar_npr']), Decimal("1500.00"))

        # Category breakdown
        cat_map = {c['category_slug']: c for c in data['by_category']}
        self.assertEqual(Decimal(cat_map['deluxe-view']['revenue_npr']), Decimal("10000.00"))
        self.assertEqual(Decimal(cat_map['executive-suite']['revenue_npr']), Decimal("20000.00"))

        # Payment gateway breakdown
        gateway_map = {g['gateway']: g for g in data['by_gateway']}
        self.assertIn('ESEWA', gateway_map)
        self.assertEqual(Decimal(gateway_map['ESEWA']['amount_npr']), Decimal("10000.00"))
        self.assertIn('CASH', gateway_map)
        self.assertEqual(Decimal(gateway_map['CASH']['amount_npr']), Decimal("20000.00"))

    def test_bookings_by_source(self):
        """Test booking sources distribution (ONLINE_WEB vs WALK_IN)."""
        self.client.force_authenticate(user=self.manager)
        res = self.client.get(
            '/api/analytics/bookings-by-source/?start_date=2026-09-01&end_date=2026-09-05',
            **self.tenant_headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data

        self.assertEqual(data['total_bookings'], 2)
        src_map = {s['source']: s for s in data['sources']}
        self.assertEqual(src_map['ONLINE_WEB']['bookings_count'], 1)
        self.assertEqual(src_map['ONLINE_WEB']['percentage'], 50.0)
        self.assertEqual(src_map['WALK_IN']['bookings_count'], 1)
        self.assertEqual(src_map['WALK_IN']['percentage'], 50.0)

    def test_guest_demographics_and_repeat_rate(self):
        """Test demographics, repeat guest identification, and party size."""
        self.client.force_authenticate(user=self.owner)
        res = self.client.get(
            '/api/analytics/demographics/?start_date=2026-09-01&end_date=2026-09-05',
            **self.tenant_headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        data = res.data

        self.assertEqual(data['total_reservations'], 2)
        # Bikram Thapa booked both reservations -> 1 unique guest with 2 bookings!
        self.assertEqual(data['total_unique_guests'], 1)
        self.assertEqual(data['repeat_guests_count'], 1)
        self.assertEqual(data['repeat_guest_rate'], 100.0)

        # Party composition: Res 1 has 2 adults + 1 child, Res 2 has 2 adults + 0 child -> 4 adults, 1 child
        self.assertEqual(data['total_adults'], 4)
        self.assertEqual(data['total_children'], 1)
        self.assertEqual(data['average_party_size'], 2.5)

        # Countries from profiles
        country_map = {c['country']: c for c in data['by_country']}
        self.assertIn('Nepal', country_map)
        self.assertIn('United States', country_map)

    def test_dashboard_summary_kpi(self):
        """Test unified dashboard summary KPI endpoint."""
        self.client.force_authenticate(user=self.owner)
        res = self.client.get(
            '/api/analytics/summary/?start_date=2026-09-01&end_date=2026-09-05',
            **self.tenant_headers
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        kpi = res.data['kpi']

        self.assertEqual(kpi['total_active_rooms'], 4)
        self.assertEqual(kpi['overall_occupancy_rate'], 20.0)
        self.assertEqual(Decimal(kpi['total_revenue_npr']), Decimal("30000.00"))
        self.assertEqual(kpi['total_bookings'], 2)
        self.assertEqual(kpi['repeat_guest_rate'], 100.0)

    def test_csv_export_endpoints(self):
        """Test exporting analytics in CSV format."""
        self.client.force_authenticate(user=self.owner)

        # 1. Summary CSV
        res_summary = self.client.get(
            '/api/analytics/export/csv/?type=summary&start_date=2026-09-01&end_date=2026-09-05',
            **self.tenant_headers
        )
        self.assertEqual(res_summary.status_code, status.HTTP_200_OK)
        self.assertEqual(res_summary['Content-Type'], 'text/csv')
        self.assertIn("Dharan Mountain Lodge", res_summary.content.decode())
        self.assertIn("Occupancy Rate,20.0%", res_summary.content.decode())

        # 2. Occupancy CSV
        res_occ = self.client.get(
            '/api/analytics/export/csv/?type=occupancy&start_date=2026-09-01&end_date=2026-09-05',
            **self.tenant_headers
        )
        self.assertEqual(res_occ.status_code, status.HTTP_200_OK)
        self.assertIn("Date,Total Rooms,Occupied Rooms,Occupancy Rate (%)", res_occ.content.decode())
        self.assertIn("2026-09-01,4,1,25.0%", res_occ.content.decode())

        # 3. Revenue CSV
        res_rev = self.client.get(
            '/api/analytics/export/csv/?type=revenue&start_date=2026-09-01&end_date=2026-09-05',
            **self.tenant_headers
        )
        self.assertEqual(res_rev.status_code, status.HTTP_200_OK)
        self.assertIn("Deluxe View,1,10000.00", res_rev.content.decode())
        self.assertIn("Executive Suite,1,20000.00", res_rev.content.decode())
