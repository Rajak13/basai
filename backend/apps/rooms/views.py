from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RoomCategory, Room, MaintenanceTicket, Amenity
from .serializers import (
    RoomCategorySerializer,
    RoomSerializer,
    MaintenanceTicketSerializer,
    AmenitySerializer,
)


class RoomCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = RoomCategory.objects.all().prefetch_related("amenities")
    serializer_class = RoomCategorySerializer
    lookup_field = "slug"


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().select_related("category")
    serializer_class = RoomSerializer

    def create(self, request, *args, **kwargs):
        tenant = getattr(request, 'tenant', None)
        if tenant:
            from apps.tenants.subscription_service import (
                SubscriptionService,
                QuotaExceededException,
                TenantSuspendedException,
            )
            try:
                SubscriptionService.check_resource_quota(tenant, 'rooms')
            except (QuotaExceededException, TenantSuspendedException) as exc:
                return Response(
                    {"error": str(exc), "code": "QUOTA_EXCEEDED"},
                    status=status.HTTP_403_FORBIDDEN
                )
        return super().create(request, *args, **kwargs)

    @action(detail=True, methods=["patch"], url_path="update-status")
    def update_cleanliness_status(self, request, pk=None):
        room = self.get_object()
        new_status = request.data.get("status")
        if new_status not in Room.CleanlinessStatus.values:
            return Response(
                {"error": f"Invalid status. Choose from {Room.CleanlinessStatus.values}"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        room.status = new_status
        room.save()
        return Response(RoomSerializer(room).data)


class MaintenanceTicketViewSet(viewsets.ModelViewSet):
    queryset = MaintenanceTicket.objects.all().select_related("room")
    serializer_class = MaintenanceTicketSerializer


class AmenityViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Amenity.objects.all()
    serializer_class = AmenitySerializer
