from django.contrib.auth.models import AbstractUser
from django.db import models


class UserRole(models.TextChoices):
    SUPER_ADMIN = "SUPER_ADMIN", "Super Admin / General Manager"
    FRONT_DESK = "FRONT_DESK", "Front Desk / Receptionist"
    HOUSEKEEPING = "HOUSEKEEPING", "Housekeeping / Maintenance Staff"
    GUEST = "GUEST", "Customer / Guest"


class User(AbstractUser):
    """
    Central user account - lives in the central database.
    Users can have memberships across multiple tenants.
    """
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.GUEST,
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    email_verified = models.BooleanField(default=False)
    is_platform_admin = models.BooleanField(
        default=False,
        help_text="Platform admin with access to all tenants"
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
