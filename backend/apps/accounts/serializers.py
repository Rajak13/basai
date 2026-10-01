"""
Authentication serializers with cross-tenant JWT token generation.
Requirements: 3.1, 3.3, 3.4, 3.7
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from apps.tenants.models import TenantMembership

User = get_user_model()


class TenantMembershipSerializer(serializers.ModelSerializer):
    """Serializer for tenant membership details in JWT claims"""
    tenant_slug = serializers.CharField(source='tenant.slug', read_only=True)
    role = serializers.CharField(read_only=True)
    
    class Meta:
        model = TenantMembership
        fields = ['tenant_slug', 'role']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT token serializer that includes tenant membership claims.
    
    Token structure:
    {
        "user_id": "uuid",
        "username": "john@example.com",
        "is_platform_admin": false,
        "tenant_memberships": [
            {"tenant_slug": "hotel-dharan", "role": "OWNER"},
            {"tenant_slug": "hotel-kathmandu", "role": "MANAGER"}
        ],
        "exp": 1234567890
    }
    """
    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_platform_admin'] = user.is_platform_admin
        
        # Add tenant memberships
        memberships = TenantMembership.objects.filter(
            user=user,
            is_active=True
        ).select_related('tenant')
        
        tenant_memberships = [
            {
                'tenant_slug': membership.tenant.slug,
                'role': membership.role
            }
            for membership in memberships
        ]
        
        token['tenant_memberships'] = tenant_memberships
        
        return token


class UserRegistrationSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone_number']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
            'phone_number': {'required': False},
        }
    
    def validate_email(self, value):
        """Ensure email is unique"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value
    
    def validate_username(self, value):
        """Ensure username is unique"""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value
    
    def validate(self, data):
        """Ensure passwords match"""
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data
    
    def create(self, validated_data):
        """Create new user with hashed password"""
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        user = User.objects.create(**validated_data)
        user.set_password(password)
        user.save()
        
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with tenant affiliations"""
    tenant_memberships = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'is_platform_admin', 'email_verified',
            'tenant_memberships', 'date_joined'
        ]
        read_only_fields = ['id', 'is_platform_admin', 'email_verified', 'date_joined']
    
    def get_tenant_memberships(self, obj):
        """Get all active tenant memberships for the user"""
        memberships = TenantMembership.objects.filter(
            user=obj,
            is_active=True
        ).select_related('tenant')
        
        return TenantMembershipSerializer(memberships, many=True).data
