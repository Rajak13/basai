"""
Serializers for Tenant management, subscriptions, payments, and staff memberships.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Tenant,
    Subscription,
    SubscriptionPayment,
    TenantMembership,
    TenantVerificationDocument,
    StaffInvitation,
)

User = get_user_model()


class TenantVerificationDocumentSerializer(serializers.ModelSerializer):
    document_type_display = serializers.CharField(source='get_document_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_email = serializers.EmailField(source='reviewed_by.email', read_only=True)

    class Meta:
        model = TenantVerificationDocument
        fields = [
            'id',
            'tenant',
            'document_type',
            'document_type_display',
            'document_file',
            'document_number',
            'status',
            'status_display',
            'notes',
            'uploaded_at',
            'reviewed_at',
            'reviewed_by',
            'reviewed_by_email',
        ]
        read_only_fields = ['id', 'status', 'uploaded_at', 'reviewed_at', 'reviewed_by', 'reviewed_by_email']


class StaffInvitationSerializer(serializers.ModelSerializer):
    tenant_slug = serializers.CharField(source='tenant.slug', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    invited_by_email = serializers.EmailField(source='invited_by.email', read_only=True)

    class Meta:
        model = StaffInvitation
        fields = [
            'id',
            'tenant',
            'tenant_slug',
            'email',
            'role',
            'role_display',
            'token',
            'invited_by',
            'invited_by_email',
            'is_accepted',
            'expires_at',
            'created_at',
        ]
        read_only_fields = ['id', 'token', 'is_accepted', 'expires_at', 'created_at']


class StaffInviteCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(
        choices=[
            TenantMembership.Role.MANAGER,
            TenantMembership.Role.FRONT_DESK,
            TenantMembership.Role.HOUSEKEEPING,
        ],
        default=TenantMembership.Role.FRONT_DESK
    )


class StaffAcceptInviteSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default='')
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True, default='')


class TenantApplicationDetailSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    verification_documents = TenantVerificationDocumentSerializer(many=True, read_only=True)
    owner = serializers.SerializerMethodField()
    approved_by_email = serializers.EmailField(source='approved_by.email', read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id',
            'hotel_name',
            'slug',
            'region',
            'status',
            'status_display',
            'primary_currency',
            'tax_type',
            'tax_rate',
            'tax_registration_number',
            'rejection_reason',
            'approved_at',
            'approved_by',
            'approved_by_email',
            'created_at',
            'owner',
            'verification_documents',
        ]

    def get_owner(self, obj):
        owner_membership = TenantMembership.objects.filter(
            tenant=obj,
            role=TenantMembership.Role.OWNER
        ).select_related('user').first()
        if not owner_membership:
            return None
        user = owner_membership.user
        return {
            'id': str(user.id),
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'phone_number': user.phone_number,
            'email_verified': user.email_verified,
        }



class SubscriptionPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionPayment
        fields = [
            'id',
            'amount',
            'currency',
            'status',
            'gateway',
            'transaction_id',
            'billing_cycle',
            'error_message',
            'created_at',
        ]
        read_only_fields = ['id', 'status', 'created_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    tier_display = serializers.CharField(source='get_tier_display', read_only=True)
    billing_cycle_display = serializers.CharField(source='get_billing_cycle_display', read_only=True)
    payments = SubscriptionPaymentSerializer(many=True, read_only=True)

    class Meta:
        model = Subscription
        fields = [
            'tier',
            'tier_display',
            'max_rooms',
            'max_staff',
            'max_monthly_bookings',
            'billing_cycle',
            'billing_cycle_display',
            'price_usd',
            'next_billing_date',
            'allow_custom_domain',
            'allow_api_access',
            'allow_white_label',
            'payments',
        ]


class TenantMembershipSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)

    class Meta:
        model = TenantMembership
        fields = [
            'id',
            'user',
            'user_email',
            'user_full_name',
            'role',
            'role_display',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class StaffCreateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    role = serializers.ChoiceField(choices=TenantMembership.Role.choices, default=TenantMembership.Role.FRONT_DESK)
    first_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    phone_number = serializers.CharField(max_length=20, required=False, allow_blank=True)
