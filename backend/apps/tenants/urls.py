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
    path('staff/invite/', views.InviteStaffView.as_view(), name='staff-invite'),
    path('staff/invite', views.InviteStaffView.as_view(), name='staff-invite-noslash'),
    path('staff/invitations/', views.ListStaffInvitationsView.as_view(), name='staff-invitations'),
    path('staff/invitations', views.ListStaffInvitationsView.as_view(), name='staff-invitations-noslash'),
    path('staff/accept-invite/', views.AcceptStaffInvitationView.as_view(), name='staff-accept-invite'),
    path('staff/accept-invite', views.AcceptStaffInvitationView.as_view(), name='staff-accept-invite-noslash'),
    path('', include(router.urls)),
]
