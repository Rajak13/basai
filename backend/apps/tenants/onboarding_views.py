"""
API Views for Hotel Onboarding Flow

Endpoints:
- POST /api/onboarding/check-slug
- POST /api/onboarding/create-tenant
- POST /api/onboarding/verify-email
- POST /api/onboarding/configure-tax
- POST /api/onboarding/configure-payment
- POST /api/onboarding/create-rooms
- POST /api/onboarding/complete

Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7
"""
from decimal import Decimal
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from django.shortcuts import get_object_or_404

from .models import Tenant
from .onboarding_service import OnboardingService, EmailVerificationService


class CheckSlugView(APIView):
    """Validate slug availability and formatting."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        slug = request.data.get('slug', '')
        result = OnboardingService.check_slug(slug)
        status_code = status.HTTP_200_OK if result['available'] else status.HTTP_400_BAD_REQUEST
        return Response(result, status=status_code)


class CreateTenantOnboardingView(APIView):
    """Step 1: Create tenant registry and send verification email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        hotel_name = request.data.get('hotel_name')
        slug = request.data.get('slug')
        region = request.data.get('region', 'NPL')
        owner_email = request.data.get('owner_email')
        owner_password = request.data.get('owner_password')
        primary_currency = request.data.get('primary_currency')
        mock_db = request.data.get('mock_db', False)
        initial_status = request.data.get('initial_status')
        require_approval = request.data.get('require_approval', False)

        if not all([hotel_name, slug, owner_email]):
            return Response(
                {"error": "hotel_name, slug, and owner_email are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            result = OnboardingService.create_tenant_onboarding(
                hotel_name=hotel_name,
                slug=slug,
                region=region,
                owner_email=owner_email,
                owner_password=owner_password,
                primary_currency=primary_currency,
                mock_db=mock_db,
                initial_status=initial_status,
                require_approval=require_approval,
            )
            return Response({
                "message": f"Tenant '{hotel_name}' created successfully. Verification email sent.",
                "tenant_slug": result['tenant'].slug,
                "owner_email": result['user'].email,
                "verification_token": result['verification_token'],
            }, status=status.HTTP_201_CREATED)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as err:
            return Response({"error": f"Provisioning failed: {str(err)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class VerifyEmailView(APIView):
    """Verify owner email with token and unlock subsequent setup steps."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "token is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            result = OnboardingService.verify_email(token)
            return Response({
                "message": "Email verified successfully.",
                **result
            }, status=status.HTTP_200_OK)
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)


class ConfigureTaxView(APIView):
    """Step 2: Save tax & currency configuration."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        tenant_slug = request.data.get('tenant_slug')
        tax_type = request.data.get('tax_type', 'VAT')
        tax_rate = request.data.get('tax_rate', '13.00')
        tax_registration_number = request.data.get('tax_registration_number', '')
        primary_currency = request.data.get('primary_currency')

        tenant = Tenant.objects.using('default').filter(slug=tenant_slug).first()
        if not tenant:
            return Response({"error": f"Tenant '{tenant_slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        tenant = OnboardingService.configure_tax(
            tenant=tenant,
            tax_type=tax_type,
            tax_rate=Decimal(str(tax_rate)),
            tax_registration_number=tax_registration_number,
            primary_currency=primary_currency
        )

        return Response({
            "message": "Tax and currency configuration saved.",
            "tenant_slug": tenant.slug,
            "tax_type": tenant.tax_type,
            "tax_rate": str(tenant.tax_rate),
            "primary_currency": tenant.primary_currency,
        }, status=status.HTTP_200_OK)


class ConfigurePaymentView(APIView):
    """Step 3: Save regional payment gateway credentials."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        tenant_slug = request.data.get('tenant_slug')
        gateway = request.data.get('gateway')
        merchant_id = request.data.get('merchant_id')
        secret_key = request.data.get('secret_key')
        api_endpoint = request.data.get('api_endpoint', '')
        test_mode = request.data.get('test_mode', True)

        if not all([tenant_slug, gateway, merchant_id, secret_key]):
            return Response(
                {"error": "tenant_slug, gateway, merchant_id, and secret_key are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        tenant = Tenant.objects.using('default').filter(slug=tenant_slug).first()
        if not tenant:
            return Response({"error": f"Tenant '{tenant_slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        config = OnboardingService.configure_payment(
            tenant=tenant,
            gateway=gateway,
            merchant_id=merchant_id,
            secret_key=secret_key,
            api_endpoint=api_endpoint,
            test_mode=test_mode
        )

        return Response({
            "message": f"Payment gateway '{gateway}' configured successfully.",
            "tenant_slug": tenant.slug,
            "gateway": config.gateway,
            "is_active": config.is_active,
        }, status=status.HTTP_200_OK)


class CreateRoomsView(APIView):
    """Step 4: Create initial room categories in tenant database."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        tenant_slug = request.data.get('tenant_slug')
        categories = request.data.get('categories', [])

        tenant = Tenant.objects.using('default').filter(slug=tenant_slug).first()
        if not tenant:
            return Response({"error": f"Tenant '{tenant_slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        if not categories:
            return Response({"error": "At least one room category is required."}, status=status.HTTP_400_BAD_REQUEST)

        created = OnboardingService.create_room_categories(tenant, categories)
        return Response({
            "message": f"{len(created)} room categories created.",
            "categories": [{"name": c.name, "slug": c.slug} for c in created]
        }, status=status.HTTP_201_CREATED)


from .serializers import TenantVerificationDocumentSerializer


class UploadVerificationDocumentView(APIView):
    """
    Upload official business/legal verification documents during hotel onboarding.
    Requires tenant_slug and document_type (e.g., PAN_VAT_CERTIFICATE, BUSINESS_REGISTRATION, etc.).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        tenant_slug = request.data.get('tenant_slug')
        document_type = request.data.get('document_type')
        document_number = request.data.get('document_number', '')
        document_file = request.FILES.get('document_file')
        notes = request.data.get('notes', '')

        if not tenant_slug or not document_type:
            return Response(
                {"error": "tenant_slug and document_type are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        tenant = Tenant.objects.using('default').filter(slug=tenant_slug).first()
        if not tenant:
            return Response(
                {"error": f"Tenant '{tenant_slug}' not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            doc = OnboardingService.upload_verification_document(
                tenant=tenant,
                document_type=document_type,
                document_file=document_file,
                document_number=document_number,
                notes=notes,
            )
            return Response(
                TenantVerificationDocumentSerializer(doc).data,
                status=status.HTTP_201_CREATED
            )
        except ValueError as err:
            return Response({"error": str(err)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as err:
            return Response({"error": f"Upload failed: {str(err)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CompleteOnboardingView(APIView):
    """Final step: Finalize onboarding and activate tenant or submit for admin approval."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        tenant_slug = request.data.get('tenant_slug')
        submit_for_approval = request.data.get('submit_for_approval', False)

        tenant = Tenant.objects.using('default').filter(slug=tenant_slug).first()
        if not tenant:
            return Response({"error": f"Tenant '{tenant_slug}' not found."}, status=status.HTTP_404_NOT_FOUND)

        tenant = OnboardingService.complete_onboarding(tenant, submit_for_approval=submit_for_approval)

        return Response({
            "message": f"Onboarding complete! Status: {tenant.status}.",
            "tenant_slug": tenant.slug,
            "status": tenant.status,
            "hotel_name": tenant.hotel_name,
        }, status=status.HTTP_200_OK)

