"""
Hotel Onboarding Service and Email Verification

Handles the multi-step guided setup process for new hotel tenants:
- Slug availability and format validation
- Tenant creation & database provisioning
- Email verification token generation & validation
- Progressive configuration (Tax, Currency, Payment, Room categories)
- Onboarding finalization and activation

Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8
"""
import re
import uuid
import logging
from typing import Dict, Any, List, Optional
from decimal import Decimal

from django.core import signing
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

from .models import Tenant, Subscription, PaymentGatewayConfig, TenantMembership, TenantVerificationDocument
from .services import TenantProvisioningService
from apps.rooms.models import RoomCategory, Room

User = get_user_model()
logger = logging.getLogger(__name__)

RESERVED_SLUGS = {
    'admin', 'api', 'app', 'auth', 'dashboard', 'hotel', 'mail',
    'nantio', 'platform', 'portal', 'root', 'static', 'support', 'www'
}


class EmailVerificationService:
    """Handles token generation and verification for hotel owner onboarding."""

    SIGNER_SALT = "tenant-owner-email-verification"
    TOKEN_MAX_AGE_SECONDS = 172800  # 48 hours

    @classmethod
    def generate_token(cls, user_id: Any, tenant_id: Any) -> str:
        signer = signing.TimestampSigner(salt=cls.SIGNER_SALT)
        payload = f"{user_id}:{tenant_id}"
        return signer.sign(payload)

    @classmethod
    def validate_token(cls, token: str) -> Dict[str, str]:
        signer = signing.TimestampSigner(salt=cls.SIGNER_SALT)
        try:
            payload = signer.unsign(token, max_age=cls.TOKEN_MAX_AGE_SECONDS)
            user_id, tenant_id = payload.split(":", 1)
            return {"user_id": user_id, "tenant_id": tenant_id}
        except (signing.BadSignature, signing.SignatureExpired, ValueError) as exc:
            raise ValueError(f"Invalid or expired verification token: {str(exc)}") from exc

    @classmethod
    def send_verification_email(cls, email: str, token: str, hotel_name: str) -> bool:
        """Send verification email link to hotel owner."""
        verify_url = f"https://nantio.com/onboarding/verify?token={token}"
        subject = f"Verify your email to set up {hotel_name} on Nantio"
        message = (
            f"Welcome to Nantio!\n\n"
            f"Please verify your email address to complete your setup for {hotel_name}.\n"
            f"Click the link below:\n{verify_url}\n\n"
            f"This link expires in 48 hours."
        )
        try:
            send_mail(
                subject,
                message,
                getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nantio.com'),
                [email],
                fail_silently=True
            )
            return True
        except Exception as e:
            logger.warning(f"Could not send email to {email}: {e}")
            return False


