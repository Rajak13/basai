"""
Tenant Provisioning Service

Handles the creation and setup of new hotel tenants, including:
- Database provisioning
- Schema migration
- Owner user creation
- Subscription initialization

Requirements: 1.4, 6.1, 6.3
"""
import uuid
import os
from datetime import timedelta
from django.utils import timezone
from django.db import connections, connection, transaction
from django.core.management import call_command
from django.contrib.auth import get_user_model
from .models import Tenant, Subscription, TenantMembership
from .subscription_service import (
    SubscriptionService,
    QuotaExceededException,
    TenantSuspendedException,
    TIER_CONFIGS,
)

User = get_user_model()


class TenantProvisioningError(Exception):
    """Raised when tenant provisioning fails"""
    pass


class TenantProvisioningService:
    """
    Service for provisioning new hotel tenants with isolated databases.
    
    This service orchestrates the complete tenant creation workflow:
    1. Create central registry entry
    2. Provision isolated PostgreSQL database
    3. Run migrations on new database
    4. Create owner user and membership
    5. Initialize subscription
    """
    
    @staticmethod
    def provision_new_tenant(
        hotel_name: str,
        slug: str,
        region: str,
        owner_email: str,
        owner_password: str = None,
        primary_currency: str = None
    ) -> Tenant:
        """
        Provision a new tenant with complete infrastructure.
        
        Args:
            hotel_name: Display name of the hotel
            slug: URL-safe unique identifier (e.g., 'hotel-dharan')
            region: SAARC region code (e.g., 'NPL', 'IND')
            owner_email: Email address for the hotel owner account
            owner_password: Optional password (generates random if not provided)
            primary_currency: ISO 4217 currency code (defaults based on region)
        
        Returns:
            Tenant: The newly created tenant instance
        
        Raises:
            TenantProvisioningError: If provisioning fails at any step
        
        Requirements: 1.4, 6.1, 6.3
        """
        # Set default currency based on region if not provided
        if not primary_currency:
            currency_map = {
                'NPL': 'NPR',
                'IND': 'INR',
                'BGD': 'BDT',
                'LKR': 'LKR',
                'PAK': 'PKR',
                'BTN': 'BTN',
                'MDV': 'MVR',
                'AFG': 'AFN',
            }
            primary_currency = currency_map.get(region, 'NPR')
        
        # Generate random password if not provided
        if not owner_password:
            from django.contrib.auth.hashers import make_password
            import secrets
            import string
            # Generate a random 16-character password
            alphabet = string.ascii_letters + string.digits + string.punctuation
            owner_password = ''.join(secrets.choice(alphabet) for _ in range(16))
        
        # Use atomic transaction for central database operations
        try:
            with transaction.atomic():
                # Step 1: Create central registry entry
                tenant = TenantProvisioningService._create_tenant_record(
                    hotel_name=hotel_name,
                    slug=slug,
                    region=region,
                    primary_currency=primary_currency
                )
                
                try:
                    # Step 2: Create physical database
                    TenantProvisioningService._create_tenant_database(tenant.db_name)
                    
                    # Step 3: Run migrations on new database
                    TenantProvisioningService._migrate_tenant_database(tenant.db_name)
                    
                    # Step 4: Create owner user and membership
                    user = TenantProvisioningService._create_owner_user(
                        email=owner_email,
                        password=owner_password
                    )
                    
                    membership = TenantProvisioningService._create_tenant_membership(
                        user=user,
                        tenant=tenant,
                        role=TenantMembership.Role.OWNER
                    )
                    
                    # Step 5: Initialize subscription
                    subscription = TenantProvisioningService._create_subscription(tenant)
                    
                    return tenant
                    
                except Exception as e:
                    # Rollback: Attempt to drop the database if it was created
                    TenantProvisioningService._rollback_database_creation(tenant.db_name)
                    raise TenantProvisioningError(
                        f"Failed to provision tenant '{slug}': {str(e)}"
                    ) from e
                    
        except Exception as e:
            raise TenantProvisioningError(
                f"Failed to create tenant record for '{slug}': {str(e)}"
            ) from e
    
    @staticmethod
    def _create_tenant_record(
        hotel_name: str,
        slug: str,
        region: str,
        primary_currency: str
    ) -> Tenant:
        """
        Create tenant record in central registry.
        
        Requirements: 1.5, 2.4
        """
        # Generate unique database name
        db_name = f"tenant_{uuid.uuid4().hex[:16]}"
        
        # Calculate trial end date (14 days from now)
        trial_ends_at = timezone.now() + timedelta(days=14)
        
        tenant = Tenant.objects.create(
            slug=slug,
            hotel_name=hotel_name,
            db_name=db_name,
            db_host=os.getenv('DB_HOST', 'localhost'),
            db_port=int(os.getenv('DB_PORT', 5432)),
            status=Tenant.Status.TRIAL,
            trial_ends_at=trial_ends_at,
            region=region,
            primary_currency=primary_currency
        )
        
        return tenant
    
    @staticmethod
    def _create_tenant_database(db_name: str) -> None:
        """
        Create PostgreSQL database programmatically.
        
        Requirements: 1.4
        """
        # Use autocommit mode for CREATE DATABASE statement
        with connection.cursor() as cursor:
            cursor.connection.set_isolation_level(0)  # AUTOCOMMIT
            try:
                # PostgreSQL database names must be SQL identifiers
                # Use format() instead of execute parameters (parameters not allowed for DDL)
                cursor.execute(f"CREATE DATABASE {db_name}")
            except Exception as e:
                raise TenantProvisioningError(
                    f"Failed to create database '{db_name}': {str(e)}"
                ) from e
            finally:
                cursor.connection.set_isolation_level(1)  # READ COMMITTED
    
    @staticmethod
    def _migrate_tenant_database(db_name: str) -> None:
        """
        Run Django migrations on newly created tenant database.
        
        This applies all migrations for tenant-scoped apps:
        - rooms
        - reservations
        - payments
        - guests
        
        Requirements: 1.4
        """
        # Add database configuration to Django's DATABASES setting
        from django.conf import settings
        
        settings.DATABASES[db_name] = {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': db_name,
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': os.getenv('DB_HOST', 'localhost'),
            'PORT': int(os.getenv('DB_PORT', 5432)),
        }
        
        try:
            # Run migrations for tenant-scoped apps
            call_command(
                'migrate',
                database=db_name,
                verbosity=0,
                interactive=False
            )
        except Exception as e:
            raise TenantProvisioningError(
                f"Failed to migrate database '{db_name}': {str(e)}"
            ) from e
    
    @staticmethod
    def _create_owner_user(email: str, password: str) -> User:
        """
        Create or retrieve owner user account.
        
        If user with this email already exists, return existing user.
        This supports users owning multiple hotel tenants.
        
        Requirements: 3.2, 6.3
        """
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,  # Use email as username
                'is_active': True,
                'email_verified': False,  # Will be verified via email
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
        
        return user
    
    @staticmethod
    def _create_tenant_membership(
        user: User,
        tenant: Tenant,
        role: str
    ) -> TenantMembership:
        """
        Create tenant membership linking user to tenant with role.
        
        Requirements: 3.1, 3.2
        """
        membership = TenantMembership.objects.create(
            user=user,
            tenant=tenant,
            role=role,
            is_active=True
        )
        
        return membership
    
    @staticmethod
    def _create_subscription(tenant: Tenant) -> Subscription:
        """
        Initialize subscription with trial tier.
        
        Requirements: 4.1, 4.2
        """
        # Trial tier quotas
        subscription = Subscription.objects.create(
            tenant=tenant,
            tier=Subscription.Tier.TRIAL,
            max_rooms=5,
            max_staff=3,
            max_monthly_bookings=50,
            price_usd=0.00,
            billing_cycle=Subscription.BillingCycle.MONTHLY,
            allow_custom_domain=False,
            allow_api_access=False,
            allow_white_label=False
        )
        
        return subscription
    
    @staticmethod
    def _rollback_database_creation(db_name: str) -> None:
        """
        Attempt to drop the database if provisioning fails.
        
        This is a best-effort cleanup operation.
        If it fails, the database will need manual cleanup.
        """
        try:
            # Close any existing connections to this database
            if db_name in connections:
                connections[db_name].close()
            
            # Drop the database
            with connection.cursor() as cursor:
                cursor.connection.set_isolation_level(0)  # AUTOCOMMIT
                try:
                    # Terminate existing connections to the database
                    cursor.execute(f"""
                        SELECT pg_terminate_backend(pg_stat_activity.pid)
                        FROM pg_stat_activity
                        WHERE pg_stat_activity.datname = '{db_name}'
                        AND pid <> pg_backend_pid()
                    """)
                    
                    # Drop the database
                    cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
                except Exception:
                    # Silently fail - database may not exist or may have connections
                    pass
                finally:
                    cursor.connection.set_isolation_level(1)  # READ COMMITTED
        except Exception:
            # Best effort cleanup - if it fails, log but don't raise
            pass
    
    @staticmethod
    def deprovision_tenant(tenant: Tenant, backup: bool = True) -> None:
        """
        Deprovision a tenant and optionally backup data.
        
        This is called when:
        - Trial expires and is not converted
        - Subscription is cancelled and grace period expires
        - Platform admin manually removes tenant
        
        Args:
            tenant: The tenant to deprovision
            backup: Whether to backup data before deletion (default True)
        
        Requirements: 15.6
        """
        db_name = tenant.db_name
        
        try:
            if backup:
                # TODO: Implement database backup to S3 or backup storage
                # For now, just mark as archived
                pass
            
            # Close any existing connections
            if db_name in connections:
                connections[db_name].close()
            
            # Drop the database
            with connection.cursor() as cursor:
                cursor.connection.set_isolation_level(0)  # AUTOCOMMIT
                try:
                    # Terminate connections
                    cursor.execute(f"""
                        SELECT pg_terminate_backend(pg_stat_activity.pid)
                        FROM pg_stat_activity
                        WHERE pg_stat_activity.datname = '{db_name}'
                        AND pid <> pg_backend_pid()
                    """)
                    
                    # Drop database
                    cursor.execute(f"DROP DATABASE IF EXISTS {db_name}")
                except Exception as e:
                    raise TenantProvisioningError(
                        f"Failed to drop database '{db_name}': {str(e)}"
                    ) from e
                finally:
                    cursor.connection.set_isolation_level(1)  # READ COMMITTED
            
            # Update tenant status to archived
            tenant.status = Tenant.Status.ARCHIVED
            tenant.save()
            
        except Exception as e:
            raise TenantProvisioningError(
                f"Failed to deprovision tenant '{tenant.slug}': {str(e)}"
            ) from e
