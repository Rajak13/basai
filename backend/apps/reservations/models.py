import uuid
from django.conf import settings
from django.db import models
from apps.rooms.models import Room, RoomCategory


class AddonService(models.Model):
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True)
    price_npr = models.DecimalField(max_digits=10, decimal_places=2)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} (NPR {self.price_npr})"


def get_tenant_prefix():
    """
    Derive a 3-4 character uppercase prefix for booking references
    based on the active thread-local tenant schema or slug.
    Defaults to 'HTL' if no tenant context is set.
    """
    from apps.tenants.db_router import get_tenant_schema
    schema = get_tenant_schema()
    if schema:
        from apps.tenants.models import Tenant
        tenant = Tenant.objects.using('default').filter(models.Q(db_name=schema) | models.Q(slug=schema)).first()
        if tenant:
            slug = tenant.slug.lower()
            if "dharan" in slug:
                return "DHR"
            if "pokhara" in slug:
                return "POK"
            if "kathmandu" in slug:
                return "KTM"
            parts = [p for p in tenant.slug.split('-') if p.lower() not in ('hotel', 'resort', 'inn', 'the', 'lodge')]
            base = parts[0] if parts else tenant.slug.replace('-', '')
            return base[:3].upper()
        if 'tenant_' in schema:
            name_part = schema.replace('tenant_', '')
            return name_part[:3].upper()
    return "HTL"


class Reservation(models.Model):
    class Status(models.TextChoices):
        PENDING = "PENDING", "Pending Payment / Confirmation"
        CONFIRMED = "CONFIRMED", "Confirmed"
        CHECKED_IN = "CHECKED_IN", "Checked In"
        CHECKED_OUT = "CHECKED_OUT", "Checked Out"
        CANCELLED = "CANCELLED", "Cancelled"

    class BookingSource(models.TextChoices):
        ONLINE_WEB = "ONLINE_WEB", "Online Website"
        WALK_IN = "WALK_IN", "Walk-In"
        PHONE = "PHONE", "Phone Call"
        WHATSAPP = "WHATSAPP", "WhatsApp"

    booking_reference = models.CharField(max_length=30, unique=True, editable=False)
    central_guest_id = models.UUIDField(null=True, blank=True, db_index=True)
    guest = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        db_constraint=False,
        related_name="reservations"
    )
    guest_name = models.CharField(max_length=150)
    guest_phone = models.CharField(max_length=30)
    guest_email = models.EmailField(blank=True)
    
    category = models.ForeignKey(RoomCategory, on_delete=models.PROTECT, related_name="reservations")
    room = models.ForeignKey(Room, on_delete=models.SET_NULL, null=True, blank=True, related_name="reservations")
    
    check_in_date = models.DateField()
    check_out_date = models.DateField()
    adults = models.PositiveIntegerField(default=1)
    children = models.PositiveIntegerField(default=0)
    
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    source = models.CharField(max_length=20, choices=BookingSource.choices, default=BookingSource.ONLINE_WEB)
    
    special_requests = models.TextField(blank=True)
    estimated_arrival_time = models.TimeField(blank=True, null=True)
    id_verified = models.BooleanField(default=False)
    
    total_price_npr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.booking_reference:
            prefix = get_tenant_prefix()
            using_db = kwargs.get('using', None)
            while True:
                candidate = f"{prefix}-{uuid.uuid4().hex[:8].upper()}"
                qs = Reservation.objects
                if using_db:
                    qs = qs.using(using_db)
                if not qs.filter(booking_reference=candidate).exists():
                    self.booking_reference = candidate
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.booking_reference} - {self.guest_name} ({self.status})"


class ReservationAddon(models.Model):
    reservation = models.ForeignKey(Reservation, on_delete=models.CASCADE, related_name="addons")
    addon = models.ForeignKey(AddonService, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField(default=1)
    unit_price_npr = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.addon.name} x {self.quantity} for {self.reservation.booking_reference}"


class Folio(models.Model):
    reservation = models.OneToOneField(Reservation, on_delete=models.CASCADE, related_name="folio")
    room_charge_npr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    service_charge_npr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    vat_13_npr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    incidentals_npr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount_npr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    paid_amount_npr = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_settled = models.BooleanField(default=False)
    pan_number = models.CharField(max_length=50, blank=True, null=True, help_text="Official Nepal PAN for billing")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def balance_due_npr(self):
        return self.total_amount_npr - self.paid_amount_npr

    def __str__(self):
        return f"Folio for {self.reservation.booking_reference} - Balance: NPR {self.balance_due_npr}"


class FolioItem(models.Model):
    folio = models.ForeignKey(Folio, on_delete=models.CASCADE, related_name="items")
    description = models.CharField(max_length=200)
    amount_npr = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.description}: NPR {self.amount_npr}"
