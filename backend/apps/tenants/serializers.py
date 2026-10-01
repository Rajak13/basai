"""
Serializers for Tenant management, subscriptions, payments, and staff memberships.
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Tenant, Subscription, SubscriptionPayment, TenantMembership

User = get_user_model()


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
