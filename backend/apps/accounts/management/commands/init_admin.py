"""
Django Management Command: init_admin

Idempotently creates or updates the Platform Superadmin account.
Perfect for zero-touch cloud deployments (Render, Railway, Fly.io, Koyeb).

Usage:
    python manage.py init_admin

Environment Variables (Optional):
    DJANGO_SUPERUSER_EMAIL      (Default: admin@basai.com.np)
    DJANGO_SUPERUSER_PASSWORD   (Default: BasaiAdmin2026!)
    DJANGO_SUPERUSER_USERNAME   (Default: admin)
"""
import os
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.accounts.models import UserRole

User = get_user_model()


class Command(BaseCommand):
    help = "Creates or updates the platform superadmin account for deployment."

    def handle(self, *args, **options):
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", "admin@basai.com.np").strip().lower()
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD", "BasaiAdmin2026!").strip()
        username = os.getenv("DJANGO_SUPERUSER_USERNAME", "admin").strip()

        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                "email": email,
                "first_name": "Platform",
                "last_name": "Superadmin",
                "role": UserRole.SUPER_ADMIN,
                "is_platform_admin": True,
                "is_superuser": True,
                "is_staff": True,
                "email_verified": True,
            },
        )

        user.email = email
        user.set_password(password)
        user.is_superuser = True
        user.is_staff = True
        user.is_platform_admin = True
        user.role = UserRole.SUPER_ADMIN
        user.email_verified = True
        user.save()

        if created:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Successfully created Platform Superadmin: {email} (username: {username})"
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"✓ Successfully updated existing Platform Superadmin credentials for {username}."
                )
            )
