from django.conf import settings
from django.db import models


class Amenity(models.Model):
    name = models.CharField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, blank=True, help_text="Lucide icon name")
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = "Amenities"

    def __str__(self):
        return self.name


class RoomCategory(models.Model):
    VIEW_CHOICES = [
        ("CITY", "City View"),
        ("HILLS", "Dharan Hills / Mountain View"),
        ("GARDEN", "Garden View"),
        ("COURTYARD", "Courtyard View"),
    ]

    BED_CHOICES = [
        ("SINGLE", "Single Bed"),
        ("DOUBLE", "Double Bed"),
        ("QUEEN", "Queen Bed"),
        ("KING", "King Bed"),
        ("TWIN", "Twin Beds"),
    ]

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField()
    base_price_npr = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price in Nepalese Rupees")
    base_price_usd = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Price in USD")
    max_occupancy = models.PositiveIntegerField(default=2)
    bed_type = models.CharField(max_length=20, choices=BED_CHOICES, default="QUEEN")
    view_type = models.CharField(max_length=20, choices=VIEW_CHOICES, default="HILLS")
    room_size_sqft = models.PositiveIntegerField(default=250)
    amenities = models.ManyToManyField(Amenity, blank=True, related_name="categories")
    virtual_tour_url = models.URLField(blank=True, null=True)
    floor_plan_image = models.ImageField(upload_to="floor_plans/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Room Categories"

    def __str__(self):
        return self.name


class Room(models.Model):
    class CleanlinessStatus(models.TextChoices):
        CLEAN = "CLEAN", "Clean"
        DIRTY = "DIRTY", "Dirty"
        INSPECTION_REQUIRED = "INSPECTION_REQUIRED", "Inspection Required"
        OUT_OF_SERVICE = "OUT_OF_SERVICE", "Out of Service / OOO"

    room_number = models.CharField(max_length=10, unique=True)
    category = models.ForeignKey(RoomCategory, on_delete=models.PROTECT, related_name="rooms")
    floor = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=25,
        choices=CleanlinessStatus.choices,
        default=CleanlinessStatus.CLEAN,
    )
    assigned_cleaner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="assigned_rooms",
        limit_choices_to={"role": "HOUSEKEEPING"},
        db_constraint=False,
    )
    notes = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"Room {self.room_number} ({self.category.name})"


class MaintenanceTicket(models.Model):
    class Priority(models.TextChoices):
        LOW = "LOW", "Low"
        MEDIUM = "MEDIUM", "Medium"
        HIGH = "HIGH", "High"
        URGENT = "URGENT", "Urgent"

    class Status(models.TextChoices):
        OPEN = "OPEN", "Open"
        IN_PROGRESS = "IN_PROGRESS", "In Progress"
        RESOLVED = "RESOLVED", "Resolved"

    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="maintenance_tickets")
    reported_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        db_constraint=False,
    )
    title = models.CharField(max_length=200)
    description = models.TextField()
    priority = models.CharField(max_length=10, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.OPEN)
    photo = models.ImageField(upload_to="maintenance_photos/", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Ticket #{self.id}: {self.title} - Room {self.room.room_number}"
