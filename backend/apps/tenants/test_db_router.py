"""
Tests for tenant database router functionality.
Verifies that queries are correctly routed to tenant databases.
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.tenants.db_router import (
    TenantDatabaseRouter,
    set_tenant_schema,
    get_tenant_schema,
    clear_tenant_schema
)
from apps.rooms.models import RoomCategory
from apps.tenants.models import Tenant

User = get_user_model()


class TenantDatabaseRouterTestCase(TestCase):
    """Test the TenantDatabaseRouter routing logic."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.router = TenantDatabaseRouter()
        # Clear any existing tenant context
        clear_tenant_schema()
    
    def tearDown(self):
        """Clean up tenant context after each test."""
        clear_tenant_schema()
    
    def test_thread_local_storage_get_set(self):
        """Test that thread-local storage works for tenant context."""
        # Initially no tenant should be set
        self.assertIsNone(get_tenant_schema())
        
        # Set a tenant database
        set_tenant_schema('tenant_test_hotel')
        
        # Verify it was set correctly
        self.assertEqual(get_tenant_schema(), 'tenant_test_hotel')
        
        # Clear and verify
        clear_tenant_schema()
        self.assertIsNone(get_tenant_schema())
    
    def test_tenant_model_routes_to_tenant_db(self):
        """Test that tenant app models route to tenant database."""
        set_tenant_schema('tenant_dharan')
        
        # RoomCategory is in 'rooms' app (tenant app)
        db = self.router.db_for_read(RoomCategory)
        self.assertEqual(db, 'tenant_dharan')
        
        db = self.router.db_for_write(RoomCategory)
        self.assertEqual(db, 'tenant_dharan')
    
    def test_platform_model_routes_to_default_db(self):
        """Test that platform models route to default database."""
        set_tenant_schema('tenant_dharan')
        
        # Tenant is in 'tenants' app (platform app)
        db = self.router.db_for_read(Tenant)
        self.assertEqual(db, 'default')
        
        db = self.router.db_for_write(Tenant)
        self.assertEqual(db, 'default')
    
    def test_no_tenant_context_returns_none_for_tenant_models(self):
        """Test that tenant models return None when no tenant context is set."""
        # Don't set any tenant context
        clear_tenant_schema()
        
        # RoomCategory should return None (which will cause an error if used)
        db = self.router.db_for_read(RoomCategory)
        self.assertIsNone(db)
        
        db = self.router.db_for_write(RoomCategory)
        self.assertIsNone(db)
    
    def test_allow_relation_same_database(self):
        """Test that relations are allowed within the same database."""
        # Create mock objects with the same database
        class MockObj:
            class _State:
                def __init__(self, db):
                    self.db = db
            
            def __init__(self, db):
                self._state = self._State(db)
        
        obj1 = MockObj('tenant_dharan')
        obj2 = MockObj('tenant_dharan')
        
        # Relations within same database should be allowed
        self.assertTrue(self.router.allow_relation(obj1, obj2))
    
    def test_allow_relation_different_database(self):
        """Test that relations are denied across different databases."""
        class MockObj:
            class _State:
                def __init__(self, db):
                    self.db = db
            
            def __init__(self, db):
                self._state = self._State(db)
        
        obj1 = MockObj('tenant_dharan')
        obj2 = MockObj('default')
        
        # Relations across databases should be denied
        self.assertFalse(self.router.allow_relation(obj1, obj2))
    
    def test_allow_migrate_tenant_apps(self):
        """Test migration routing for tenant apps."""
        # Tenant apps should NOT migrate to default database
        self.assertFalse(self.router.allow_migrate('default', 'rooms'))
        self.assertFalse(self.router.allow_migrate('default', 'reservations'))
        self.assertFalse(self.router.allow_migrate('default', 'payments'))
        self.assertFalse(self.router.allow_migrate('default', 'guests'))
        
        # Tenant apps SHOULD migrate to tenant databases
        self.assertTrue(self.router.allow_migrate('tenant_dharan', 'rooms'))
        self.assertTrue(self.router.allow_migrate('tenant_dharan', 'reservations'))
        self.assertTrue(self.router.allow_migrate('tenant_dharan', 'payments'))
        self.assertTrue(self.router.allow_migrate('tenant_dharan', 'guests'))
    
    def test_allow_migrate_platform_apps(self):
        """Test migration routing for platform apps."""
        # Platform apps should ONLY migrate to default database
        self.assertTrue(self.router.allow_migrate('default', 'tenants'))
        self.assertTrue(self.router.allow_migrate('default', 'auth'))
        
        # Platform apps should NOT migrate to tenant databases
        self.assertFalse(self.router.allow_migrate('tenant_dharan', 'tenants'))
        self.assertFalse(self.router.allow_migrate('tenant_dharan', 'auth'))
    
    def test_multiple_tenant_contexts(self):
        """Test switching between different tenant contexts."""
        # Set first tenant
        set_tenant_schema('tenant_hotel_a')
        self.assertEqual(get_tenant_schema(), 'tenant_hotel_a')
        
        db = self.router.db_for_read(RoomCategory)
        self.assertEqual(db, 'tenant_hotel_a')
        
        # Switch to second tenant
        set_tenant_schema('tenant_hotel_b')
        self.assertEqual(get_tenant_schema(), 'tenant_hotel_b')
        
        db = self.router.db_for_read(RoomCategory)
        self.assertEqual(db, 'tenant_hotel_b')
        
        # Clear and verify
        clear_tenant_schema()
        self.assertIsNone(get_tenant_schema())
