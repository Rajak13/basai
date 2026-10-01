from rest_framework import serializers
from .models import Reservation, AddonService, ReservationAddon, Folio, FolioItem


class AddonServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AddonService
        fields = ["id", "name", "description", "price_npr", "is_active"]


class ReservationAddonSerializer(serializers.ModelSerializer):
    addon_name = serializers.CharField(source="addon.name", read_only=True)

    class Meta:
        model = ReservationAddon
        fields = ["id", "addon", "addon_name", "quantity", "unit_price_npr"]


class FolioItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = FolioItem
        fields = ["id", "description", "amount_npr", "created_at"]


class FolioSerializer(serializers.ModelSerializer):
    items = FolioItemSerializer(many=True, read_only=True)
    balance_due_npr = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = Folio
        fields = [
            "id",
            "reservation",
            "room_charge_npr",
            "service_charge_npr",
            "vat_13_npr",
            "incidentals_npr",
            "total_amount_npr",
            "paid_amount_npr",
            "balance_due_npr",
            "is_settled",
            "pan_number",
            "items",
        ]


class ReservationSerializer(serializers.ModelSerializer):
    addons = ReservationAddonSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    room_number = serializers.CharField(source="room.room_number", read_only=True)

    class Meta:
        model = Reservation
        fields = [
            "id",
            "booking_reference",
            "central_guest_id",
            "guest",
            "guest_name",
            "guest_phone",
            "guest_email",
            "category",
            "category_name",
            "room",
            "room_number",
            "check_in_date",
            "check_out_date",
            "adults",
            "children",
            "status",
            "source",
            "special_requests",
            "estimated_arrival_time",
            "id_verified",
            "total_price_npr",
            "addons",
            "created_at",
        ]
        read_only_fields = ["booking_reference", "id_verified"]
