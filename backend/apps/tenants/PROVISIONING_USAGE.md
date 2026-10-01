# Tenant Provisioning Service - Usage Guide

## Overview

The `TenantProvisioningService` handles the complete setup of new hotel tenants in the multi-tenant SaaS platform. This includes database provisioning, schema migration, user account creation, and subscription initialization.

## Requirements

- PostgreSQL database server running (for production)
- Environment variables configured:
  - `DB_USER` - PostgreSQL username
  - `DB_PASSWORD` - PostgreSQL password
  - `DB_HOST` - PostgreSQL host (default: localhost)
  - `DB_PORT` - PostgreSQL port (default: 5432)

## Basic Usage

### Provision a New Tenant

```python
from apps.tenants.services import TenantProvisioningService

# Create a new hotel tenant
tenant = TenantProvisioningService.provision_new_tenant(
    hotel_name="Hotel Everest Plaza",
    slug="hotel-everest",
    region="NPL",  # Nepal
    owner_email="owner@everestplaza.com",
    owner_password="SecurePassword123!"
)

# Tenant is now ready with:
# - Isolated PostgreSQL database
# - Migrated schema
# - Owner user account
# - Trial subscription (14 days)
print(f"✓ Tenant created: {tenant.slug}")
print(f"✓ Database: {tenant.db_name}")
print(f"✓ Trial expires: {tenant.trial_ends_at}")
```

### Automatic Currency Selection

The service automatically selects the appropriate currency based on the region:

```python
# Nepal → NPR
tenant_np = TenantProvisioningService.provision_new_tenant(
    hotel_name="Hotel Kathmandu",
    slug="hotel-kathmandu",
    region="NPL",
    owner_email="owner@hotelktm.com"
)
print(tenant_np.primary_currency)  # Output: NPR

# India → INR
tenant_in = TenantProvisioningService.provision_new_tenant(
    hotel_name="Hotel Delhi",
    slug="hotel-delhi",
    region="IND",
    owner_email="owner@hoteldelhi.com"
)
print(tenant_in.primary_currency)  # Output: INR
```

### Custom Currency Override

You can override the default currency if needed:

```python
tenant = TenantProvisioningService.provision_new_tenant(
    hotel_name="Hotel International",
    slug="hotel-international",
    region="NPL",
    owner_email="owner@international.com",
    primary_currency="USD"  # Override default NPR
)
print(tenant.primary_currency)  # Output: USD
```

### Random Password Generation

If you don't provide a password, the service generates a secure random password:

```python
tenant = TenantProvisioningService.provision_new_tenant(
    hotel_name="Hotel Mountain View",
    slug="hotel-mountain-view",
    region="NPL",
    owner_email="owner@mountainview.com"
    # No password provided - will generate random one
)
# Password is set, but you should send it to the user via email
```

### Multiple Tenants for Same Owner

A single user can own multiple hotel tenants:

```python
# First hotel
tenant1 = TenantProvisioningService.provision_new_tenant(
    hotel_name="Hotel Kathmandu",
    slug="hotel-kathmandu",
    region="NPL",
    owner_email="owner@multihotels.com",
    owner_password="Password123!"
)

# Second hotel - same owner email
tenant2 = TenantProvisioningService.provision_new_tenant(
    hotel_name="Hotel Pokhara",
    slug="hotel-pokhara",
    region="NPL",
    owner_email="owner@multihotels.com",  # Same email
    owner_password="DifferentPassword456!"  # Ignored - user already exists
)

# User has memberships in both tenants
from apps.accounts.models import User
user = User.objects.get(email="owner@multihotels.com")
print(user.memberships.count())  # Output: 2
```

## Error Handling

### Slug Uniqueness

```python
from apps.tenants.services import TenantProvisioningError

try:
    # First tenant
    tenant1 = TenantProvisioningService.provision_new_tenant(
        hotel_name="Hotel One",
        slug="hotel-everest",
        region="NPL",
        owner_email="owner1@test.com"
    )
    
    # This will fail - duplicate slug
    tenant2 = TenantProvisioningService.provision_new_tenant(
        hotel_name="Hotel Two",
        slug="hotel-everest",  # Same slug!
        region="NPL",
        owner_email="owner2@test.com"
    )
except TenantProvisioningError as e:
    print(f"Error: {e}")
    # Error: Failed to provision tenant 'hotel-everest': UNIQUE constraint failed
```

### Automatic Rollback

If any step fails, the service automatically rolls back all changes:

