# Tenant Database Router

This module implements the database routing infrastructure for multi-tenant SaaS architecture with database-per-tenant isolation.

## Overview

The database router ensures complete data isolation between tenants by routing queries to tenant-specific databases based on thread-local context. This implements Requirement 1.2 and 1.3 from the multi-tenant SaaS platform specification.

## Architecture

### Thread-Local Storage

The router uses Python's `threading.local()` to maintain per-request tenant context. This ensures that concurrent requests for different tenants don't interfere with each other.

```python
from apps.tenants import set_tenant_schema, get_tenant_schema

# Set the tenant context for the current request
set_tenant_schema('tenant_dharan')

# All subsequent queries to tenant apps will use this database
rooms = Room.objects.all()  # Queries tenant_dharan database

# Get current tenant context
current_tenant = get_tenant_schema()  # Returns 'tenant_dharan'
```

### Database Router

The `TenantDatabaseRouter` class implements Django's database routing protocol with four methods:

1. **`db_for_read(model, **hints)`**: Routes read queries to the appropriate database
2. **`db_for_write(model, **hints)`**: Routes write queries to the appropriate database
3. **`allow_relation(obj1, obj2, **hints)`**: Controls whether relations between objects are allowed
4. **`allow_migrate(db, app_label, model_name, **hints)`**: Controls which migrations run on which databases

## Tenant Apps vs Platform Apps

### Tenant Apps (isolated per tenant)
These apps contain tenant-scoped data and are routed to tenant-specific databases:
- `rooms` - Room inventory and categories
- `reservations` - Bookings and folios
- `payments` - Payment transactions
- `accounts` - User profiles (guest data)

### Platform Apps (shared across all tenants)
These apps contain platform-wide data and are routed to the central `default` database:
- `tenants` - Tenant registry and metadata
- `auth` - Django authentication system
- All other Django built-in apps

## Usage

### Basic Usage in Views

```python
from django.shortcuts import get_object_or_404
from apps.tenants import set_tenant_schema
from apps.rooms.models import Room

def room_list_view(request, tenant_slug):
    # Middleware will set this, but shown here for clarity
    tenant = get_object_or_404(Tenant, slug=tenant_slug)
    set_tenant_schema(tenant.db_name)
    
    # This query automatically goes to the tenant database
    rooms = Room.objects.filter(is_active=True)
    return render(request, 'rooms.html', {'rooms': rooms})
```

### Management Commands

When running management commands that need to operate on tenant databases:

```python
from django.core.management.base import BaseCommand
from apps.tenants.models import Tenant
from apps.tenants import set_tenant_schema

class Command(BaseCommand):
    def handle(self, *args, **options):
        for tenant in Tenant.objects.filter(status='ACTIVE'):
            set_tenant_schema(tenant.db_name)
            # Perform operations on tenant database
            # ...
```

### Testing

When writing tests that involve tenant data:

```python
from django.test import TestCase
from apps.tenants import set_tenant_schema, clear_tenant_schema

class MyTestCase(TestCase):
    def setUp(self):
        set_tenant_schema('tenant_test')
    
    def tearDown(self):
        clear_tenant_schema()
    
    def test_something(self):
        # Your test code here
        pass
```

## Migration Strategy

### Initial Setup

1. **Central Database**: Run migrations for platform apps
   ```bash
   python manage.py migrate
   ```

2. **Tenant Databases**: For each tenant database, run migrations for tenant apps
   ```bash
   python manage.py migrate --database=tenant_dharan
   ```

### Future Migrations

When you add a new migration:

1. **Tenant App Migration**: The migration will be blocked from running on the `default` database automatically
2. **Platform App Migration**: The migration will be blocked from running on tenant databases automatically

This is enforced by the `allow_migrate()` method in the router.

## Configuration

### Settings.py

The router is configured in `settings.py`:

```python
DATABASE_ROUTERS = ["apps.tenants.db_router.TenantDatabaseRouter"]
```

### Database Configuration

The central database is defined as usual:

```python
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}
```

Tenant databases are added dynamically at runtime by the provisioning service.

## Security Considerations

### Data Isolation

- **Database-Level Isolation**: Each tenant's data is in a completely separate database, providing the strongest form of isolation
- **No Cross-Tenant Relations**: The router prevents foreign keys between tenant and platform models
- **Context Validation**: Queries to tenant apps without a valid tenant context return `None`, which will cause errors rather than silently using wrong data

### Thread Safety

The thread-local storage ensures that concurrent requests don't share tenant context. Each request thread has its own isolated context.

### Migration Safety

The router ensures that:
- Tenant models never get created in the central database
- Platform models never get created in tenant databases
- This prevents data mixing and schema conflicts

## Troubleshooting

### Error: "Database 'None' doesn't exist"

This means a tenant model was queried without setting the tenant context:

```python
# Wrong - no tenant context
rooms = Room.objects.all()  # Error!

# Correct - set context first
set_tenant_schema('tenant_dharan')
rooms = Room.objects.all()  # Works!
```

### Error: "Cannot execute query: no database for this alias"

This means you're trying to query a database that hasn't been configured. Make sure:
1. The tenant database exists in the `DATABASES` setting (added dynamically)
2. The tenant context is set correctly
3. The database alias matches the tenant's `db_name` field

## Implementation Details

### Router Logic Flow

```
Request arrives
    ↓
Middleware sets tenant context via set_tenant_schema()
    ↓
View queries tenant model (e.g., Room.objects.all())
    ↓
Router's db_for_read() is called
    ↓
Router checks if model's app is in TENANT_APPS
    ↓
If yes: return get_tenant_schema() (e.g., 'tenant_dharan')
If no: return 'default'
    ↓
Django executes query on appropriate database
```

### Thread-Local Storage Implementation

```python
_thread_locals = threading.local()

def set_tenant_schema(db_name):
    _thread_locals.tenant_db = db_name

def get_tenant_schema():
    return getattr(_thread_locals, 'tenant_db', None)
```

This uses Python's standard `threading.local()` class, which provides thread-safe storage. Each thread sees only its own values.

## Testing

Run the router tests:

```bash
python manage.py test apps.tenants.test_db_router
```

The test suite covers:
- Thread-local storage get/set operations
- Routing tenant models to tenant databases
- Routing platform models to default database
- Handling missing tenant context
- Relation restrictions between databases
- Migration routing rules
- Multiple tenant context switching

## References

- **Django Database Routers**: https://docs.djangoproject.com/en/stable/topics/db/multi-db/#automatic-database-routing
- **Requirements**: See `/Users/rajak/Desktop/hotel_web/.kiro/specs/multi-tenant-saas-platform/requirements.md` (Requirement 1.2, 1.3)
- **Design**: See `/Users/rajak/Desktop/hotel_web/.kiro/specs/multi-tenant-saas-platform/design.md` (Database Router section)
