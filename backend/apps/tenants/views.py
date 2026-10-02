import secrets
import logging
from datetime import timedelta
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .models import Tenant, Subscription, SubscriptionPayment, TenantMembership, StaffInvitation
from .serializers import (
    SubscriptionSerializer,
    SubscriptionPaymentSerializer,
    TenantMembershipSerializer,
    StaffCreateSerializer,
    StaffInvitationSerializer,
    StaffInviteCreateSerializer,
    StaffAcceptInviteSerializer,
)
from .subscription_service import (
    SubscriptionService,
    QuotaExceededException,
    TenantSuspendedException,
)
from .permissions import IsTenantOwner, IsTenantManagerOrAbove, _get_tenant

User = get_user_model()
logger = logging.getLogger(__name__)


class StaffViewSet(viewsets.ModelViewSet):
    """
    Staff account management for the active tenant.
    Enforces staff quota limits before adding new staff.
    
    Requirements: 4.4, 11.1, 11.2, 11.3
    """
    serializer_class = TenantMembershipSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantManagerOrAbove]

    def get_queryset(self):
        tenant = getattr(self.request, 'tenant', None)
        if not tenant:
            return TenantMembership.objects.none()
        return TenantMembership.objects.filter(tenant=tenant)

    def create(self, request, *args, **kwargs):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response(
                {"error": "No active hotel tenant found for this request domain"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = StaffCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data

        # Enforce staff resource quota
        try:
            SubscriptionService.check_resource_quota(tenant, 'staff')
        except (QuotaExceededException, TenantSuspendedException) as exc:
            return Response(
                {"error": str(exc), "code": "QUOTA_EXCEEDED"},
                status=status.HTTP_403_FORBIDDEN
            )

        email = validated_data['email']
        role = validated_data['role']

        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': validated_data.get('first_name', ''),
                'last_name': validated_data.get('last_name', ''),
                'phone_number': validated_data.get('phone_number', ''),
            }
        )

        membership, m_created = TenantMembership.objects.get_or_create(
            user=user,
            tenant=tenant,
            defaults={'role': role, 'is_active': True}
        )
        if not m_created:
            if not membership.is_active:
                membership.is_active = True
                membership.role = role
                membership.save()
            else:
                return Response(
                    {"error": "User already has an active staff account for this hotel."},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return Response(
            TenantMembershipSerializer(membership).data,
            status=status.HTTP_201_CREATED
        )


class InviteStaffView(APIView):
    """
    Invite new staff member to active tenant.
    Only callable by Hotel Owners and Managers.
    Enforces staff quota limits before generating cryptographically signed invitation.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantManagerOrAbove]

    def post(self, request):
        tenant = _get_tenant(request)
        if not tenant:
            return Response(
                {"error": "No active hotel tenant found for this request domain"},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = StaffInviteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        role = serializer.validated_data['role']

        # Enforce staff resource quota
        try:
            SubscriptionService.check_resource_quota(tenant, 'staff')
        except (QuotaExceededException, TenantSuspendedException) as exc:
            return Response(
                {"error": str(exc), "code": "QUOTA_EXCEEDED"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if already active staff
        if TenantMembership.objects.filter(tenant=tenant, user__email=email, is_active=True).exists():
            return Response(
                {"error": "User is already an active staff member for this hotel."},
                status=status.HTTP_400_BAD_REQUEST
            )

        token = secrets.token_urlsafe(32)
        expires_at = timezone.now() + timedelta(hours=72)

        invitation, _ = StaffInvitation.objects.update_or_create(
            tenant=tenant,
            email=email,
            is_accepted=False,
            defaults={
                'role': role,
                'token': token,
                'invited_by': request.user,
                'expires_at': expires_at,
            }
        )

        # Send invitation email
        invite_url = f"https://{tenant.slug}.nantio.com/accept-invite?token={token}"
        try:
            send_mail(
                subject=f"Invitation to join {tenant.hotel_name} on Nantio",
                message=(
                    f"Hello,\n\n"
                    f"{request.user.get_full_name() or request.user.email} has invited you to join "
                    f"the staff of {tenant.hotel_name} as {invitation.get_role_display()}.\n\n"
                    f"To accept this invitation and activate your account, click the link below:\n"
                    f"{invite_url}\n\n"
                    f"This invitation expires in 72 hours."
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nantio.com'),
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception as e:
            logger.warning(f"Could not send invitation email to {email}: {e}")

        return Response(
            StaffInvitationSerializer(invitation).data,
            status=status.HTTP_201_CREATED
        )


class ListStaffInvitationsView(APIView):
    """
    List all pending and accepted invitations for the active tenant.
    Accessible only by Hotel Owners and Managers.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantManagerOrAbove]

    def get(self, request):
        tenant = _get_tenant(request)
        if not tenant:
            return Response(
                {"error": "No active hotel tenant found for this request domain"},
                status=status.HTTP_400_BAD_REQUEST
            )

        invitations = StaffInvitation.objects.filter(tenant=tenant).order_by('-created_at')
        serializer = StaffInvitationSerializer(invitations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AcceptStaffInvitationView(APIView):
    """
    Public endpoint for invited staff members to accept an invite token,
    set their account password and name, and activate their tenant role.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = StaffAcceptInviteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        invitation = StaffInvitation.objects.filter(token=token).first()
        if not invitation:
            return Response(
                {"error": "Invalid invitation token."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if invitation.is_accepted:
            return Response(
                {"error": "This invitation has already been accepted."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if invitation.expires_at < timezone.now():
            return Response(
                {"error": "This invitation has expired. Please ask your hotel manager to resend it."},
                status=status.HTTP_400_BAD_REQUEST
            )

        email = invitation.email
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                'username': email,
                'first_name': serializer.validated_data.get('first_name', ''),
                'last_name': serializer.validated_data.get('last_name', ''),
                'phone_number': serializer.validated_data.get('phone_number', ''),
                'email_verified': True,
            }
        )
        if not created:
            if serializer.validated_data.get('first_name'):
                user.first_name = serializer.validated_data['first_name']
            if serializer.validated_data.get('last_name'):
                user.last_name = serializer.validated_data['last_name']
            if serializer.validated_data.get('phone_number'):
                user.phone_number = serializer.validated_data['phone_number']

        user.set_password(serializer.validated_data['password'])
        user.email_verified = True
        user.save()

        # Activate or create membership with invited role
        membership, m_created = TenantMembership.objects.get_or_create(
            user=user,
            tenant=invitation.tenant,
            defaults={'role': invitation.role, 'is_active': True}
        )
        if not m_created:
            membership.role = invitation.role
            membership.is_active = True
            membership.save()

        # Mark invitation accepted
        invitation.is_accepted = True
        invitation.save(update_fields=['is_accepted'])

        return Response({
            "message": f"Invitation accepted! Welcome to {invitation.tenant.hotel_name}.",
            "tenant_slug": invitation.tenant.slug,
            "hotel_name": invitation.tenant.hotel_name,
            "email": user.email,
            "role": invitation.role,
            "user_id": str(user.id),
        }, status=status.HTTP_200_OK)


class SubscriptionView(APIView):
    """
    View and manage subscription for the active tenant.
    
    Requirements: 4.1, 4.3, 14.1, 14.4
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantOwner]

    def get(self, request):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response(
                {"error": "Tenant context required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        subscription, _ = Subscription.objects.get_or_create(
            tenant=tenant,
            defaults={'tier': Subscription.Tier.TRIAL}
        )
        serializer = SubscriptionSerializer(subscription)
        return Response(serializer.data)

    def post(self, request):
        """Change subscription tier or billing cycle"""
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response(
                {"error": "Tenant context required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        new_tier = request.data.get('tier')
        billing_cycle = request.data.get('billing_cycle')

        try:
            subscription = SubscriptionService.change_tier(
                subscription=tenant.subscription,
                new_tier=new_tier,
                billing_cycle=billing_cycle
            )
            return Response(SubscriptionSerializer(subscription).data)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class SubscriptionPaymentView(APIView):
    """
    Process subscription payments and track billing history.
    
    Requirements: 4.5, 4.6, 4.7
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantOwner]


    def post(self, request):
        tenant = getattr(request, 'tenant', None)
        if not tenant:
            return Response(
                {"error": "Tenant context required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        subscription = tenant.subscription
        gateway = request.data.get('gateway', 'STRIPE')
        simulate_failure = request.data.get('simulate_failure', False)

        payment = SubscriptionService.process_subscription_payment(
            subscription=subscription,
            gateway=gateway,
            simulate_failure=simulate_failure
        )
        serializer = SubscriptionPaymentSerializer(payment)
        status_code = status.HTTP_200_OK if payment.status == SubscriptionPayment.Status.SUCCESS else status.HTTP_402_PAYMENT_REQUIRED
        return Response(serializer.data, status=status_code)


class TenantResolveView(APIView):
    """
    Resolve tenant branding and configuration from hostname.
    Accepts X-Host header or request hostname, cached for 5 minutes.
    
    Requirements: 2.1, 2.2, 2.3, 7.6
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.core.cache import cache
        raw_host = request.headers.get('X-Host') or request.get_host()
        hostname = raw_host.split(':')[0].strip().lower()

        cache_key = f"tenant_resolve_{hostname}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return Response(cached_data)

        # 1. Custom domain lookup
        tenant = Tenant.objects.using('default').filter(
            custom_domain=hostname,
            status__in=[Tenant.Status.ACTIVE, Tenant.Status.TRIAL]
        ).first()

        # 2. Subdomain lookup
        if not tenant:
            parts = hostname.split('.')
            if len(parts) >= 2:
                subdomain = parts[0]
                tenant = Tenant.objects.using('default').filter(
                    slug=subdomain,
                    status__in=[Tenant.Status.ACTIVE, Tenant.Status.TRIAL]
                ).first()

        # 3. Direct slug match (e.g. for development testing)
        if not tenant:
            tenant = Tenant.objects.using('default').filter(
                slug=hostname,
                status__in=[Tenant.Status.ACTIVE, Tenant.Status.TRIAL]
            ).first()

        if not tenant:
            return Response(
                {"error": f"Tenant not found for host '{hostname}'"},
                status=status.HTTP_404_NOT_FOUND
            )

        data = {
            "id": str(tenant.id),
            "slug": tenant.slug,
            "hotel_name": tenant.hotel_name,
            "logo_url": tenant.logo_url,
            "primary_color": tenant.primary_color,
            "accent_color": tenant.accent_color,
            "currency": tenant.primary_currency,
            "region": tenant.region,
            "status": tenant.status,
            "custom_domain": tenant.custom_domain,
            "tax_type": tenant.tax_type,
            "tax_rate": str(tenant.tax_rate),
            "trial_ends_at": tenant.trial_ends_at.isoformat() if tenant.trial_ends_at else None,
        }

        # Cache for 5 minutes (300 seconds)
        cache.set(cache_key, data, 300)
        return Response(data)

