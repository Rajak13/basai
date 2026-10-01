"""
Example usage of the tenant database router.
This demonstrates how to use the router in different scenarios.
"""

from apps.tenants import set_tenant_schema, get_tenant_schema, clear_tenant_schema
from apps.tenants.models import Tenant
from apps.rooms.models import Room, RoomCategory


# Example 1: Basic tenant context management
def example_basic_usage():
    """Demonstrate basic tenant context setup and usage."""
    
    # Get tenant from central database
    tenant = Tenant.objects.get(slug='hotel-dharan')
    
    # Set the tenant context
    set_tenant_schema(tenant.db_name)
    
    # Now all queries to tenant apps use the tenant database
    rooms = Room.objects.all()
    print(f"Found {rooms.count()} rooms for {tenant.hotel_name}")
    
    # Clear context when done
    clear_tenant_schema()


# Example 2: Multiple tenant operations
def example_multi_tenant_operation():
    """Demonstrate switching between different tenant contexts."""
    
    # Get all active tenants
    tenants = Tenant.objects.filter(status='ACTIVE')
    
    # Process each tenant
    for tenant in tenants:
        # Set context for this tenant
        set_tenant_schema(tenant.db_name)
        
        # Query tenant-specific data
        room_count = Room.objects.count()
        category_count = RoomCategory.objects.count()
        
        print(f"{tenant.hotel_name}: {room_count} rooms, {category_count} categories")
        
        # Clear context before moving to next tenant
        clear_tenant_schema()


# Example 3: Error handling
def example_error_handling():
    """Demonstrate proper error handling with tenant context."""
    
    try:
        # Get tenant
        tenant = Tenant.objects.get(slug='hotel-dharan')
        set_tenant_schema(tenant.db_name)
        
        # Perform operations
        rooms = Room.objects.all()
        # ... do something with rooms
        
    except Tenant.DoesNotExist:
        print("Tenant not found")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        # Always clear context in finally block
        clear_tenant_schema()


# Example 4: Context manager (recommended pattern)
from contextlib import contextmanager

@contextmanager
def tenant_context(tenant):
    """
    Context manager for safe tenant context handling.
    Automatically clears context on exit.
    """
    try:
        set_tenant_schema(tenant.db_name)
        yield
    finally:
        clear_tenant_schema()


def example_context_manager():
    """Demonstrate using a context manager for tenant operations."""
    
    tenant = Tenant.objects.get(slug='hotel-dharan')
    
    # Use context manager for automatic cleanup
    with tenant_context(tenant):
        rooms = Room.objects.all()
        print(f"Found {rooms.count()} rooms")
        # Context is automatically cleared when exiting the 'with' block


# Example 5: View pattern
def example_view_pattern(request, tenant_slug):
    """
    Example of how to use tenant context in a Django view.
    In practice, this would be done by middleware.
    """
    from django.shortcuts import get_object_or_404, render
    
    # Get tenant (this would be done by middleware)
    tenant = get_object_or_404(Tenant, slug=tenant_slug, status='ACTIVE')
    
    # Set context
    set_tenant_schema(tenant.db_name)
    
    try:
        # Query tenant data
        rooms = Room.objects.filter(is_active=True)
        categories = RoomCategory.objects.all()
        
        context = {
            'tenant': tenant,
            'rooms': rooms,
            'categories': categories,
        }
        
        return render(request, 'rooms/list.html', context)
    
    finally:
        # Clear context (in practice, middleware would handle this)
        clear_tenant_schema()


# Example 6: Management command pattern
from django.core.management.base import BaseCommand

class ExampleCommand(BaseCommand):
    """Example management command that operates on all tenants."""
    
    help = 'Example command that processes all tenant databases'
    
    def handle(self, *args, **options):
        tenants = Tenant.objects.filter(status='ACTIVE')
        
        for tenant in tenants:
            self.stdout.write(f"Processing {tenant.hotel_name}...")
            
            # Set tenant context
            set_tenant_schema(tenant.db_name)
            
            try:
                # Perform operations on tenant data
                room_count = Room.objects.count()
                self.stdout.write(
                    self.style.SUCCESS(f"  Found {room_count} rooms")
                )
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  Error: {e}")
                )
            finally:
                # Clear context before next tenant
                clear_tenant_schema()
        
        self.stdout.write(self.style.SUCCESS('Done!'))


# Example 7: Verifying current context
def example_verify_context():
    """Demonstrate how to check and verify current tenant context."""
    
    # Check if context is set
    current_db = get_tenant_schema()
    if current_db:
        print(f"Current tenant database: {current_db}")
    else:
        print("No tenant context is set")
    
    # Set context and verify
    tenant = Tenant.objects.get(slug='hotel-dharan')
    set_tenant_schema(tenant.db_name)
    
    current_db = get_tenant_schema()
    assert current_db == tenant.db_name, "Context mismatch!"
    print(f"Context set to: {current_db}")
    
    # Clear and verify
    clear_tenant_schema()
    current_db = get_tenant_schema()
    assert current_db is None, "Context should be cleared!"
    print("Context cleared successfully")


if __name__ == '__main__':
    print("Tenant Database Router - Usage Examples")
    print("=" * 50)
    print("\nThese examples demonstrate various patterns for using")
    print("the tenant database router in your application.")
    print("\nSee the function docstrings for detailed explanations.")
