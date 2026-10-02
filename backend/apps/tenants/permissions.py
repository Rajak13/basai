"""
Role-Based Access Control (RBAC) Permissions for Multi-Tenant Architecture.

Permissions enforce role segregation across platform administrators, hotel owners,
managers, front desk staff, and housekeeping teams.
"""
from rest_framework import permissions
from .models import Tenant, TenantMembership


def _get_tenant(request):
    """
    Resolve tenant from request.
    First checks request.tenant (set by TenantMiddleware).
    Falls back to X-Tenant-Slug header or tenant_slug query/body param.
    """
    tenant = getattr(request, 'tenant', None)
    if tenant:
        return tenant
    
    slug = (
        request.headers.get('X-Tenant-Slug')
        or request.query_params.get('tenant_slug')
        or (request.data.get('tenant_slug') if hasattr(request, 'data') and isinstance(request.data, dict) else None)
    )
    if slug:
        return Tenant.objects.filter(slug=slug).first()
    return None


def _get_user_membership(user, tenant):
    """Get active TenantMembership for user in given tenant."""
    if not user or not user.is_authenticated or not tenant:
        return None
    return TenantMembership.objects.filter(
        user=user,
        tenant=tenant,
        is_active=True
    ).first()


class IsPlatformAdmin(permissions.BasePermission):
    """
    Allows access only to global platform administrators.
    Used for tenant review, verification approval, and platform metrics.
    """
    def has_permission(self, request, view):
        return bool(
            request.user and
            request.user.is_authenticated and
            (getattr(request.user, 'is_platform_admin', False) or request.user.is_superuser)
        )


class IsTenantOwner(permissions.BasePermission):
    """
    Allows access only to Hotel Owners for the active tenant (or platform admins).
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_platform_admin', False) or request.user.is_superuser:
            return True
        tenant = _get_tenant(request)
        if not tenant:
            return False
        membership = _get_user_membership(request.user, tenant)
        return bool(membership and membership.role == TenantMembership.Role.OWNER)


class IsTenantManagerOrAbove(permissions.BasePermission):
    """
    Allows access to Hotel Owners and Managers for the active tenant.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_platform_admin', False) or request.user.is_superuser:
            return True
        tenant = _get_tenant(request)
        if not tenant:
            return False
        membership = _get_user_membership(request.user, tenant)
        return bool(
            membership and membership.role in [
                TenantMembership.Role.OWNER,
                TenantMembership.Role.MANAGER,
            ]
        )


class IsFrontDeskOrAbove(permissions.BasePermission):
    """
    Allows access to Front Desk, Managers, and Owners for the active tenant.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_platform_admin', False) or request.user.is_superuser:
            return True
        tenant = _get_tenant(request)
        if not tenant:
            return False
        membership = _get_user_membership(request.user, tenant)
        return bool(
            membership and membership.role in [
                TenantMembership.Role.OWNER,
                TenantMembership.Role.MANAGER,
                TenantMembership.Role.FRONT_DESK,
            ]
        )


class IsHousekeepingOrAbove(permissions.BasePermission):
    """
    Allows access to Housekeeping, Managers, and Owners for the active tenant.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if getattr(request.user, 'is_platform_admin', False) or request.user.is_superuser:
            return True
        tenant = _get_tenant(request)
        if not tenant:
            return False
        membership = _get_user_membership(request.user, tenant)
        return bool(
            membership and membership.role in [
                TenantMembership.Role.OWNER,
                TenantMembership.Role.MANAGER,
                TenantMembership.Role.HOUSEKEEPING,
            ]
        )
