"""
Example script demonstrating tenant provisioning usage.

This script shows how to use the TenantProvisioningService to create
new hotel tenants in the multi-tenant SaaS platform.

WARNING: This script creates actual database entries. Use with caution.
For testing, use the test suite: apps.tenants.test_provisioning
"""
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_core.settings')
django.setup()

from apps.tenants.services import TenantProvisioningService, TenantProvisioningError
from apps.tenants.models import Tenant, TenantMembership
from apps.accounts.models import User


def example_basic_provisioning():
    """
    Example 1: Basic tenant provisioning
    """
    print("\n=== Example 1: Basic Tenant Provisioning ===\n")
    
    try:
        tenant = TenantProvisioningService.provision_new_tenant(
            hotel_name="Hotel Demo Kathmandu",
            slug="hotel-demo-ktm",
            region="NPL",
            owner_email="demo@hotelktm.com",
            owner_password="Demo123!@#"
        )
        
        print(f"✓ Tenant created successfully!")
        print(f"  - Slug: {tenant.slug}")
        print(f"  - Hotel Name: {tenant.hotel_name}")
        print(f"  - Database: {tenant.db_name}")
        print(f"  - Region: {tenant.region}")
        print(f"  - Currency: {tenant.primary_currency}")
        print(f"  - Status: {tenant.status}")
        print(f"  - Trial Expires: {tenant.trial_ends_at}")
        
        # Check subscription
        subscription = tenant.subscription
        print(f"  - Subscription Tier: {subscription.tier}")
        print(f"  - Max Rooms: {subscription.max_rooms}")
        print(f"  - Max Staff: {subscription.max_staff}")
        
        # Check owner
        membership = tenant.memberships.first()
        print(f"  - Owner Email: {membership.user.email}")
        print(f"  - Owner Role: {membership.role}")
        
    except TenantProvisioningError as e:
        print(f"✗ Provisioning failed: {e}")
    except Exception as e:
        print(f"✗ Unexpected error: {e}")


def example_multi_region():
    """
    Example 2: Provisioning tenants in different regions with auto-currency
    """
    print("\n=== Example 2: Multi-Region Provisioning ===\n")
    
    regions = [
        ("NPL", "Hotel Nepal", "hotel-nepal", "owner-np@test.com"),
        ("IND", "Hotel India", "hotel-india", "owner-in@test.com"),
        ("BGD", "Hotel Bangladesh", "hotel-bd", "owner-bd@test.com"),
    ]
    
    for region_code, hotel_name, slug, email in regions:
        try:
            tenant = TenantProvisioningService.provision_new_tenant(
                hotel_name=hotel_name,
                slug=slug,
                region=region_code,
                owner_email=email
                # No password - will generate random
            )
            
            print(f"✓ {hotel_name}")
            print(f"  Region: {region_code} → Currency: {tenant.primary_currency}")
            
        except TenantProvisioningError as e:
            print(f"✗ {hotel_name}: {e}")


def example_multi_tenant_owner():
    """
    Example 3: Single user owning multiple tenants
    """
    print("\n=== Example 3: Multi-Tenant Ownership ===\n")
    
    owner_email = "multi-owner@hotelgroup.com"
    
    # Create first hotel
    try:
        tenant1 = TenantProvisioningService.provision_new_tenant(
            hotel_name="Hotel Group - Kathmandu Branch",
            slug="hotelgroup-ktm",
            region="NPL",
            owner_email=owner_email,
            owner_password="SecurePassword123!"
        )
        print(f"✓ Created: {tenant1.hotel_name}")
        
        # Create second hotel with same owner
        tenant2 = TenantProvisioningService.provision_new_tenant(
            hotel_name="Hotel Group - Pokhara Branch",
            slug="hotelgroup-pkr",
            region="NPL",
            owner_email=owner_email,  # Same owner
            owner_password="DifferentPassword456!"  # Ignored - user exists
        )
        print(f"✓ Created: {tenant2.hotel_name}")
        
        # Check user memberships
        user = User.objects.get(email=owner_email)
        memberships = TenantMembership.objects.filter(user=user)
        
        print(f"\n✓ User {owner_email} owns {memberships.count()} tenants:")
        for membership in memberships:
            print(f"  - {membership.tenant.hotel_name} ({membership.tenant.slug})")
            
    except TenantProvisioningError as e:
        print(f"✗ Failed: {e}")


def example_custom_currency():
    """
    Example 4: Override default currency
    """
    print("\n=== Example 4: Custom Currency Override ===\n")
    
    try:
        tenant = TenantProvisioningService.provision_new_tenant(
            hotel_name="Hotel International Plaza",
            slug="hotel-intl-plaza",
            region="NPL",  # Default would be NPR
            owner_email="owner@intlplaza.com",
            primary_currency="USD"  # Override to USD
        )
        
        print(f"✓ Tenant created with custom currency")
        print(f"  - Region: {tenant.region} (Nepal)")
        print(f"  - Currency: {tenant.primary_currency} (Overridden to USD)")
        
    except TenantProvisioningError as e:
        print(f"✗ Failed: {e}")


def example_error_handling():
    """
    Example 5: Error handling - duplicate slug
    """
    print("\n=== Example 5: Error Handling ===\n")
    
    slug = "error-test-hotel"
    
    try:
        # Create first tenant
        tenant1 = TenantProvisioningService.provision_new_tenant(
            hotel_name="Error Test Hotel 1",
            slug=slug,
            region="NPL",
            owner_email="owner1@test.com"
        )
        print(f"✓ First tenant created: {tenant1.slug}")
        
        # Try to create second with same slug
        tenant2 = TenantProvisioningService.provision_new_tenant(
            hotel_name="Error Test Hotel 2",
            slug=slug,  # Duplicate!
            region="NPL",
            owner_email="owner2@test.com"
        )
        print(f"✓ Second tenant created: {tenant2.slug}")
        
    except TenantProvisioningError as e:
        print(f"✗ Expected error caught: {e}")
        print(f"  (This is expected - slug must be unique)")


def cleanup_example_data():
    """
    Clean up example tenants (for development only)
    """
    print("\n=== Cleanup Example Data ===\n")
    
    example_slugs = [
        "hotel-demo-ktm",
        "hotel-nepal",
        "hotel-india",
        "hotel-bd",
        "hotelgroup-ktm",
        "hotelgroup-pkr",
        "hotel-intl-plaza",
        "error-test-hotel",
    ]
    
    for slug in example_slugs:
        try:
            tenant = Tenant.objects.get(slug=slug)
            # Note: In production, use deprovision_tenant() instead
            tenant.delete()
            print(f"✓ Deleted: {slug}")
        except Tenant.DoesNotExist:
            pass


def main():
    """
    Run all examples
    """
    print("\n" + "="*60)
    print("  TENANT PROVISIONING SERVICE - EXAMPLES")
    print("="*60)
    
    # Uncomment the examples you want to run:
    
    # example_basic_provisioning()
    # example_multi_region()
    # example_multi_tenant_owner()
    # example_custom_currency()
    # example_error_handling()
    
    # Cleanup (use with caution!)
    # cleanup_example_data()
    
    print("\n" + "="*60)
    print("  Examples completed. Check your database.")
    print("="*60 + "\n")
    
    print("Note: To actually run these examples, uncomment the function")
    print("calls in the main() function above.")


if __name__ == "__main__":
    main()
