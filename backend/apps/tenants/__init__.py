"""
Tenant management app for multi-tenant SaaS platform.
Provides central tenant registry and database routing infrastructure.
"""
from .db_router import (
    set_tenant_schema,
    get_tenant_schema,
    clear_tenant_schema,
    TenantDatabaseRouter
)

__all__ = [
    'set_tenant_schema',
    'get_tenant_schema',
    'clear_tenant_schema',
    'TenantDatabaseRouter',
]
