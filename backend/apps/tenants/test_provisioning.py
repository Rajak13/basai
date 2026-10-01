"""
Unit Tests for Tenant Provisioning Service

Tests the complete tenant provisioning workflow including:
- Successful tenant creation
- Database provisioning
- Migration execution
- Owner user creation
- Rollback on failure

Requirements: 1.4, 2.4, 6.1, 6.2, 6.3
"""
import uuid
from unittest.mock import patch, MagicMock, call
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from django.db import connection
from apps.tenants.models import Tenant, Subscription, TenantMembership
from apps.tenants.services import TenantProvisioningService, TenantProvisioningError

User = get_user_model()


class TenantProvisioningServiceTestCase(TestCase):
    """
    Test suite for TenantProvisioningService.
    
    Uses mocking to avoid actually creating PostgreSQL databases during tests.
    """
    
    def setUp(self):
        """Set up test fixtures"""
        self.test_hotel_name = "Test Hotel Kathmandu"
        self.test_slug = "test-hotel-ktm"
        self.test_region = "NPL"
        self.test_email = "owner@testhotel.com"
        self.test_password = "SecurePass123!"

    def tearDown(self):
        """Clean up dynamic databases registered in settings.DATABASES and connections"""
        from django.conf import settings
        from django.db import connections
        extra_dbs = [db for db in list(settings.DATABASES.keys()) if db not in ('default', 'tenant_test')]
        for db in extra_dbs:
            if hasattr(connections._connections, db):
                try:
                    delattr(connections._connections, db)
                except AttributeError:
                    pass
            settings.DATABASES.pop(db, None)
        super().tearDown()
    
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_successful_tenant_provisioning(self, mock_create_db, mock_call_command):
        """
        Test complete successful tenant provisioning workflow.
        
        Verifies:
        - Tenant record created in central database
        - Database creation called
        - Migrations executed
        - Owner user created
        - Tenant membership created
        - Subscription initialized with trial tier
        
        Requirements: 1.4, 6.1, 6.3
        """
        # Act
        tenant = TenantProvisioningService.provision_new_tenant(
            hotel_name=self.test_hotel_name,
            slug=self.test_slug,
            region=self.test_region,
            owner_email=self.test_email,
            owner_password=self.test_password
        )
        
        # Assert: Tenant created
        self.assertIsNotNone(tenant)
        self.assertEqual(tenant.hotel_name, self.test_hotel_name)
        self.assertEqual(tenant.slug, self.test_slug)
        self.assertEqual(tenant.region, self.test_region)
        self.assertEqual(tenant.primary_currency, 'NPR')
        self.assertEqual(tenant.status, Tenant.Status.TRIAL)
        self.assertIsNotNone(tenant.trial_ends_at)
        self.assertTrue(tenant.db_name.startswith('tenant_'))
        
        # Assert: Database creation called
        mock_create_db.assert_called_once_with(tenant.db_name)
        
        # Assert: Migrations executed
        mock_call_command.assert_called_once()
        call_args = mock_call_command.call_args
        self.assertEqual(call_args[0][0], 'migrate')
        self.assertEqual(call_args[1]['database'], tenant.db_name)
        self.assertEqual(call_args[1]['verbosity'], 0)
        self.assertFalse(call_args[1]['interactive'])
        
        # Assert: Owner user created
        user = User.objects.get(email=self.test_email)
        self.assertIsNotNone(user)
        self.assertEqual(user.username, self.test_email)
        self.assertTrue(user.check_password(self.test_password))
        self.assertTrue(user.is_active)
        self.assertFalse(user.email_verified)
        
        # Assert: Tenant membership created
        membership = TenantMembership.objects.get(user=user, tenant=tenant)
        self.assertEqual(membership.role, TenantMembership.Role.OWNER)
        self.assertTrue(membership.is_active)
        
        # Assert: Subscription initialized
        subscription = Subscription.objects.get(tenant=tenant)
        self.assertEqual(subscription.tier, Subscription.Tier.TRIAL)
        self.assertEqual(subscription.max_rooms, 5)
        self.assertEqual(subscription.max_staff, 3)
        self.assertEqual(subscription.max_monthly_bookings, 50)
        self.assertEqual(subscription.price_usd, 0.00)
        self.assertFalse(subscription.allow_custom_domain)
    
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_default_currency_based_on_region(self, mock_create_db, mock_call_command):
        """
        Test that primary currency defaults correctly based on region.
        
        Requirements: 5.2
        """
        test_cases = [
            ('NPL', 'NPR'),
            ('IND', 'INR'),
            ('BGD', 'BDT'),
            ('LKR', 'LKR'),
            ('PAK', 'PKR'),
        ]
        
        for region, expected_currency in test_cases:
            with self.subTest(region=region):
                slug = f"test-hotel-{region.lower()}"
                tenant = TenantProvisioningService.provision_new_tenant(
                    hotel_name=f"Test Hotel {region}",
                    slug=slug,
                    region=region,
                    owner_email=f"owner-{region.lower()}@test.com",
                    owner_password="password123"
                )
                self.assertEqual(tenant.primary_currency, expected_currency)
    
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_random_password_generation(self, mock_create_db, mock_call_command):
        """
        Test that random password is generated when not provided.
        
        Requirements: 6.3
        """
        # Act
        tenant = TenantProvisioningService.provision_new_tenant(
            hotel_name=self.test_hotel_name,
            slug=self.test_slug,
            region=self.test_region,
            owner_email=self.test_email
            # Note: no password provided
        )
        
        # Assert: User created with some password
        user = User.objects.get(email=self.test_email)
        self.assertTrue(user.has_usable_password())
    
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_existing_user_reused_for_multiple_tenants(self, mock_create_db, mock_call_command):
        """
        Test that existing user can own multiple tenants.
        
        Requirements: 3.2
        """
        # Create first tenant
        tenant1 = TenantProvisioningService.provision_new_tenant(
            hotel_name="Hotel One",
            slug="hotel-one",
            region="NPL",
            owner_email=self.test_email,
            owner_password=self.test_password
        )
        
        # Create second tenant with same owner email
        tenant2 = TenantProvisioningService.provision_new_tenant(
            hotel_name="Hotel Two",
            slug="hotel-two",
            region="IND",
            owner_email=self.test_email,  # Same email
            owner_password="DifferentPassword123!"  # Different password (ignored)
        )
        
        # Assert: Only one user exists
        self.assertEqual(User.objects.filter(email=self.test_email).count(), 1)
        
        # Assert: User has memberships in both tenants
        user = User.objects.get(email=self.test_email)
        memberships = TenantMembership.objects.filter(user=user)
        self.assertEqual(memberships.count(), 2)
        
        # Assert: Both memberships are OWNER role
        self.assertTrue(
            all(m.role == TenantMembership.Role.OWNER for m in memberships)
        )
    
    def test_slug_uniqueness_validation(self):
        """
        Test that duplicate slug raises error.
        
        Requirements: 2.4
        """
        with patch('apps.tenants.services.call_command'), \
             patch('apps.tenants.services.TenantProvisioningService._create_tenant_database'):
            
            # Create first tenant
            TenantProvisioningService.provision_new_tenant(
                hotel_name="Hotel One",
                slug=self.test_slug,
                region="NPL",
                owner_email="owner1@test.com",
                owner_password="password123"
            )
            
            # Attempt to create second tenant with same slug
            with self.assertRaises(Exception):
                TenantProvisioningService.provision_new_tenant(
                    hotel_name="Hotel Two",
                    slug=self.test_slug,  # Duplicate slug
                    region="IND",
                    owner_email="owner2@test.com",
                    owner_password="password123"
                )
    
    @patch('apps.tenants.services.TenantProvisioningService._rollback_database_creation')
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_rollback_on_migration_failure(
        self,
        mock_create_db,
        mock_call_command,
        mock_rollback
    ):
        """
        Test that database is rolled back when migration fails.
        
        Requirements: 1.4
        """
        # Arrange: Make migration fail
        mock_call_command.side_effect = Exception("Migration failed")
        
        # Act & Assert: Provisioning should fail
        with self.assertRaises(TenantProvisioningError):
            TenantProvisioningService.provision_new_tenant(
                hotel_name=self.test_hotel_name,
                slug=self.test_slug,
                region=self.test_region,
                owner_email=self.test_email,
                owner_password=self.test_password
            )
        
        # Assert: Tenant record should NOT exist (transaction rolled back)
        self.assertFalse(Tenant.objects.filter(slug=self.test_slug).exists())
        
        # Assert: Rollback was attempted
        self.assertTrue(mock_rollback.called)
    
    @patch('apps.tenants.services.TenantProvisioningService._rollback_database_creation')
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_rollback_on_database_creation_failure(
        self,
        mock_create_db,
        mock_call_command,
        mock_rollback
    ):
        """
        Test that rollback occurs when database creation fails.
        
        Requirements: 1.4
        """
        # Arrange: Make database creation fail
        mock_create_db.side_effect = Exception("DB creation failed")
        
        # Act & Assert: Provisioning should fail
        with self.assertRaises(TenantProvisioningError):
            TenantProvisioningService.provision_new_tenant(
                hotel_name=self.test_hotel_name,
                slug=self.test_slug,
                region=self.test_region,
                owner_email=self.test_email,
                owner_password=self.test_password
            )
        
        # Assert: Tenant record should NOT exist
        self.assertFalse(Tenant.objects.filter(slug=self.test_slug).exists())
        
        # Assert: Rollback was attempted
        self.assertTrue(mock_rollback.called)
    
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_db_name_generation_is_unique(self, mock_create_db, mock_call_command):
        """
        Test that each tenant gets a unique database name.
        
        Requirements: 1.5
        """
        # Create multiple tenants
        tenants = []
        for i in range(3):
            tenant = TenantProvisioningService.provision_new_tenant(
                hotel_name=f"Hotel {i}",
                slug=f"hotel-{i}",
                region="NPL",
                owner_email=f"owner{i}@test.com",
                owner_password="password123"
            )
            tenants.append(tenant)
        
        # Assert: All database names are unique
        db_names = [t.db_name for t in tenants]
        self.assertEqual(len(db_names), len(set(db_names)))
        
        # Assert: All start with 'tenant_'
        self.assertTrue(all(name.startswith('tenant_') for name in db_names))
    
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_trial_ends_at_set_correctly(self, mock_create_db, mock_call_command):
        """
        Test that trial_ends_at is set to 14 days from now.
        
        Requirements: 15.1
        """
        from django.utils import timezone
        from datetime import timedelta
        
        before = timezone.now()
        
        tenant = TenantProvisioningService.provision_new_tenant(
            hotel_name=self.test_hotel_name,
            slug=self.test_slug,
            region=self.test_region,
            owner_email=self.test_email,
            owner_password=self.test_password
        )
        
        after = timezone.now()
        
        # Assert: trial_ends_at is approximately 14 days from now
        expected_min = before + timedelta(days=14)
        expected_max = after + timedelta(days=14)
        
        self.assertGreaterEqual(tenant.trial_ends_at, expected_min)
        self.assertLessEqual(tenant.trial_ends_at, expected_max)
    
    @patch('apps.tenants.services.call_command')
    @patch('apps.tenants.services.TenantProvisioningService._create_tenant_database')
    def test_custom_currency_override(self, mock_create_db, mock_call_command):
        """
        Test that custom currency can override default.
        
        Requirements: 5.2
        """
        tenant = TenantProvisioningService.provision_new_tenant(
            hotel_name=self.test_hotel_name,
            slug=self.test_slug,
            region="NPL",  # Default would be NPR
            owner_email=self.test_email,
            owner_password=self.test_password,
            primary_currency="USD"  # Override with USD
        )
        
        self.assertEqual(tenant.primary_currency, "USD")


class TenantDeprovisioningTestCase(TestCase):
    """
    Test suite for tenant deprovisioning.
    """
    
    @patch('apps.tenants.services.connection')
    def test_deprovision_tenant_success(self, mock_connection):
        """
        Test successful tenant deprovisioning.
        
        Requirements: 15.6
        """
        from django.utils import timezone
        from datetime import timedelta
        
        # Create a tenant record (without actual DB)
        tenant = Tenant.objects.create(
            slug="test-deprovision",
            hotel_name="Test Deprovision Hotel",
            db_name="tenant_test123",
            region="NPL",
            status=Tenant.Status.CANCELLED,
            trial_ends_at=timezone.now() + timedelta(days=14)
        )
        
        # Mock cursor for database operations
        mock_cursor = MagicMock()
        mock_connection.cursor.return_value.__enter__.return_value = mock_cursor
        
        # Act
        TenantProvisioningService.deprovision_tenant(tenant, backup=False)
        
        # Assert: Tenant status updated to ARCHIVED
        tenant.refresh_from_db()
        self.assertEqual(tenant.status, Tenant.Status.ARCHIVED)
        
        # Assert: Database drop commands executed
        self.assertTrue(mock_cursor.execute.called)
