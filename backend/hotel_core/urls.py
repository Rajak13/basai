"""
URL configuration for hotel_core project.
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.accounts.urls")),
    path("api/tenants/", include("apps.tenants.urls")),
    path("api/onboarding/", include("apps.tenants.onboarding_urls")),
    path("api/admin/onboarding/", include("apps.tenants.admin_urls")),
    path("api/rooms/", include("apps.rooms.urls")),
    path("api/reservations/", include("apps.reservations.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/analytics/", include("apps.analytics.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
