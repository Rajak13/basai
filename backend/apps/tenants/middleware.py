"""
Tenant Resolution Middleware for Multi-Tenant SaaS Platform

This middleware resolves the active tenant from the request hostname (subdomain or custom domain)
and sets the database routing context for tenant-scoped queries.

Requirements: 2.1, 2.2, 2.3, 15.2, 15.3
"""
from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponseNotFound, HttpResponse, HttpResponseRedirect
from django.conf import settings
from .models import Tenant
from .db_router import set_tenant_schema, clear_tenant_schema


class TenantMiddleware(MiddlewareMixin):
    """
    Resolves tenant from request and sets database routing context.
    Must be placed early in MIDDLEWARE list after CommonMiddleware.
    
    Behavior:
    - Checks custom domain first (CNAME routing)
    - Falls back to subdomain extraction (subdomain.platform.com)
    - Returns 404 if tenant not found (except for platform domains)
    - Returns 402 if tenant is suspended (payment failed)
    - Returns 403 if tenant is cancelled or archived
    - Sets request.tenant attribute for downstream use
    - Sets database routing context via set_tenant_schema()
    """
    
    # Platform domains that don't require tenant resolution
    PLATFORM_DOMAINS = [
        'localhost',
        '127.0.0.1',
        'testserver',
        'nantio.com',
        'www.nantio.com',
        'platform.nantio.com',
    ]
    
    def process_request(self, request):
        """
        Extract hostname, resolve tenant, and set database context.
        Called for every incoming request before view execution.
        """
        # Extract hostname without port
        hostname = request.get_host().split(':')[0].lower()
        
        # Check if this is a platform/admin domain (no tenant required)
        if self._is_platform_domain(hostname):
            request.tenant = None
            clear_tenant_schema()
            return None
        
        # Attempt to resolve tenant
        tenant = self._resolve_tenant(hostname)
        
        if not tenant:
            # No tenant found - return 404
            return HttpResponseNotFound(
                "<h1>Hotel Not Found</h1>"
                "<p>The hotel you're looking for doesn't exist or is no longer available.</p>"
                "<p>Please check the URL and try again.</p>"
            )
        
        # Check tenant subscription status
        status_response = self._check_tenant_status(tenant)
        if status_response:
            return status_response
        
        # Set tenant context for this request
        request.tenant = tenant
        set_tenant_schema(tenant.db_name)
        
        return None
    
    def process_response(self, request, response):
        """
        Clear tenant context after request processing.
        This prevents context leakage between requests in the same thread.
        """
        clear_tenant_schema()
        return response
    
    def process_exception(self, request, exception):
        """
        Clear tenant context if an exception occurs.
        Ensures clean state for next request.
        """
        clear_tenant_schema()
        return None
    
    def _is_platform_domain(self, hostname):
        """
        Check if hostname is a platform domain (no tenant resolution needed).
        
        Args:
            hostname: The request hostname (lowercase, without port)
            
        Returns:
            bool: True if this is a platform domain
        """
        # Exact match check
        if hostname in self.PLATFORM_DOMAINS:
            return True
        
        # Check if it starts with www. (platform homepage)
        if hostname.startswith('www.'):
            return True
        
        return False
    
    def _resolve_tenant(self, hostname):
        """
        Resolve tenant from hostname using custom domain or subdomain.
        
        Resolution order:
        1. Check for custom domain match (e.g., hoteldharan.com)
        2. Extract subdomain and match slug (e.g., hotel-dharan.platform.com)
        
        Args:
            hostname: The request hostname (lowercase, without port)
            
        Returns:
            Tenant instance or None if not found
        """
        # First, try custom domain lookup (CNAME routing)
        # Requirement 2.2: Support CNAME-based routing for custom domains
        tenant = Tenant.objects.filter(
            custom_domain=hostname
        ).first()
        
        if tenant:
            return tenant
        
        # Second, try subdomain extraction
        # Requirement 2.1: Identify tenant using subdomain-based routing
        parts = hostname.split('.')
        
        # Need at least 3 parts for subdomain.domain.tld
        if len(parts) >= 3:
            subdomain = parts[0]
            
            # Look up tenant by slug
            # Return tenant regardless of status - status checking happens later
            tenant = Tenant.objects.filter(slug=subdomain).first()
            
            return tenant
        
        # Could not resolve tenant
        return None
    
    def _check_tenant_status(self, tenant):
        """
        Check tenant subscription status and return appropriate error response.
        
        Args:
            tenant: The resolved Tenant instance
            
        Returns:
            HttpResponse with error message, or None if tenant is accessible
        """
        # Handle pending admin approval
        if tenant.status == Tenant.Status.PENDING_APPROVAL:
            return HttpResponse(
                "<h1>Hotel Application Under Review</h1>"
                "<p>This hotel's registration is currently being verified by Nantio platform administrators.</p>"
                "<p>Public booking and management access will be enabled once documents are approved.</p>",
                status=403
            )

        # Handle rejected application
        if tenant.status == Tenant.Status.REJECTED:
            return HttpResponse(
                "<h1>Hotel Registration Not Approved</h1>"
                "<p>This property's registration was not approved. Please contact platform support.</p>",
                status=403
            )

        # Requirement 15.3: Handle cancelled subscription status
        if tenant.status == Tenant.Status.CANCELLED:
            return HttpResponse(
                "<h1>Subscription Cancelled</h1>"
                "<p>This hotel's subscription has been cancelled.</p>"
                "<p>Please contact support if you believe this is an error.</p>",
                status=403
            )
        
        # Requirement 15.3: Handle archived tenant status
        if tenant.status == Tenant.Status.ARCHIVED:
            return HttpResponse(
                "<h1>Hotel No Longer Available</h1>"
                "<p>This hotel's account has been archived and is no longer accessible.</p>",
                status=410  # Gone
            )
        
        # Requirement 15.2: Require subscription activation after trial expiration
        # Requirement 4.7: Suspend tenant when subscription payment fails
        if tenant.status == Tenant.Status.SUSPENDED:
            return HttpResponse(
                "<h1>Subscription Suspended</h1>"
                "<p>This hotel's subscription has been suspended due to payment issues.</p>"
                "<p>Please contact the hotel owner or support for assistance.</p>",
                status=402  # Payment Required
            )
        
        # Tenant is accessible (TRIAL or ACTIVE status)
        return None
