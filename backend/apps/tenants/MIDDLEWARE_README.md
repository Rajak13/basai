# Tenant Resolution Middleware

## Overview

The `TenantMiddleware` is responsible for identifying which hotel tenant is being accessed based on the incoming request's hostname, and setting up the appropriate database context for tenant-scoped queries.

## How It Works

### Request Processing Flow

1. **Extract Hostname**: The middleware extracts the hostname from the request (e.g., `hotel-dharan.platform.com`)

2. **Resolve Tenant**: It attempts to identify the tenant using two methods:
   - **Custom Domain First** (Req 2.2): Check if hostname matches a tenant's `custom_domain` field (e.g., `hoteldharan.com`)
   - **Subdomain Fallback** (Req 2.1): Extract subdomain and match against tenant `slug` (e.g., `hotel-dharan` from `hotel-dharan.platform.com`)

3. **Check Status**: Validate tenant subscription status:
   - `ACTIVE` or `TRIAL`: Allow access ✓
   - `SUSPENDED`: Return 402 Payment Required (Req 15.2)
   - `CANCELLED`: Return 403 Forbidden (Req 15.3)
   - `ARCHIVED`: Return 410 Gone

4. **Set Context**: If tenant is valid:
   - Set `request.tenant` attribute for use in views
   - Call `set_tenant_schema(tenant.db_name)` to route database queries to tenant's database

5. **Clean Up**: After request completes (success or exception), clear tenant context to prevent leakage

### Platform Domains

The following domains are treated as platform domains (no tenant resolution):
- `localhost` (development)
- `127.0.0.1` (development)
- `nantio.com` (platform homepage)
- `www.nantio.com` (platform homepage)
- `platform.nantio.com` (platform admin)

Requests to these domains set `request.tenant = None` and don't route to tenant databases.

## Configuration

The middleware is configured in `hotel_core/settings.py`:

```python
MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    # Tenant resolution - must be after CommonMiddleware but before views
    "apps.tenants.middleware.TenantMiddleware",
]
```

**Important**: The middleware must be placed:
- **After** `CommonMiddleware` (which processes the Host header)
- **Before** view execution (so tenant context is available in views)

## Usage in Views

Once the middleware runs, views can access the resolved tenant:

```python
from django.http import JsonResponse

def my_view(request):
    if request.tenant:
        # Tenant-scoped view
        hotel_name = request.tenant.hotel_name
        currency = request.tenant.primary_currency
        
        # All queries are automatically routed to tenant database
        rooms = Room.objects.all()  # Queries tenant_xxx database
        
        return JsonResponse({
            'hotel': hotel_name,
            'currency': currency,
            'room_count': rooms.count()
        })
    else:
        # Platform-level view (no tenant)
        return JsonResponse({'message': 'Platform homepage'})
```

## Testing

Run the middleware test suite:

```bash
cd backend
python manage.py test apps.tenants.test_middleware
```

### Test Coverage

The test suite covers:
- ✓ Subdomain resolution for ACTIVE tenants
- ✓ Subdomain resolution for TRIAL tenants
- ✓ Custom domain (CNAME) resolution
- ✓ 404 response when tenant not found
- ✓ Platform domain handling (no tenant required)
- ✓ 402 response for SUSPENDED tenants
- ✓ 403 response for CANCELLED tenants
- ✓ Port stripping from hostname
- ✓ Case-insensitive hostname resolution
- ✓ Context cleanup after request
- ✓ Context cleanup on exception

## Examples

### Subdomain Routing

```
Request: http://hotel-dharan.platform.com/rooms
Resolved: Tenant(slug='hotel-dharan', db_name='tenant_dharan')
Database: tenant_dharan
```

### Custom Domain Routing

```
Request: https://hoteldharan.com/rooms
Resolved: Tenant(custom_domain='hoteldharan.com')
Database: tenant_dharan
```

### Platform Access

```
Request: http://platform.nantio.com/admin
Resolved: None (platform mode)
Database: default (central registry)
```

### Suspended Tenant

```
Request: http://hotel-suspended.platform.com/rooms
Response: 402 Payment Required
Message: "Subscription suspended. Please contact support."
```

## Error Handling

| Scenario | Status Code | Message |
|----------|-------------|---------|
| Tenant not found | 404 | "Hotel Not Found" |
| Suspended (payment failed) | 402 | "Subscription Suspended" |
| Cancelled subscription | 403 | "Subscription Cancelled" |
| Archived tenant | 410 | "Hotel No Longer Available" |
| Platform domain | 200 | (no error, tenant = None) |

## Security Considerations

1. **Context Isolation**: Tenant context is stored in thread-local storage and cleared after each request
2. **Database Routing**: The database router ensures tenant apps can only query their assigned database
3. **Status Validation**: Inactive tenants are blocked at the middleware level before reaching views
4. **No Cross-Tenant Leakage**: Each request gets a fresh tenant context

## Requirements Satisfied

- ✓ **Req 2.1**: Subdomain-based tenant identification
- ✓ **Req 2.2**: Custom domain (CNAME) support
- ✓ **Req 2.3**: Platform landing page handling
- ✓ **Req 15.2**: Trial expiration enforcement
- ✓ **Req 15.3**: Cancelled subscription handling

## Related Components

- **Database Router**: `apps/tenants/db_router.py` - Routes queries to tenant databases
- **Tenant Model**: `apps/tenants/models.py` - Central tenant registry
- **Settings**: `hotel_core/settings.py` - Middleware configuration
