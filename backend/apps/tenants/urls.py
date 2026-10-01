"""
URL routes for tenant management, staff, and subscriptions.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'staff', views.StaffViewSet, basename='tenant-staff')

urlpatterns = [
    path('resolve', views.TenantResolveView.as_view(), name='tenant-resolve'),
    path('resolve/', views.TenantResolveView.as_view(), name='tenant-resolve-slash'),
    path('subscription/', views.SubscriptionView.as_view(), name='subscription-detail'),
    path('subscription/pay/', views.SubscriptionPaymentView.as_view(), name='subscription-payment'),
    path('', include(router.urls)),
]
