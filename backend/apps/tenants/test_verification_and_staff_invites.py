"""
Comprehensive Unit & Integration Tests for:
1. Hotel Owner Verification & Platform Admin Approval Gating
2. Document Uploads (PAN/VAT, Business Registration, Tourism License, Owner Govt ID)
3. Subdomain/Middleware Access Interception (PENDING_APPROVAL and REJECTED)
4. Staff Invitation-Only Pipeline (Owner/Manager invite, quota enforcement, token acceptance)
5. Multi-Tenant Role-Based Access Control (RBAC) Permissions

Requirements:
- Owners cannot self-activate without legal documents & admin approval.
- Regular guests sign up freely with email verification only.
- Staff (Front Desk, Housekeeping, Manager) cannot self-register; requires signed invitation.
"""
from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from django.test import TestCase, RequestFactory
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from apps.tenants.models import (
    Tenant,
    Subscription,
    TenantMembership,
    TenantVerificationDocument,
    StaffInvitation,
)
from apps.tenants.middleware import TenantMiddleware
from apps.tenants.db_router import set_tenant_schema, clear_tenant_schema

User = get_user_model()


class OwnerVerificationAndApprovalTestCase(TestCase):
    databases = {'default', 'tenant_test'}

    def setUp(self):
        clear_tenant_schema()
        self.client = APIClient()
        self.factory = RequestFactory()
        self.middleware = TenantMiddleware(lambda r: None)

        # Platform Super Admin
        self.platform_admin = User.objects.create_user(
            username="admin@nantio.com",
            email="admin@nantio.com",
            password="AdminPassword123!",
            is_platform_admin=True,
            email_verified=True,
        )

        # Regular Non-Admin User
        self.regular_user = User.objects.create_user(
            username="regular@guest.com",
            email="regular@guest.com",
            password="GuestPassword123!",
            email_verified=True,
        )

    def tearDown(self):
        clear_tenant_schema()
        super().tearDown()

    def test_onboarding_with_pending_approval_and_document_upload(self):
        """
        Verify tenant onboarding creates a PENDING_APPROVAL tenant,
        uploads required legal documents, and blocks public subdomain access.
        """
        # Step 1: Owner initiates onboarding with approval required
        create_payload = {
            'hotel_name': 'Everest Boutique Resort',
            'slug': 'everest-boutique',
            'region': 'NPL',
            'owner_email': 'owner@everestboutique.com',
            'owner_password': 'OwnerSecurePassword123!',
            'mock_db': True,
            'require_approval': True,
        }
        res = self.client.post('/api/onboarding/create-tenant', create_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['tenant_slug'], 'everest-boutique')

        tenant = Tenant.objects.get(slug='everest-boutique')
        self.assertEqual(tenant.status, Tenant.Status.PENDING_APPROVAL)

        # Verify middleware blocks access while under review
        request = self.factory.get('/', HTTP_HOST='everest-boutique.nantio.com')
        response = self.middleware(request)
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 403)
        self.assertIn(b"Hotel Application Under Review", response.content)

        # Step 2: Owner uploads legal verification documents
        dummy_file = SimpleUploadedFile("pan_cert.pdf", b"Dummy PDF file content", content_type="application/pdf")
        doc_res1 = self.client.post(
            '/api/onboarding/upload-document',
            {
                'tenant_slug': 'everest-boutique',
                'document_type': TenantVerificationDocument.DocumentType.PAN_VAT_CERTIFICATE,
                'document_number': 'PAN-109283746',
                'document_file': dummy_file,
                'notes': 'Official VAT registration certificate from IRD Nepal',
            },
            format='multipart'
        )
        self.assertEqual(doc_res1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(doc_res1.data['document_type'], 'PAN_VAT_CERTIFICATE')
        self.assertEqual(doc_res1.data['status'], 'PENDING')

        # Upload 2nd document: Business Registration
        doc_res2 = self.client.post(
            '/api/onboarding/upload-document',
            {
                'tenant_slug': 'everest-boutique',
                'document_type': TenantVerificationDocument.DocumentType.BUSINESS_REGISTRATION,
                'document_number': 'REG-44332211',
                'notes': 'Department of Industry Registration',
            },
            format='json'
        )
        self.assertEqual(doc_res2.status_code, status.HTTP_201_CREATED)

        self.assertEqual(tenant.verification_documents.count(), 2)

    def test_platform_admin_approval_workflow(self):
        """
        Verify only platform admins can view applications, approve tenants,
        which unblocks middleware and activates the hotel.
        """
        # Create a tenant under review
        tenant = Tenant.objects.create(
            hotel_name='Annapurna Peak Lodge',
            slug='annapurna-peak',
            db_name='tenant_test',
            region='NPL',
            primary_currency='NPR',
            status=Tenant.Status.PENDING_APPROVAL,
        )
        owner_user = User.objects.create_user(
            username="owner@annapurna.com",
            email="owner@annapurna.com",
            password="Password123!",
            email_verified=True,
        )
        TenantMembership.objects.create(
            user=owner_user,
            tenant=tenant,
            role=TenantMembership.Role.OWNER,
            is_active=False,
        )
        Subscription.objects.create(tenant=tenant, tier=Subscription.Tier.TRIAL)

        doc = TenantVerificationDocument.objects.create(
            tenant=tenant,
            document_type=TenantVerificationDocument.DocumentType.HOTEL_LICENSE,
            document_number='TOURISM-LIC-8877',
            status=TenantVerificationDocument.ReviewStatus.PENDING,
        )

        # 1. Non-admin user attempts to view pending applications -> 403 Forbidden
        self.client.force_authenticate(user=self.regular_user)
        res_unauth = self.client.get('/api/admin/onboarding/applications')
        self.assertEqual(res_unauth.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Platform admin views applications
        self.client.force_authenticate(user=self.platform_admin)
        res_list = self.client.get('/api/admin/onboarding/applications')
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        slugs = [app['slug'] for app in res_list.data]
        self.assertIn('annapurna-peak', slugs)

        # 3. Platform admin views specific application details
        res_detail = self.client.get(f'/api/admin/onboarding/applications/{tenant.id}/')
        self.assertEqual(res_detail.status_code, status.HTTP_200_OK)
        self.assertEqual(res_detail.data['hotel_name'], 'Annapurna Peak Lodge')
        self.assertEqual(len(res_detail.data['verification_documents']), 1)
        self.assertEqual(res_detail.data['owner']['email'], 'owner@annapurna.com')

        # 4. Platform admin approves the application
        res_approve = self.client.post(f'/api/admin/onboarding/applications/{tenant.id}/approve/')
        self.assertEqual(res_approve.status_code, status.HTTP_200_OK)

        tenant.refresh_from_db()
        self.assertEqual(tenant.status, Tenant.Status.ACTIVE)
        self.assertIsNotNone(tenant.approved_at)
        self.assertEqual(tenant.approved_by, self.platform_admin)

        # Verification document status is updated to APPROVED
        doc.refresh_from_db()
        self.assertEqual(doc.status, TenantVerificationDocument.ReviewStatus.APPROVED)
        self.assertEqual(doc.reviewed_by, self.platform_admin)

        # Owner membership is active
        owner_membership = TenantMembership.objects.get(user=owner_user, tenant=tenant)
        self.assertTrue(owner_membership.is_active)

        # 5. Middleware now permits tenant request
        request = self.factory.get('/', HTTP_HOST='annapurna-peak.nantio.com')
        response = self.middleware(request)
        # None returned indicates middleware passed through to view
        self.assertIsNone(response)

    def test_platform_admin_rejection_workflow(self):
        """
        Verify platform admin can reject an application with a mandatory reason,
        transitioning status to REJECTED and blocking tenant access.
        """
        tenant = Tenant.objects.create(
            hotel_name='Suspicious Unregistered Hotel',
            slug='suspicious-hotel',
            db_name='tenant_test',
            region='NPL',
            primary_currency='NPR',
            status=Tenant.Status.PENDING_APPROVAL,
        )
        owner_user = User.objects.create_user(
            username="fake@owner.com",
            email="fake@owner.com",
            password="Password123!",
        )
        TenantMembership.objects.create(
            user=owner_user,
            tenant=tenant,
            role=TenantMembership.Role.OWNER,
            is_active=False,
        )

        self.client.force_authenticate(user=self.platform_admin)

        # Rejection without reason fails with 400
        res_fail = self.client.post(
            f'/api/admin/onboarding/applications/{tenant.id}/reject/',
            {'rejection_reason': ''},
            format='json'
        )
        self.assertEqual(res_fail.status_code, status.HTTP_400_BAD_REQUEST)

        # Rejection with reason succeeds
        reason = "Submitted PAN certificate does not match the hotel registration name."
        res_reject = self.client.post(
            f'/api/admin/onboarding/applications/{tenant.id}/reject/',
            {'rejection_reason': reason},
            format='json'
        )
        self.assertEqual(res_reject.status_code, status.HTTP_200_OK)

        tenant.refresh_from_db()
        self.assertEqual(tenant.status, Tenant.Status.REJECTED)
        self.assertEqual(tenant.rejection_reason, reason)

        # Middleware blocks rejected tenant with 403
        request = self.factory.get('/', HTTP_HOST='suspicious-hotel.nantio.com')
        response = self.middleware(request)
        self.assertIsNotNone(response)
        self.assertEqual(response.status_code, 403)
        self.assertIn(b"Hotel Registration Not Approved", response.content)


class StaffInvitationAndRBACPipelineTestCase(TestCase):
    databases = {'default', 'tenant_test'}

    def setUp(self):
        clear_tenant_schema()
        self.client = APIClient()

        # Create active tenant
        self.tenant = Tenant.objects.create(
            hotel_name='Lakeside Grand Resort',
            slug='lakeside-grand',
            db_name='tenant_test',
            region='NPL',
            primary_currency='NPR',
            status=Tenant.Status.ACTIVE,
        )

        # Subscription with max_staff = 3
        self.subscription = Subscription.objects.create(
            tenant=self.tenant,
            tier=Subscription.Tier.TRIAL,
            max_staff=3,
        )

        # Hotel Owner
        self.owner = User.objects.create_user(
            username="owner@lakeside.com",
            email="owner@lakeside.com",
            password="OwnerPassword123!",
            email_verified=True,
        )
        TenantMembership.objects.create(
            user=self.owner,
            tenant=self.tenant,
            role=TenantMembership.Role.OWNER,
            is_active=True,
        )

        # Hotel Manager
        self.manager = User.objects.create_user(
            username="manager@lakeside.com",
            email="manager@lakeside.com",
            password="ManagerPassword123!",
            email_verified=True,
        )
        TenantMembership.objects.create(
            user=self.manager,
            tenant=self.tenant,
            role=TenantMembership.Role.MANAGER,
            is_active=True,
        )

        # Front Desk Staff
        self.front_desk_user = User.objects.create_user(
            username="frontdesk@lakeside.com",
            email="frontdesk@lakeside.com",
            password="StaffPassword123!",
            email_verified=True,
        )
        TenantMembership.objects.create(
            user=self.front_desk_user,
            tenant=self.tenant,
            role=TenantMembership.Role.FRONT_DESK,
            is_active=True,
        )

        # External Unaffiliated User
        self.external_user = User.objects.create_user(
            username="random@guest.com",
            email="random@guest.com",
            password="GuestPassword123!",
            email_verified=True,
        )

        self.tenant_headers = {'HTTP_HOST': 'lakeside-grand.nantio.com'}

    def tearDown(self):
        clear_tenant_schema()
        super().tearDown()

    def test_only_owner_and_manager_can_invite_staff(self):
        """Verify Front Desk and external users cannot send staff invitations."""
        invite_payload = {
            'email': 'newstaff@lakeside.com',
            'role': TenantMembership.Role.FRONT_DESK,
        }

        # 1. External user -> 403 Forbidden
        self.client.force_authenticate(user=self.external_user)
        res = self.client.post('/api/tenants/staff/invite/', invite_payload, format='json', **self.tenant_headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # 2. Front Desk staff -> 403 Forbidden
        self.client.force_authenticate(user=self.front_desk_user)
        res = self.client.post('/api/tenants/staff/invite/', invite_payload, format='json', **self.tenant_headers)
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

        # 3. Manager -> 201 Created (allowed)
        # Note: currently 3 members (owner, manager, front desk). Limit is 3.
        # Let's increase max_staff to 5 to allow invitation
        self.subscription.max_staff = 5
        self.subscription.save()

        self.client.force_authenticate(user=self.manager)
        res = self.client.post('/api/tenants/staff/invite/', invite_payload, format='json', **self.tenant_headers)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['email'], 'newstaff@lakeside.com')
        self.assertEqual(res.data['role'], 'FRONT_DESK')
        self.assertTrue(res.data['token'])

    def test_staff_quota_enforcement_on_invitation(self):
        """Verify invitation is blocked if subscription staff quota is exceeded."""
        # Current active members: owner (1), manager (2), front desk (3).
        # Subscription max_staff is 3. Attempting to invite a 4th must return 403 QUOTA_EXCEEDED.
        self.client.force_authenticate(user=self.owner)
        res = self.client.post(
            '/api/tenants/staff/invite/',
            {'email': 'fourth_staff@lakeside.com', 'role': 'HOUSEKEEPING'},
            format='json',
            **self.tenant_headers
        )
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(res.data.get('code'), 'QUOTA_EXCEEDED')

    def test_invitation_acceptance_pipeline(self):
        """
        Verify the full invite-to-accept pipeline:
        1. Owner invites a housekeeper.
        2. Housekeeper receives token and accepts via public endpoint.
        3. User is created/activated with HOUSEKEEPING membership.
        4. Token cannot be reused or accepted once expired.
        """
        self.subscription.max_staff = 10
        self.subscription.save()

        # Step 1: Owner sends invite
        self.client.force_authenticate(user=self.owner)
        invite_res = self.client.post(
            '/api/tenants/staff/invite/',
            {'email': 'geeta.housekeeping@lakeside.com', 'role': 'HOUSEKEEPING'},
            format='json',
            **self.tenant_headers
        )
        self.assertEqual(invite_res.status_code, status.HTTP_201_CREATED)
        token = invite_res.data['token']

        # Step 2: Unauthenticated / public accept endpoint
        self.client.force_authenticate(user=None)
        accept_payload = {
            'token': token,
            'password': 'SecureHousekeeper123!',
            'first_name': 'Geeta',
            'last_name': 'Sharma',
            'phone_number': '+977-9801234567',
        }
        accept_res = self.client.post('/api/tenants/staff/accept-invite/', accept_payload, format='json')
        self.assertEqual(accept_res.status_code, status.HTTP_200_OK)
        self.assertEqual(accept_res.data['email'], 'geeta.housekeeping@lakeside.com')
        self.assertEqual(accept_res.data['role'], 'HOUSEKEEPING')

        # Verify database state
        new_user = User.objects.get(email='geeta.housekeeping@lakeside.com')
        self.assertEqual(new_user.first_name, 'Geeta')
        self.assertEqual(new_user.last_name, 'Sharma')
        self.assertTrue(new_user.check_password('SecureHousekeeper123!'))
        self.assertTrue(new_user.email_verified)

        membership = TenantMembership.objects.get(user=new_user, tenant=self.tenant)
        self.assertEqual(membership.role, TenantMembership.Role.HOUSEKEEPING)
        self.assertTrue(membership.is_active)

        invitation = StaffInvitation.objects.get(token=token)
        self.assertTrue(invitation.is_accepted)

        # Step 3: Re-accepting the same token fails
        repeat_res = self.client.post('/api/tenants/staff/accept-invite/', accept_payload, format='json')
        self.assertEqual(repeat_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("already been accepted", repeat_res.data['error'])

    def test_expired_invitation_rejection(self):
        """Verify that accepting an expired invitation token returns 400."""
        expired_invite = StaffInvitation.objects.create(
            tenant=self.tenant,
            email='expired@lakeside.com',
            role=TenantMembership.Role.FRONT_DESK,
            token='expired-secret-token-xyz',
            invited_by=self.owner,
            expires_at=timezone.now() - timedelta(days=1),  # Expired yesterday
            is_accepted=False,
        )

        accept_payload = {
            'token': expired_invite.token,
            'password': 'Password123!',
        }
        res = self.client.post('/api/tenants/staff/accept-invite/', accept_payload, format='json')
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("expired", res.data['error'])

    def test_subscription_management_restricted_to_owner(self):
        """
        Verify that only Hotel Owners can view and change subscription plans,
        while Managers, Front Desk, and Housekeeping cannot.
        """
        # Manager tries to access subscription view -> 403 Forbidden
        self.client.force_authenticate(user=self.manager)
        res_mgr = self.client.get('/api/tenants/subscription/', **self.tenant_headers)
        self.assertEqual(res_mgr.status_code, status.HTTP_403_FORBIDDEN)

        # Front Desk staff tries to access subscription view -> 403 Forbidden
        self.client.force_authenticate(user=self.front_desk_user)
        res_fd = self.client.get('/api/tenants/subscription/', **self.tenant_headers)
        self.assertEqual(res_fd.status_code, status.HTTP_403_FORBIDDEN)

        # Owner accesses subscription view -> 200 OK
        self.client.force_authenticate(user=self.owner)
        res_owner = self.client.get('/api/tenants/subscription/', **self.tenant_headers)
        self.assertEqual(res_owner.status_code, status.HTTP_200_OK)
        self.assertEqual(res_owner.data['tier'], 'TRIAL')
