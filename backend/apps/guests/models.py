import uuid
from django.db import models


class GuestProfile(models.Model):
    """
    Guest profile information - tenant-specific data.
    Lives in tenant databases.
    References central user via central_user_id to maintain isolation.
    
    Requirements: 3.7, 9.6
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    central_user_id = models.UUIDField(null=True, blank=True, db_index=True)
    
    # Isolated contact fields stored locally in tenant database
    full_name = models.CharField(max_length=150, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=30, blank=True)
    
    citizenship_or_passport = models.CharField(max_length=50, blank=True, null=True)
    id_document_image = models.FileField(upload_to="guest_ids/", blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, default="Dharan")
    country = models.CharField(max_length=100, default="Nepal")
    emergency_contact = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "guest_profiles"
        verbose_name = "Guest Profile"
        verbose_name_plural = "Guest Profiles"

    def __str__(self):
        name = self.full_name or self.email or str(self.id)
        return f"Profile: {name}"
