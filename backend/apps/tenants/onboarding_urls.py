"""
URL configuration for onboarding API endpoints.
"""
from django.urls import path
from . import onboarding_views

urlpatterns = [
    path('check-slug', onboarding_views.CheckSlugView.as_view(), name='onboarding-check-slug'),
    path('create-tenant', onboarding_views.CreateTenantOnboardingView.as_view(), name='onboarding-create-tenant'),
    path('verify-email', onboarding_views.VerifyEmailView.as_view(), name='onboarding-verify-email'),
    path('configure-tax', onboarding_views.ConfigureTaxView.as_view(), name='onboarding-configure-tax'),
    path('configure-payment', onboarding_views.ConfigurePaymentView.as_view(), name='onboarding-configure-payment'),
    path('create-rooms', onboarding_views.CreateRoomsView.as_view(), name='onboarding-create-rooms'),
    path('complete', onboarding_views.CompleteOnboardingView.as_view(), name='onboarding-complete'),
]
