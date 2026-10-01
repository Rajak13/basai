"""
URL configuration for authentication endpoints.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('auth/register', views.register_user, name='register'),
    path('auth/login', views.CustomTokenObtainPairView.as_view(), name='login'),
    path('auth/refresh-token', TokenRefreshView.as_view(), name='refresh_token'),
    path('auth/me', views.get_current_user, name='current_user'),
]
