"""
Central Registry Models for Multi-Tenant SaaS Platform
These models live in the central database and manage tenant metadata.
"""
import os
import uuid
from django.db import models
from django.core.validators import RegexValidator
from django.contrib.auth import get_user_model


# SAARC Regional Choices
SAARC_REGIONS = [
    ('NPL', 'Nepal'),
    ('IND', 'India'),
    ('BGD', 'Bangladesh'),
    ('LKR', 'Sri Lanka'),
    ('PAK', 'Pakistan'),
    ('BTN', 'Bhutan'),
    ('MDV', 'Maldives'),
    ('AFG', 'Afghanistan'),
]

# Payment Gateway Choices
PAYMENT_GATEWAY_CHOICES = [
    ('ESEWA', 'eSewa'),
    ('KHALTI', 'Khalti'),
    ('FONEPAY', 'Fonepay'),
    ('RAZORPAY', 'Razorpay'),
    ('PAYTM', 'Paytm'),
    ('PHONEPE', 'PhonePe'),
    ('BKASH', 'bKash'),
    ('NAGAD', 'Nagad'),
    ('IPAY', 'iPay'),
    ('STRIPE', 'Stripe'),
]


class Tenant(models.Model):
    """
    Central registry entry for each hotel tenant.
    Stores tenant metadata, database connection info, and branding configuration.
    
    Requirements: 1.1, 1.5, 2.4, 5.2, 7.6
    """
    
    class Status(models.TextChoices):
        PENDING_APPROVAL = "PENDING_APPROVAL", "Pending Admin Approval"
        TRIAL = "TRIAL", "Trial Period"
        ACTIVE = "ACTIVE", "Active Subscription"
        SUSPENDED = "SUSPENDED", "Suspended - Payment Failed"
        CANCELLED = "CANCELLED", "Cancelled"
        ARCHIVED = "ARCHIVED", "Archived - Deleted"
        REJECTED = "REJECTED", "Rejected by Admin"
    
    # Identity
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    slug = models.SlugField(
        max_length=50,
        unique=True,
        validators=[RegexValidator(r'^[a-z0-9-]+$', 'Only lowercase alphanumeric characters and hyphens allowed')]
    )
    hotel_name = models.CharField(max_length=200)
    
    # Database connection
    db_name = models.CharField(max_length=100, unique=True)
    db_host = models.CharField(max_length=255, default="localhost")
    db_port = models.IntegerField(default=5432)
    
    # Status
    status = models.CharField(
        max_length=20, 
        choices=Status.choices, 
        default=Status.TRIAL
    )
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    
    # Regional configuration
    region = models.CharField(max_length=3, choices=SAARC_REGIONS)
    primary_currency = models.CharField(max_length=3, default="NPR")  # ISO 4217
    tax_type = models.CharField(max_length=20, blank=True)  # VAT, GST, Service Tax
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    tax_registration_number = models.CharField(max_length=100, blank=True)
    
    # Branding
    logo_url = models.URLField(blank=True)
    primary_color = models.CharField(
        max_length=7, 
        default="#3B60C5",
        validators=[RegexValidator(r'^#[0-9A-Fa-f]{6}$', 'Must be a valid hex color code')]
    )
    accent_color = models.CharField(
        max_length=7, 
        default="#EC633D",
        validators=[RegexValidator(r'^#[0-9A-Fa-f]{6}$', 'Must be a valid hex color code')]
    )
    custom_domain = models.CharField(max_length=255, blank=True, null=True, unique=True)
    
    # Approval & Verification
    rejection_reason = models.TextField(blank=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    approved_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='approved_tenants'
    )

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'tenants'
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.hotel_name} ({self.slug})"
    
    def get_database_config(self):
        """
        Return Django database configuration dict for this tenant.
        Used for dynamic database routing.
        """
        return {
            'ENGINE': 'django.db.backends.postgresql',
            'NAME': self.db_name,
            'USER': os.getenv('DB_USER', 'postgres'),
            'PASSWORD': os.getenv('DB_PASSWORD', ''),
            'HOST': self.db_host,
            'PORT': self.db_port,
        }


class Subscription(models.Model):
    """
    Subscription and billing configuration for a tenant.
    Defines tier, resource quotas, and billing cycle.
    
    Requirements: 4.1, 4.2
    """
    
    class Tier(models.TextChoices):
        TRIAL = "TRIAL", "14-day Trial"
        STARTER = "STARTER", "Starter (10 rooms)"
        PROFESSIONAL = "PROFESSIONAL", "Professional (50 rooms)"
        ENTERPRISE = "ENTERPRISE", "Enterprise (unlimited)"
    
    class BillingCycle(models.TextChoices):
        MONTHLY = "MONTHLY", "Monthly"
        ANNUAL = "ANNUAL", "Annual"
    
    tenant = models.OneToOneField(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name="subscription"
    )
    tier = models.CharField(
        max_length=20, 
        choices=Tier.choices, 
        default=Tier.TRIAL
    )
    
    # Resource quotas
    max_rooms = models.IntegerField(default=5)
    max_staff = models.IntegerField(default=3)
    max_monthly_bookings = models.IntegerField(default=50)
    
    # Billing
    billing_cycle = models.CharField(
        max_length=10, 
        choices=BillingCycle.choices,
        default=BillingCycle.MONTHLY
    )
    price_usd = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    next_billing_date = models.DateField(null=True, blank=True)
    
    # Feature gates
    allow_custom_domain = models.BooleanField(default=False)
    allow_api_access = models.BooleanField(default=False)
    allow_white_label = models.BooleanField(default=False)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
        verbose_name = 'Subscription'
        verbose_name_plural = 'Subscriptions'
    
    def __str__(self):
        return f"{self.tenant.hotel_name} - {self.get_tier_display()}"


