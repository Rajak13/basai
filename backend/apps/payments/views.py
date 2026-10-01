import uuid
from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import PaymentTransaction, PaymentGateway, PaymentStatus
from .serializers import PaymentTransactionSerializer
from .gateway_router import PaymentGatewayRouter
from .adapters import EsewaAdapter, KhaltiAdapter, RazorpayAdapter, StripeAdapter
from apps.reservations.models import Reservation


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = PaymentTransaction.objects.all().select_related("reservation")
    serializer_class = PaymentTransactionSerializer

    @action(detail=False, methods=["post"], url_path="initiate")
    def initiate_payment(self, request):
        """
        Initiates payment via eSewa, Khalti, Razorpay, or Stripe using tenant-configured gateway.
        
        Requirements: 7.6, 7.7
        """
        reservation_id = request.data.get("reservation_id")
        booking_reference = request.data.get("booking_reference")
        gateway = request.data.get("gateway", "").upper()
        amount = request.data.get("amount") or request.data.get("amount_npr")

        reservation = None
        if reservation_id:
            reservation = Reservation.objects.filter(id=reservation_id).first()
        elif booking_reference:
            reservation = Reservation.objects.filter(booking_reference=booking_reference).first()

        if not reservation:
            return Response({"error": "Reservation not found"}, status=status.HTTP_404_NOT_FOUND)

        charge_amount = Decimal(str(amount)) if amount else reservation.total_price_npr
        currency = request.data.get("currency", "NPR")
        tx_uuid = f"TXN-{uuid.uuid4().hex[:12].upper()}"

        tenant = getattr(request, 'tenant', None)
        callback_url = request.build_absolute_uri(f"/api/payments/verify/{gateway.lower()}")

        # Try to resolve adapter via PaymentGatewayRouter if tenant is present
        initiation_data = {}
        if tenant:
            try:
                adapter = PaymentGatewayRouter.get_adapter(tenant, gateway)
                initiation_data = adapter.initiate_payment(
                    amount=charge_amount,
                    currency=currency,
                    callback_url=callback_url,
                    metadata={"transaction_uuid": tx_uuid, "booking_reference": reservation.booking_reference}
                )
            except ValueError as e:
                # Gateway not configured in central registry, fall back to basic transaction
                pass

        txn = PaymentTransaction.objects.create(
            reservation=reservation,
            gateway=gateway,
            amount_npr=charge_amount,
            status=PaymentStatus.INITIATED,
            transaction_uuid=tx_uuid,
            metadata={"initiated_from": "web", **initiation_data},
        )

        response_payload = {
            "message": f"Payment initiated with {gateway}",
            "transaction_uuid": tx_uuid,
            "gateway": gateway,
            "amount": str(txn.amount_npr),
            "booking_reference": reservation.booking_reference,
            **initiation_data,
        }

        return Response(response_payload, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post", "get"], url_path="verify/(?P<gateway>[^/.]+)")
    def verify_gateway(self, request, gateway=None):
        """
        Verification callback endpoint per gateway: /api/payments/verify/{gateway}
        
        Requirements: 7.6, 7.7
        """
        gateway_code = (gateway or "").upper()
        payload = request.data if request.method == "POST" else request.query_params.dict()
        tenant = getattr(request, 'tenant', None)

        adapter = None
        if tenant:
            try:
                adapter = PaymentGatewayRouter.get_adapter(tenant, gateway_code)
            except ValueError:
                pass

        if not adapter:
            # Fallback to direct adapter with test mode
            mapping = {
                'ESEWA': EsewaAdapter,
                'KHALTI': KhaltiAdapter,
                'RAZORPAY': RazorpayAdapter,
                'STRIPE': StripeAdapter,
            }
            AdapterClass = mapping.get(gateway_code, EsewaAdapter)
            adapter = AdapterClass(test_mode=True)

        verification = adapter.verify_callback(payload)
        tx_uuid = verification.get("transaction_id") or payload.get("transaction_uuid")

        txn = None
        if tx_uuid:
            txn = PaymentTransaction.objects.filter(transaction_uuid=tx_uuid).first()

        if verification.get("status") == "SUCCESS":
            if txn:
                txn.status = PaymentStatus.SUCCESS
                txn.gateway_reference_id = verification.get("gateway_ref")
                txn.save()

                txn.reservation.status = Reservation.Status.CONFIRMED
                txn.reservation.save()

            return Response({
                "status": "SUCCESS",
                "message": "Payment verified and booking confirmed",
                "transaction_uuid": tx_uuid,
                "verification": verification,
            }, status=status.HTTP_200_OK)
        else:
            if txn:
                txn.status = PaymentStatus.FAILED
                txn.save()
            return Response({
                "status": "FAILED",
                "message": "Payment verification failed",
                "transaction_uuid": tx_uuid,
                "verification": verification,
            }, status=status.HTTP_400_BAD_REQUEST)
