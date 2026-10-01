"""
Database router for tenant-aware query routing.
Routes queries to tenant-specific databases based on thread-local context.
"""
import threading

# Thread-local storage for current tenant context
_thread_locals = threading.local()


def set_tenant_schema(db_name):
    """
    Set the current tenant's database for this thread.
    
    Args:
        db_name: The database name for the tenant (e.g., 'tenant_dharan')
    """
    _thread_locals.tenant_db = db_name


def get_tenant_schema():
    """
    Get the current tenant's database name.
    
    Returns:
        str: The tenant database name, or None if not set
    """
    return getattr(_thread_locals, 'tenant_db', None)


def clear_tenant_schema():
    """Clear the tenant context for the current thread."""
    if hasattr(_thread_locals, 'tenant_db'):
        delattr(_thread_locals, 'tenant_db')


class TenantDatabaseRouter:
    """
    Routes database operations to tenant-specific databases.
    
    Models in tenant apps go to tenant DB, platform models go to default.
    This implements complete data isolation at the database level.
    """
    
    # Apps that contain tenant-scoped models
    TENANT_APPS = ['rooms', 'reservations', 'payments', 'guests']
    
    def db_for_read(self, model, **hints):
        """
        Route read operations to the appropriate database.
        
        Args:
            model: The model class being queried
            **hints: Additional routing hints
            
        Returns:
            str: Database alias to use, or None to use default routing
        """
        if model._meta.app_label in self.TENANT_APPS:
            tenant_db = get_tenant_schema()
            if tenant_db:
                return tenant_db
            # If no tenant context is set, fail safely to None
            # This will cause an error if tenant data is accessed without context
            return None
        return 'default'
    
    def db_for_write(self, model, **hints):
        """
        Route write operations to the appropriate database.
        
        Args:
            model: The model class being written
            **hints: Additional routing hints
            
        Returns:
            str: Database alias to use, or None to use default routing
        """
        if model._meta.app_label in self.TENANT_APPS:
            tenant_db = get_tenant_schema()
            if tenant_db:
                return tenant_db
            # If no tenant context is set, fail safely to None
            return None
        return 'default'
    
    def allow_relation(self, obj1, obj2, **hints):
        """
        Allow relations only within the same database.
        
        This prevents accidental cross-database foreign keys which would
        violate tenant isolation.
        
        Args:
            obj1: First model instance
            obj2: Second model instance
            **hints: Additional routing hints
            
        Returns:
            bool: True if relation is allowed, False if denied, None if no opinion
        """
        # Get the database each object is using
        db1 = obj1._state.db
        db2 = obj2._state.db
        
        # If both objects have a database set, they must match
        if db1 and db2:
            return db1 == db2
        
        # No opinion if database info is not available
        return None
    
    def allow_migrate(self, db, app_label, model_name=None, **hints):
        """
        Determine if migrations should run on a given database.
        
        Tenant models should only be migrated to tenant databases.
        Platform models should only be migrated to the central database.
        
        Args:
            db: Database alias
            app_label: The application label
            model_name: The model name (optional)
            **hints: Additional routing hints
            
        Returns:
            bool: True if migration is allowed, False if denied, None if no opinion
        """
        if app_label in self.TENANT_APPS:
            # Tenant models should NOT be migrated to the default database
            return db != 'default'
        
        # Platform models (including tenants app) only go to default database
        return db == 'default'