```python
try:
    tenant = TenantProvisioningService.provision_new_tenant(
        hotel_name="Hotel Test",
        slug="hotel-test",
        region="NPL",
        owner_email="owner@test.com"
    )
except TenantProvisioningError as e:
    print(f"Provisioning failed: {e}")
    # Database is automatically cleaned up
    # Tenant record is not created
```

## What Gets Created

When you provision a tenant, the following is automatically set up:

### 1. Central Registry Entry (Tenant Model)
- Unique slug for URL routing
- Hotel name
- Database connection info
- Regional configuration (region, currency)
- Branding defaults (colors, logo)
- Trial status with 14-day expiration

### 2. Isolated PostgreSQL Database
- Unique database name: `tenant_<16-char-hex>`
- Complete schema with all migrations applied
- Ready for tenant-specific data

### 3. Owner User Account
- Email-based authentication
- Password set (or generated)
- Email verification pending
- Can own multiple tenants

### 4. Tenant Membership
- Links user to tenant
- Role: OWNER (full access)
- Active status

### 5. Subscription
- Tier: TRIAL (14 days)
- Resource quotas:
  - 5 rooms
  - 3 staff accounts
  - 50 monthly bookings
- Price: $0.00 (free trial)
- Feature gates (all disabled on trial)

## Tenant Deprovisioning

When a tenant needs to be removed:

```python
from apps.tenants.models import Tenant

# Get the tenant
tenant = Tenant.objects.get(slug="hotel-test")

# Deprovision with backup
TenantProvisioningService.deprovision_tenant(
    tenant=tenant,
    backup=True  # Create backup before deletion
)

# Tenant database is dropped
# Tenant status changed to ARCHIVED
# Data is backed up (if backup=True)
```

## Integration with Onboarding Flow

The provisioning service is typically called during the onboarding flow:

```python
# Step 1: User fills out registration form
# Step 2: Call provisioning service
tenant = TenantProvisioningService.provision_new_tenant(
    hotel_name=request.data['hotel_name'],
    slug=request.data['slug'],
    region=request.data['region'],
    owner_email=request.data['email'],
    owner_password=request.data['password']
)

# Step 3: Send verification email
send_verification_email(tenant.memberships.first().user, tenant)

# Step 4: Redirect to onboarding wizard
return Response({
    'tenant_id': str(tenant.id),
    'slug': tenant.slug,
    'verification_sent': True
})
```

## Testing

The provisioning service includes comprehensive tests:

```bash
# Run all provisioning tests
python manage.py test apps.tenants.test_provisioning

# Run specific test
python manage.py test apps.tenants.test_provisioning.TenantProvisioningServiceTestCase.test_successful_tenant_provisioning
```

## Supported Regions and Currencies

| Region Code | Country    | Default Currency |
|-------------|------------|------------------|
| NPL         | Nepal      | NPR              |
| IND         | India      | INR              |
| BGD         | Bangladesh | BDT              |
| LKR         | Sri Lanka  | LKR              |
| PAK         | Pakistan   | PKR              |
| BTN         | Bhutan     | BTN              |
| MDV         | Maldives   | MVR              |
| AFG         | Afghanistan| AFN              |

## Production Considerations

### Database Server Setup

For production, ensure PostgreSQL is properly configured:

```bash
# Install PostgreSQL
sudo apt-get install postgresql postgresql-contrib

# Configure environment variables in .env
DB_USER=hotel_admin
DB_PASSWORD=secure_password_here
DB_HOST=localhost
DB_PORT=5432
```

### Database Connection Pooling

In production, use connection pooling (pgBouncer) to efficiently manage connections to multiple tenant databases.

### Backup Strategy

Before deprovisioning, always create backups:

```python
# Production deprovisioning with backup
TenantProvisioningService.deprovision_tenant(
    tenant=tenant,
    backup=True  # ALWAYS True in production
)
```

### Security Notes

1. **Password Security**: Always use strong passwords or let the system generate them
2. **Email Verification**: Users should verify email before full access
3. **Database Isolation**: Each tenant has its own database - complete isolation
4. **Rollback Safety**: Failed provisioning automatically cleans up

## Requirements Satisfied

This implementation satisfies the following requirements:

- **1.4**: Database provisioning and migration per tenant
- **6.1**: Guided setup process infrastructure
- **6.3**: Owner user and membership creation
- **3.2**: Cross-tenant user support
- **4.1**: Subscription initialization
- **15.6**: Tenant deprovisioning

## Next Steps

After tenant provisioning:

1. Send email verification link to owner
2. Owner verifies email
3. Owner completes onboarding wizard:
   - Configure tax settings
   - Set up payment gateways
   - Create initial rooms
   - Invite staff members
4. Tenant goes live and can accept bookings
