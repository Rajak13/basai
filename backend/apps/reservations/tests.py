"""
Unit tests for tenant-scoped reservations and guest profiles.

Requirements: 9.1, 9.2, 9.4, 3.7, 9.6, 1.2
"""
import uuid
from datetime import date, timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import Tenant, Subscription
from apps.tenants.db_router import set_tenant_schema, clear_tenant_schema
from apps.rooms.models import RoomCategory, Room
from apps.reservations.models import Reservation, get_tenant_prefix
from apps.guests.models import GuestProfile


class TenantScopedReservationTestCase(TestCase):
    """Test tenant-scoped booking reference generation and isolation."""
    databases = {'default', 'tenant_test'}

    def setUp(self):
        clear_tenant_schema()
        self.tenant_dharan = Tenant.objects.create(
            hotel_name="Hotel Dharan",
            slug="hotel-dharan",
            db_name="tenant_test",
            region="NPL",
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )
        self.tenant_pokhara = Tenant.objects.create(
            hotel_name="Resort Pokhara",
            slug="resort-pokhara",
            db_name="tenant_pokhara_test",
            region="NPL",
            status=Tenant.Status.ACTIVE,
            trial_ends_at=timezone.now() + timedelta(days=14),
        )

        set_tenant_schema("tenant_test")
        self.category = RoomCategory.objects.create(
            name="Deluxe King",
            slug="deluxe-king",
            base_price_npr=4500.00,
            max_occupancy=3,
        )

    def tearDown(self):
        clear_tenant_schema()
        super().tearDown()

    def test_booking_reference_with_dharan_tenant(self):
        """Test booking reference generated with DHR prefix for hotel-dharan."""
        set_tenant_schema("tenant_test")
        self.assertEqual(get_tenant_prefix(), "DHR")

        res = Reservation.objects.create(
            guest_name="Aarav Sharma",
            guest_phone="+977-9801234567",
            guest_email="aarav@example.com",
            category=self.category,
            check_in_date=date.today() + timedelta(days=1),
            check_out_date=date.today() + timedelta(days=3),
            total_price_npr=9000.00,
        )
        self.assertTrue(res.booking_reference.startswith("DHR-"))
        self.assertEqual(len(res.booking_reference), 12)  # DHR- + 8 chars

    def test_booking_reference_with_pokhara_tenant(self):
        """Test booking reference generated with POK prefix when hotel slug is pokhara."""
        self.tenant_dharan.slug = "pokhara-view-hotel"
        self.tenant_dharan.save()

        set_tenant_schema("tenant_test")
        self.assertEqual(get_tenant_prefix(), "POK")

        res = Reservation.objects.create(
            guest_name="Binod Karki",
            guest_phone="+977-9812345678",
            guest_email="binod@example.com",
            category=self.category,
            check_in_date=date.today() + timedelta(days=2),
            check_out_date=date.today() + timedelta(days=4),
            total_price_npr=9000.00,
        )
        self.assertTrue(res.booking_reference.startswith("POK-"))

    def test_booking_reference_fallback_prefix(self):
        """Test booking reference fallback prefix when no tenant schema is set."""
        clear_tenant_schema()
        self.assertEqual(get_tenant_prefix(), "HTL")

        set_tenant_schema("tenant_test")
        res = Reservation.objects.create(
            booking_reference="HTL-CUSTOM12",
            guest_name="Chandra Gurung",
            guest_phone="+977-9823456789",
            category=self.category,
            check_in_date=date.today(),
            check_out_date=date.today() + timedelta(days=1),
            total_price_npr=4500.00,
        )
        self.assertEqual(res.booking_reference, "HTL-CUSTOM12")
        self.assertTrue(res.booking_reference.startswith("HTL-"))

    def test_guest_profile_cross_tenant_reference(self):
        """Test GuestProfile uses central_user_id UUID and local contact fields."""
        central_uid = uuid.uuid4()
        profile = GuestProfile.objects.create(
            central_user_id=central_uid,
            full_name="Deepak KC",
            email="deepak@example.com",
            phone="+977-9834567890",
            city="Kathmandu",
            country="Nepal",
        )
        self.assertEqual(profile.central_user_id, central_uid)
        self.assertEqual(profile.full_name, "Deepak KC")
        self.assertIn("Deepak KC", str(profile))

    def test_reservation_with_central_guest_id(self):
        """Test reservation storing central_guest_id without cross-db FK constraint."""
        central_uid = uuid.uuid4()
        res = Reservation.objects.create(
            central_guest_id=central_uid,
            guest_name="Guest With ID",
            guest_phone="+977-9845678901",
            category=self.category,
            check_in_date=date.today(),
            check_out_date=date.today() + timedelta(days=1),
        )
        self.assertEqual(res.central_guest_id, central_uid)
        self.assertIsNone(res.guest)