class OnboardingService:
    """Manages the lifecycle of tenant onboarding steps."""

    @staticmethod
    def check_slug(slug: str) -> Dict[str, Any]:
        """
        Validate slug format, check reserved keywords, and verify uniqueness.
        Requirements: 6.2
        """
        normalized = (slug or '').strip().lower()

        if not normalized:
            return {'available': False, 'slug': normalized, 'error': 'Slug cannot be empty.'}

        if len(normalized) < 3 or len(normalized) > 50:
            return {'available': False, 'slug': normalized, 'error': 'Slug must be between 3 and 50 characters.'}

        if not re.match(r'^[a-z0-9]+(?:-[a-z0-9]+)*$', normalized):
            return {
                'available': False,
                'slug': normalized,
                'error': 'Slug can only contain lowercase letters, numbers, and hyphens (no consecutive hyphens).'
            }

        if normalized in RESERVED_SLUGS:
            return {'available': False, 'slug': normalized, 'error': f"'{normalized}' is a reserved platform name."}

        exists = Tenant.objects.using('default').filter(slug=normalized).exists()
        if exists:
            return {'available': False, 'slug': normalized, 'error': f"Hotel with slug '{normalized}' is already registered."}

        return {'available': True, 'slug': normalized, 'error': None}

    @staticmethod
    def create_tenant_onboarding(
        hotel_name: str,
        slug: str,
        region: str,
        owner_email: str,
        owner_password: str = None,
        primary_currency: str = None,
        mock_db: bool = False,
        initial_status: str = None,
        require_approval: bool = False,
    ) -> Dict[str, Any]:
        """
        Step 1: Create tenant registry, owner user, and send verification email.
        Requirements: 6.1, 6.3, 6.4
        """
        # Validate slug
        slug_check = OnboardingService.check_slug(slug)
        if not slug_check['available']:
            raise ValueError(slug_check['error'])

        target_status = initial_status or (Tenant.Status.PENDING_APPROVAL if require_approval else Tenant.Status.TRIAL)

        # Provision tenant
        if mock_db:
            # Used for testing environments without PostgreSQL daemon
            from datetime import timedelta
            from django.utils import timezone
            tenant = Tenant.objects.create(
                hotel_name=hotel_name,
                slug=slug,
                db_name=f"tenant_{uuid.uuid4().hex[:12]}",
                region=region,
                primary_currency=primary_currency or 'NPR',
                status=target_status,
                trial_ends_at=timezone.now() + timedelta(days=14),
            )
            user, _ = User.objects.get_or_create(
                email=owner_email,
                defaults={'username': owner_email}
            )
            if owner_password:
                user.set_password(owner_password)
                user.save()
            TenantMembership.objects.get_or_create(
                user=user,
                tenant=tenant,
                defaults={'role': TenantMembership.Role.OWNER}
            )
            Subscription.objects.get_or_create(
                tenant=tenant,
                defaults={'tier': Subscription.Tier.TRIAL}
            )
        else:
            tenant = TenantProvisioningService.provision_new_tenant(
                hotel_name=hotel_name,
                slug=slug,
                region=region,
                owner_email=owner_email,
                owner_password=owner_password,
                primary_currency=primary_currency
            )
            if target_status and target_status != tenant.status:
                tenant.status = target_status
                tenant.save(update_fields=['status'])
            user = User.objects.get(email=owner_email)

        # Generate verification token
        token = EmailVerificationService.generate_token(user.id, tenant.id)
        EmailVerificationService.send_verification_email(owner_email, token, hotel_name)

        return {
            'tenant': tenant,
            'user': user,
            'verification_token': token,
        }

    @staticmethod
    def verify_email(token: str) -> Dict[str, Any]:
        """
        Validate token and mark owner email verified.
        Requirements: 6.5
        """
        data = EmailVerificationService.validate_token(token)
        user = User.objects.get(id=data['user_id'])
        tenant = Tenant.objects.get(id=data['tenant_id'])

        user.email_verified = True
        user.save(update_fields=['email_verified'])

        return {
            'verified': True,
            'user_email': user.email,
            'tenant_slug': tenant.slug,
            'hotel_name': tenant.hotel_name,
        }

    @staticmethod
    def configure_tax(
        tenant: Tenant,
        tax_type: str,
        tax_rate: Decimal,
        tax_registration_number: str = "",
        primary_currency: str = None
    ) -> Tenant:
        """
        Step 2: Save tax & currency configuration.
        Requirements: 6.6
        """
        tenant.tax_type = tax_type
        tenant.tax_rate = Decimal(str(tax_rate))
        tenant.tax_registration_number = tax_registration_number
        if primary_currency:
            tenant.primary_currency = primary_currency.upper()
        tenant.save()
        return tenant

    @staticmethod
    def configure_payment(
        tenant: Tenant,
        gateway: str,
        merchant_id: str,
        secret_key: str,
        api_endpoint: str = "",
        test_mode: bool = True
    ) -> PaymentGatewayConfig:
        """
        Step 3: Save payment gateway credentials.
        Requirements: 6.6
        """
        config, _ = PaymentGatewayConfig.objects.update_or_create(
            tenant=tenant,
            gateway=gateway.upper(),
            defaults={
                'merchant_id': merchant_id,
                'secret_key': secret_key,
                'api_endpoint': api_endpoint,
                'test_mode': test_mode,
                'is_active': True,
            }
        )
        return config

    @staticmethod
    def create_room_categories(
        tenant: Tenant,
        categories: List[Dict[str, Any]]
    ) -> List[RoomCategory]:
        """
        Step 4: Create initial room categories in tenant database.
        Requirements: 6.6
        """
        created = []
        for cat in categories:
            name = cat.get('name')
            slug = cat.get('slug') or re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            price = Decimal(str(cat.get('base_price_npr', cat.get('price', 0))))
            max_occ = int(cat.get('max_occupancy', 2))

            category = RoomCategory.objects.using(tenant.db_name).create(
                name=name,
                slug=slug,
                description=cat.get('description', ''),
                base_price_npr=price,
                max_occupancy=max_occ,
            )
            created.append(category)
        return created

    @staticmethod
    def upload_verification_document(
        tenant: Tenant,
        document_type: str,
        document_file=None,
        document_number: str = "",
        notes: str = ""
    ) -> TenantVerificationDocument:
        """
        Upload and attach a legal/business verification document for tenant review.
        """
        valid_types = [choice[0] for choice in TenantVerificationDocument.DocumentType.choices]
        if document_type not in valid_types:
            raise ValueError(f"Invalid document_type '{document_type}'. Must be one of {valid_types}.")

        doc = TenantVerificationDocument.objects.create(
            tenant=tenant,
            document_type=document_type,
            document_file=document_file,
            document_number=document_number,
            notes=notes,
            status=TenantVerificationDocument.ReviewStatus.PENDING,
        )
        return doc

    @staticmethod
    def submit_for_approval(tenant: Tenant) -> Tenant:
        """
        Submit tenant application for platform admin approval.
        Moves status to PENDING_APPROVAL.
        """
        tenant.status = Tenant.Status.PENDING_APPROVAL
        tenant.save(update_fields=['status', 'updated_at'])
        return tenant

    @staticmethod
    def complete_onboarding(tenant: Tenant, submit_for_approval: bool = False) -> Tenant:
        """
        Final step: Activate tenant for public booking acceptance or submit for approval.
        Requirements: 6.7
        """
        if submit_for_approval:
            tenant.status = Tenant.Status.PENDING_APPROVAL
            tenant.save(update_fields=['status', 'updated_at'])
        elif tenant.status == Tenant.Status.TRIAL:
            # Active in trial mode
            tenant.status = Tenant.Status.ACTIVE
            tenant.save(update_fields=['status', 'updated_at'])
        return tenant

