"""
Authentication views for cross-tenant user management.
Requirements: 3.3, 3.7
"""
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    CustomTokenObtainPairSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer
)

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    JWT login endpoint that returns access and refresh tokens with tenant membership claims.
    
    POST /api/auth/login
    Request:
        {
            "username": "john@example.com",
            "password": "password123"
        }
    Response:
        {
            "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
            "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
        }
    
    Requirements: 3.3
    """
    serializer_class = CustomTokenObtainPairSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """
    User registration endpoint.
    
    POST /api/auth/register
    Request:
        {
            "username": "john@example.com",
            "email": "john@example.com",
            "password": "password123",
            "password_confirm": "password123",
            "first_name": "John",
            "last_name": "Doe",
            "phone_number": "+977-9841234567"
        }
    Response:
        {
            "user": {
                "id": "uuid",
                "username": "john@example.com",
                "email": "john@example.com",
                ...
            },
            "tokens": {
                "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
                "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
            }
        }
    
    Requirements: 3.3
    """
    serializer = UserRegistrationSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        # Generate JWT tokens for the new user
        refresh = RefreshToken.for_user(user)
        
        # Add custom claims (same as CustomTokenObtainPairSerializer)
        refresh['username'] = user.username
        refresh['email'] = user.email
        refresh['is_platform_admin'] = user.is_platform_admin
        refresh['tenant_memberships'] = []  # New users have no tenant memberships initially
        
        return Response({
            'user': UserProfileSerializer(user).data,
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    Get current authenticated user profile with tenant affiliations.
    
    GET /api/auth/me
    Headers:
        Authorization: Bearer <access_token>
    Response:
        {
            "id": "uuid",
            "username": "john@example.com",
            "email": "john@example.com",
            "first_name": "John",
            "last_name": "Doe",
            "phone_number": "+977-9841234567",
            "is_platform_admin": false,
            "email_verified": false,
            "tenant_memberships": [
                {
                    "tenant_slug": "hotel-dharan",
                    "role": "OWNER"
                },
                {
                    "tenant_slug": "hotel-kathmandu",
                    "role": "MANAGER"
                }
            ],
            "date_joined": "2024-01-15T10:30:00Z"
        }
    
    Requirements: 3.7
    """
    serializer = UserProfileSerializer(request.user)
    return Response(serializer.data)
