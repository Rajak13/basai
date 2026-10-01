"""
Django Admin configuration for Tenant models
"""
from django.contrib import admin
from .models import Tenant, Subscription, TenantMembership, PaymentGatewayConfig


@admin.register(Tenant)
class TenantAdmin(admin.ModelAdmin):
    list_display = ['hotel_name', 'slug', 'region', 'status', 'primary_currency', 'created_at']
    list_filter = ['status', 'region', 'created_at']
    search_fields = ['hotel_name', 'slug', 'db_name']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    fieldsets = (
        ('Identity', {
            'fields': ('id', 'slug', 'hotel_name')
        }),
        ('Database Configuration', {
            'fields': ('db_name', 'db_host', 'db_port')
        }),
        ('Status', {
            'fields': ('status', 'trial_ends_at')
        }),
        ('Regional Configuration', {
            'fields': ('region', 'primary_currency', 'tax_type', 'tax_rate', 'tax_registration_number')
        }),
        ('Branding', {
            'fields': ('logo_url', 'primary_color', 'accent_color', 'custom_domain')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'tier', 'max_rooms', 'max_staff', 'billing_cycle', 'price_usd', 'next_billing_date']
    list_filter = ['tier', 'billing_cycle', 'created_at']
    search_fields = ['tenant__hotel_name', 'tenant__slug']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Tenant', {
            'fields': ('tenant',)
        }),
        ('Subscription Tier', {
            'fields': ('tier',)
        }),
        ('Resource Quotas', {
            'fields': ('max_rooms', 'max_staff', 'max_monthly_bookings')
        }),
        ('Billing', {
            'fields': ('billing_cycle', 'price_usd', 'next_billing_date')
        }),
        ('Feature Gates', {
            'fields': ('allow_custom_domain', 'allow_api_access', 'allow_white_label')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )


@admin.register(TenantMembership)
class TenantMembershipAdmin(admin.ModelAdmin):
    list_display = ['user', 'tenant', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'tenant__hotel_name']
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('User & Tenant', {
            'fields': ('user', 'tenant')
        }),
        ('Role & Status', {
            'fields': ('role', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at',)
        }),
    )


@admin.register(PaymentGatewayConfig)
class PaymentGatewayConfigAdmin(admin.ModelAdmin):
    list_display = ['tenant', 'gateway', 'is_active', 'test_mode', 'created_at']
    list_filter = ['gateway', 'is_active', 'test_mode', 'created_at']
    search_fields = ['tenant__hotel_name', 'tenant__slug', 'merchant_id']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Tenant & Gateway', {
            'fields': ('tenant', 'gateway')
        }),
        ('Credentials', {
            'fields': ('merchant_id', 'secret_key', 'api_endpoint'),
            'description': 'Note: Secret key should be encrypted in production'
        }),
        ('Status', {
            'fields': ('is_active', 'test_mode')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at')
        }),
    )
