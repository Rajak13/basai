"""
Integration tests for cross-tenant authentication and User model.
Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import AccessToken

from apps.tenants.models import Tenant, Subscription, TenantMembership

User = get_user_model()


class CrossTenantAuthTests(TestCase):
    """
    Test suite for cross-tenant authentication, JWT token claims, and user endpoints.
    """

    def setUp(self):
        self.client = APIClient()

        # Create sample tenants in central registry
        self.tenant_dharan = Tenant.objects.create(
            hotel_name="Hotel Dharan",
            slug="hotel-dharan",
            db_name="tenant_dharan_test",
            region="NPL",
            status="ACTIVE",
        )
        self.tenant_pokhara = Tenant.objects.create(
            hotel_name="Hotel Pokhara",
            slug="hotel-pokhara",
            db_name="tenant_pokhara_test",
            region="NPL",
            status="ACTIVE",
        )

        # Create standard user
        self.user = User.objects.create_user(
            username="ram@example.com",
            email="ram@example.com",
            password="SecurePassword123!",
            first_name="Ram",
            last_name="Thapa",
            phone_number="+977-9800000000",
        )

        # Create platform admin user
        self.admin_user = User.objects.create_user(
            username="admin@nantio.com",
            email="admin@nantio.com",
            password="AdminPassword123!",
            first_name="Platform",
            last_name="Admin",
            is_platform_admin=True,
        )

        # Assign user roles across multiple tenants
        self.membership_dharan = TenantMembership.objects.create(
            user=self.user,
            tenant=self.tenant_dharan,
            role="OWNER",
            is_active=True,
        )
        self.membership_pokhara = TenantMembership.objects.create(
            user=self.user,
            tenant=self.tenant_pokhara,
            role="MANAGER",
            is_active=True,
        )

    def test_user_registration_success(self):
        """Test user registration endpoint creates user and returns JWT tokens"""
        payload = {
            "username": "sita@example.com",
            "email": "sita@example.com",
            "password": "Password1234!",
            "password_confirm": "Password1234!",
            "first_name": "Sita",
            "last_name": "Rai",
            "phone_number": "+977-9811111111",
        }
        response = self.client.post("/api/auth/register", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("tokens", response.data)
        self.assertIn("access", response.data["tokens"])
        self.assertIn("refresh", response.data["tokens"])
        self.assertEqual(response.data["user"]["email"], "sita@example.com")
        self.assertEqual(response.data["user"]["is_platform_admin"], False)

    def test_user_registration_password_mismatch(self):
        """Test registration fails when password and confirm password don't match"""
        payload = {
            "username": "sita2@example.com",
            "email": "sita2@example.com",
            "password": "Password1234!",
            "password_confirm": "MismatchPassword!",
        }
        response = self.client.post("/api/auth/register", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password_confirm", response.data)

    def test_jwt_login_returns_tenant_membership_claims(self):
        """Test that logging in returns JWT token with embedded tenant memberships"""
        payload = {
            "username": "ram@example.com",
            "password": "SecurePassword123!",
        }
        response = self.client.post("/api/auth/login", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        # Decode access token to verify claims
        access_token = AccessToken(response.data["access"])
        self.assertEqual(access_token["username"], "ram@example.com")
        self.assertEqual(access_token["email"], "ram@example.com")
        self.assertEqual(access_token["is_platform_admin"], False)

        memberships = access_token["tenant_memberships"]
        self.assertEqual(len(memberships), 2)
        slugs = [m["tenant_slug"] for m in memberships]
        self.assertIn("hotel-dharan", slugs)
        self.assertIn("hotel-pokhara", slugs)

        # Verify respective roles
        dharan_role = next(m["role"] for m in memberships if m["tenant_slug"] == "hotel-dharan")
        pokhara_role = next(m["role"] for m in memberships if m["tenant_slug"] == "hotel-pokhara")
        self.assertEqual(dharan_role, "OWNER")
        self.assertEqual(pokhara_role, "MANAGER")

    def test_platform_admin_jwt_claims(self):
        """Test platform admin JWT token has is_platform_admin=True claim"""
        payload = {
            "username": "admin@nantio.com",
            "password": "AdminPassword123!",
        }
        response = self.client.post("/api/auth/login", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        access_token = AccessToken(response.data["access"])
        self.assertEqual(access_token["is_platform_admin"], True)

    def test_get_current_user_profile_endpoint(self):
        """Test /api/auth/me returns authenticated user details and active tenant memberships"""
        self.client.force_authenticate(user=self.user)
        response = self.client.get("/api/auth/me")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "ram@example.com")
        self.assertEqual(len(response.data["tenant_memberships"]), 2)

    def test_inactive_tenant_membership_excluded(self):
        """Test that deactivated tenant memberships are excluded from JWT claims and /me profile"""
        # Deactivate pokhara membership
        self.membership_pokhara.is_active = False
        self.membership_pokhara.save()

        # Login again
        payload = {
            "username": "ram@example.com",
            "password": "SecurePassword123!",
        }
        response = self.client.post("/api/auth/login", payload, format="json")
        access_token = AccessToken(response.data["access"])

        memberships = access_token["tenant_memberships"]
        self.assertEqual(len(memberships), 1)
        self.assertEqual(memberships[0]["tenant_slug"], "hotel-dharan")
