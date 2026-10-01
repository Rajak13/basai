from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Reservation, AddonService, Folio
from .serializers import ReservationSerializer, AddonServiceSerializer, FolioSerializer


class ReservationViewSet(viewsets.ModelViewSet):
    queryset = Reservation.objects.all().select_related("category", "room", "guest").prefetch_related("addons")
    serializer_class = ReservationSerializer
    lookup_field = "booking_reference"

    def create(self, request, *args, **kwargs):
        tenant = getattr(request, 'tenant', None)
        if tenant:
            from apps.tenants.subscription_service import (
                SubscriptionService,
                QuotaExceededException,
                TenantSuspendedException,
            )
            try:
                SubscriptionService.check_resource_quota(tenant, 'bookings')
            except (QuotaExceededException, TenantSuspendedException) as exc:
                return Response(
                    {"error": str(exc), "code": "QUOTA_EXCEEDED"},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["post"], url_path="express-checkin")
    def express_checkin(self, request, booking_reference=None):
        reservation = self.get_object()
        arrival_time = request.data.get("estimated_arrival_time")
        special_requests = request.data.get("special_requests")
        
        if arrival_time:
            reservation.estimated_arrival_time = arrival_time
        if special_requests:
            reservation.special_requests = special_requests
        reservation.id_verified = True
        reservation.save()
        
        return Response({
            "message": "Express check-in details saved successfully",
            "reservation": ReservationSerializer(reservation).data
        })

    @action(detail=True, methods=["patch"], url_path="update-status")
    def update_reservation_status(self, request, booking_reference=None):
        reservation = self.get_object()
        new_status = request.data.get("status")
        if new_status not in Reservation.Status.values:
            return Response(
                {"error": f"Invalid status. Choose from {Reservation.Status.values}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        reservation.status = new_status
        reservation.save()
        return Response(ReservationSerializer(reservation).data)


class AddonServiceViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AddonService.objects.filter(is_active=True)
    serializer_class = AddonServiceSerializer


class FolioViewSet(viewsets.ModelViewSet):
    queryset = Folio.objects.all().select_related("reservation").prefetch_related("items")
    serializer_class = FolioSerializer
