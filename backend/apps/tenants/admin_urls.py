"""
URL routes for Platform Admin Onboarding Approval & Document Verification.
"""
from django.urls import path
from . import admin_views

urlpatterns = [
    path('applications', admin_views.TenantApplicationListView.as_view(), name='admin-application-list'),
    path('applications/', admin_views.TenantApplicationListView.as_view(), name='admin-application-list-slash'),
    path('applications/<str:tenant_id>/', admin_views.TenantApplicationDetailView.as_view(), name='admin-application-detail'),
    path('applications/<str:tenant_id>/approve/', admin_views.TenantApplicationApproveView.as_view(), name='admin-application-approve'),
    path('applications/<str:tenant_id>/reject/', admin_views.TenantApplicationRejectView.as_view(), name='admin-application-reject'),
]

