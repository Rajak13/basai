"""
API Views for Tenant-Scoped Analytics and Reporting.

Endpoints:
- GET /api/analytics/occupancy/
- GET /api/analytics/revenue/
- GET /api/analytics/bookings-by-source/
- GET /api/analytics/demographics/
- GET /api/analytics/summary/
- GET /api/analytics/export/csv/

All endpoints are strictly protected by RBAC (Hotel Owner / Manager / Platform Admin).
Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6
"""
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

from .services import AnalyticsService
from apps.tenants.permissions import IsTenantManagerOrAbove, _get_tenant


class BaseAnalyticsView(APIView):
    """Base class for analytics endpoints with RBAC and tenant resolution."""
    permission_classes = [permissions.IsAuthenticated, IsTenantManagerOrAbove]

    def get_tenant_and_dates(self, request):
        tenant = _get_tenant(request)
        if not tenant:
            return None, None, None, Response(
                {"error": "No active hotel tenant found for this request domain."},
                status=status.HTTP_400_BAD_REQUEST
            )

        start_str = request.query_params.get('start_date')
        end_str = request.query_params.get('end_date')
        preset = request.query_params.get('preset')

        try:
            start_date, end_date = AnalyticsService.parse_date_range(start_str, end_str, preset)
        except ValueError as e:
            return None, None, None, Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return tenant, start_date, end_date, None


class OccupancyAnalyticsView(BaseAnalyticsView):
    """
    Occupancy rates by date range with daily breakdown.
    Requirements: 19.1, 19.2, 19.5
    """
    def get(self, request):
        tenant, start_date, end_date, err_response = self.get_tenant_and_dates(request)
        if err_response:
            return err_response

        data = AnalyticsService.get_occupancy_rate(tenant, start_date, end_date)
        return Response(data, status=status.HTTP_200_OK)


class RevenueAnalyticsView(BaseAnalyticsView):
    """
    Revenue metrics, ADR, RevPAR, and room category / payment gateway distributions.
    Requirements: 19.1, 19.3, 19.5
    """
    def get(self, request):
        tenant, start_date, end_date, err_response = self.get_tenant_and_dates(request)
        if err_response:
            return err_response

        data = AnalyticsService.get_revenue_totals(tenant, start_date, end_date)
        return Response(data, status=status.HTTP_200_OK)


class BookingSourceAnalyticsView(BaseAnalyticsView):
    """
    Distribution of bookings across channels (Website, Walk-In, Phone, WhatsApp).
    Requirements: 19.1, 19.4, 19.5
    """
    def get(self, request):
        tenant, start_date, end_date, err_response = self.get_tenant_and_dates(request)
        if err_response:
            return err_response

        data = AnalyticsService.get_bookings_by_source(tenant, start_date, end_date)
        return Response(data, status=status.HTTP_200_OK)


class GuestDemographicsAnalyticsView(BaseAnalyticsView):
    """
    Guest demographics, repeat guest rate, and party size metrics.
    Requirements: 19.1, 19.4, 19.5
    """
    def get(self, request):
        tenant, start_date, end_date, err_response = self.get_tenant_and_dates(request)
        if err_response:
            return err_response

        data = AnalyticsService.get_guest_demographics(tenant, start_date, end_date)
        return Response(data, status=status.HTTP_200_OK)


class DashboardSummaryAnalyticsView(BaseAnalyticsView):
    """
    Unified KPI summary for the hotel management dashboard.
    Requirements: 19.1, 19.2, 19.3
    """
    def get(self, request):
        tenant, start_date, end_date, err_response = self.get_tenant_and_dates(request)
        if err_response:
            return err_response

        data = AnalyticsService.get_dashboard_summary(tenant, start_date, end_date)
        return Response(data, status=status.HTTP_200_OK)


class AnalyticsExportCSVView(BaseAnalyticsView):
    """
    Export analytics reports in CSV format.
    Query param `type`: 'summary' (default), 'occupancy', 'revenue', 'source'.
    Requirements: 19.6
    """
    def get(self, request):
        tenant, start_date, end_date, err_response = self.get_tenant_and_dates(request)
        if err_response:
            return err_response

        report_type = request.query_params.get('type', 'summary')
        csv_content = AnalyticsService.export_csv(tenant, report_type, start_date, end_date)

        filename = f"{tenant.slug}_{report_type}_{start_date}_{end_date}.csv"
        response = HttpResponse(csv_content, content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
