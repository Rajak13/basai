"""
URL configuration for tenant-scoped analytics API endpoints.
"""
from django.urls import path
from . import views

urlpatterns = [
    path('summary', views.DashboardSummaryAnalyticsView.as_view(), name='analytics-summary-noslash'),
    path('summary/', views.DashboardSummaryAnalyticsView.as_view(), name='analytics-summary'),
    path('occupancy', views.OccupancyAnalyticsView.as_view(), name='analytics-occupancy-noslash'),
    path('occupancy/', views.OccupancyAnalyticsView.as_view(), name='analytics-occupancy'),
    path('revenue', views.RevenueAnalyticsView.as_view(), name='analytics-revenue-noslash'),
    path('revenue/', views.RevenueAnalyticsView.as_view(), name='analytics-revenue'),
    path('bookings-by-source', views.BookingSourceAnalyticsView.as_view(), name='analytics-source-noslash'),
    path('bookings-by-source/', views.BookingSourceAnalyticsView.as_view(), name='analytics-source'),
    path('demographics', views.GuestDemographicsAnalyticsView.as_view(), name='analytics-demographics-noslash'),
    path('demographics/', views.GuestDemographicsAnalyticsView.as_view(), name='analytics-demographics'),
    path('export/csv', views.AnalyticsExportCSVView.as_view(), name='analytics-export-csv-noslash'),
    path('export/csv/', views.AnalyticsExportCSVView.as_view(), name='analytics-export-csv'),
]
