"""
Admin API views for platform administrators to review, approve, or reject
hotel onboarding applications and verification documents.
"""
import logging
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Tenant, TenantMembership, TenantVerificationDocument
from .serializers import TenantApplicationDetailSerializer
from .permissions import IsPlatformAdmin

logger = logging.getLogger(__name__)


class TenantApplicationListView(APIView):
    """
    List hotel onboarding applications.
    Defaults to tenants pending approval. Can filter with ?status=...
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request):
        status_filter = request.query_params.get('status', Tenant.Status.PENDING_APPROVAL)
        if status_filter == 'ALL':
            tenants = Tenant.objects.all().order_by('-created_at')
        else:
            tenants = Tenant.objects.filter(status=status_filter).order_by('-created_at')
        
        serializer = TenantApplicationDetailSerializer(tenants, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TenantApplicationDetailView(APIView):
    """
    Retrieve full details of a specific hotel onboarding application,
    including owner profile and uploaded legal verification documents.
    """
    permission_classes = [IsPlatformAdmin]

    def get(self, request, tenant_id):
        tenant = get_object_or_404(Tenant, id=tenant_id)
        serializer = TenantApplicationDetailSerializer(tenant)
        return Response(serializer.data, status=status.HTTP_200_OK)


class TenantApplicationApproveView(APIView):
    """
    Approve a pending hotel onboarding application.
    Marks tenant active, marks verification documents approved,
    activates owner membership, and notifies hotel owner via email.
    """
    permission_classes = [IsPlatformAdmin]

    def post(self, request, tenant_id):
        tenant = get_object_or_404(Tenant, id=tenant_id)
        now = timezone.now()

        tenant.status = Tenant.Status.ACTIVE
        tenant.approved_at = now
        tenant.approved_by = request.user
        tenant.rejection_reason = ""
        tenant.save(update_fields=['status', 'approved_at', 'approved_by', 'rejection_reason', 'updated_at'])

        # Approve pending verification documents
        TenantVerificationDocument.objects.filter(
            tenant=tenant,
            status=TenantVerificationDocument.ReviewStatus.PENDING
        ).update(
            status=TenantVerificationDocument.ReviewStatus.APPROVED,
            reviewed_at=now,
            reviewed_by=request.user,
        )

        # Activate owner membership
        TenantMembership.objects.filter(
            tenant=tenant,
            role=TenantMembership.Role.OWNER
        ).update(is_active=True)

        # Notify owner
        owner_membership = TenantMembership.objects.filter(
            tenant=tenant,
            role=TenantMembership.Role.OWNER
        ).select_related('user').first()

        if owner_membership and owner_membership.user.email:
            try:
                send_mail(
                    subject=f"Congratulations! Your hotel {tenant.hotel_name} has been approved on Nantio",
                    message=(
                        f"Hello {owner_membership.user.first_name or 'Hotel Owner'},\n\n"
                        f"Your hotel registration for '{tenant.hotel_name}' has been reviewed and APPROVED "
                        f"by Nantio platform administrators.\n\n"
                        f"Your hotel console is now fully active at https://{tenant.slug}.nantio.com\n\n"
                        f"Best regards,\nThe Nantio Platform Team"
                    ),
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nantio.com'),
                    recipient_list=[owner_membership.user.email],
                    fail_silently=True
                )
            except Exception as e:
                logger.warning(f"Failed to send approval email: {e}")

        serializer = TenantApplicationDetailSerializer(tenant)
        return Response({
            "message": f"Hotel '{tenant.hotel_name}' has been approved and activated.",
            "application": serializer.data,
        }, status=status.HTTP_200_OK)


class TenantApplicationRejectView(APIView):
    """
    Reject a hotel onboarding application.
    Sets status to REJECTED with a mandatory reason, and notifies hotel owner.
    """
    permission_classes = [IsPlatformAdmin]

    def post(self, request, tenant_id):
        tenant = get_object_or_404(Tenant, id=tenant_id)
        rejection_reason = request.data.get('rejection_reason', '').strip()

        if not rejection_reason:
            return Response(
                {"error": "A rejection_reason is required to reject an application."},
                status=status.HTTP_400_BAD_REQUEST
            )

        now = timezone.now()
        tenant.status = Tenant.Status.REJECTED
        tenant.rejection_reason = rejection_reason
        tenant.save(update_fields=['status', 'rejection_reason', 'updated_at'])

        # Mark pending documents as rejected
        TenantVerificationDocument.objects.filter(
            tenant=tenant,
            status=TenantVerificationDocument.ReviewStatus.PENDING
        ).update(
            status=TenantVerificationDocument.ReviewStatus.REJECTED,
            reviewed_at=now,
            reviewed_by=request.user,
            notes=rejection_reason,
        )

        # Notify owner
        owner_membership = TenantMembership.objects.filter(
            tenant=tenant,
            role=TenantMembership.Role.OWNER
        ).select_related('user').first()

        if owner_membership and owner_membership.user.email:
            try:
                send_mail(
                    subject=f"Update regarding your hotel registration for {tenant.hotel_name}",
                    message=(
                        f"Hello {owner_membership.user.first_name or 'Hotel Owner'},\n\n"
                        f"Thank you for your interest in Nantio. Unfortunately, your hotel registration for "
                        f"'{tenant.hotel_name}' could not be approved at this time.\n\n"
                        f"Reason provided:\n{rejection_reason}\n\n"
                        f"If you believe this is in error or have updated documents, please contact platform support.\n\n"
                        f"Best regards,\nThe Nantio Platform Team"
                    ),
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@nantio.com'),
                    recipient_list=[owner_membership.user.email],
                    fail_silently=True
                )
            except Exception as e:
                logger.warning(f"Failed to send rejection email: {e}")

        serializer = TenantApplicationDetailSerializer(tenant)
        return Response({
            "message": f"Hotel '{tenant.hotel_name}' registration rejected.",
            "application": serializer.data,
        }, status=status.HTTP_200_OK)