class TenantMembership(models.Model):
    """
    Many-to-many relationship between users and tenants with roles.
    Allows a single user to have different roles across multiple tenants.
    
    Requirements: 3.1, 3.2, 11.2
    """
    
    class Role(models.TextChoices):
        OWNER = "OWNER", "Hotel Owner"
        MANAGER = "MANAGER", "Manager"
        FRONT_DESK = "FRONT_DESK", "Front Desk"
        HOUSEKEEPING = "HOUSEKEEPING", "Housekeeping"
    
    user = models.ForeignKey(
        'accounts.User',  # Reference to custom user model
        on_delete=models.CASCADE, 
        related_name="memberships"
    )
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name="memberships"
    )
    role = models.CharField(max_length=20, choices=Role.choices)
    is_active = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'tenant_memberships'
        verbose_name = 'Tenant Membership'
        verbose_name_plural = 'Tenant Memberships'
        unique_together = [['user', 'tenant']]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.email} - {self.tenant.slug} ({self.get_role_display()})"


class PaymentGatewayConfig(models.Model):
    """
    Payment gateway configurations per tenant.
    Stores encrypted credentials for regional payment processors.
    
    Requirements: 5.7
    """
    
    tenant = models.ForeignKey(
        Tenant, 
        on_delete=models.CASCADE, 
        related_name="payment_configs"
    )
    gateway = models.CharField(max_length=20, choices=PAYMENT_GATEWAY_CHOICES)
    
    # Credentials (should be encrypted in production)
    merchant_id = models.CharField(max_length=255)
    secret_key = models.CharField(max_length=255)  # TODO: Encrypt this field
    api_endpoint = models.URLField()
    
    # Status
    is_active = models.BooleanField(default=True)
    test_mode = models.BooleanField(default=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_gateway_configs'
        verbose_name = 'Payment Gateway Config'
        verbose_name_plural = 'Payment Gateway Configs'
        unique_together = [['tenant', 'gateway']]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.tenant.slug} - {self.get_gateway_display()}"


class SubscriptionPayment(models.Model):
    """
    History and tracking of subscription payments made by tenant owners.
    
    Requirements: 4.5, 4.6, 4.7
    """
    
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    subscription = models.ForeignKey(
        Subscription,
        on_delete=models.CASCADE,
        related_name="payments"
    )
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default="USD")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING
    )
    gateway = models.CharField(max_length=50, blank=True)
    transaction_id = models.CharField(max_length=255, blank=True)
    billing_cycle = models.CharField(
        max_length=10,
        choices=Subscription.BillingCycle.choices,
        default=Subscription.BillingCycle.MONTHLY
    )
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'subscription_payments'
        verbose_name = 'Subscription Payment'
        verbose_name_plural = 'Subscription Payments'
        ordering = ['-created_at']
        
    def __str__(self):
        return f"Payment {self.id} - {self.subscription.tenant.slug} - {self.status}"


class TenantVerificationDocument(models.Model):
    """
    Official business documents submitted by hotel owners for platform verification.
    Reviewed by Platform Admins prior to approving and activating the hotel tenant.
    """
    class DocumentType(models.TextChoices):
        BUSINESS_REGISTRATION = "BUSINESS_REGISTRATION", "Business Registration / Incorporation"
        PAN_VAT_CERTIFICATE = "PAN_VAT_CERTIFICATE", "PAN / VAT Registration"
        HOTEL_LICENSE = "HOTEL_LICENSE", "Hotel / Tourism Board License"
        OWNER_GOVT_ID = "OWNER_GOVT_ID", "Owner Government ID / Passport"
        PROPERTY_PROOF = "PROPERTY_PROOF", "Property Ownership or Lease Agreement"
        OTHER = "OTHER", "Other Supporting Document"

    class ReviewStatus(models.TextChoices):
        PENDING = "PENDING", "Pending Review"
        APPROVED = "APPROVED", "Approved"
        REJECTED = "REJECTED", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="verification_documents")
    document_type = models.CharField(max_length=50, choices=DocumentType.choices)
    document_file = models.FileField(upload_to="tenant_verifications/", blank=True, null=True)
    document_number = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=20, choices=ReviewStatus.choices, default=ReviewStatus.PENDING)
    notes = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    reviewed_by = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="reviewed_documents"
    )

    class Meta:
        db_table = "tenant_verification_documents"
        verbose_name = "Tenant Verification Document"
        verbose_name_plural = "Tenant Verification Documents"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.tenant.hotel_name} - {self.get_document_type_display()} ({self.status})"


class StaffInvitation(models.Model):
    """
    Cryptographically tracked invitations sent by hotel owners to invite staff.
    Prevents unauthorized self-registration into staff roles.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name="staff_invitations")
    email = models.EmailField()
    role = models.CharField(max_length=20, choices=TenantMembership.Role.choices, default=TenantMembership.Role.FRONT_DESK)
    token = models.CharField(max_length=255, unique=True)
    invited_by = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name="sent_staff_invitations")
    is_accepted = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "staff_invitations"
        verbose_name = "Staff Invitation"
        verbose_name_plural = "Staff Invitations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Invite for {self.email} as {self.get_role_display()} at {self.tenant.hotel_name}"


