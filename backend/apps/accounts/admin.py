from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ("Hotel Role & Contact", {"fields": ("role", "phone_number", "email_verified", "is_platform_admin")}),
    )
    list_display = ("username", "email", "role", "phone_number", "is_staff", "is_platform_admin")
    list_filter = ("role", "is_staff", "is_active", "is_platform_admin")

