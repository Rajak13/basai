"""
Tenant-Scoped Analytics Service.

Provides revenue totals, occupancy rate calculations, booking source distributions,
and guest demographic aggregations strictly scoped to the active tenant database.

Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6
"""
import csv
import io
from datetime import datetime, date, timedelta
from decimal import Decimal
from typing import Dict, Any, List, Optional, Tuple

from django.utils import timezone
from django.db.models import Sum, Count, Q, Avg

from apps.rooms.models import Room, RoomCategory
from apps.reservations.models import Reservation
from apps.payments.models import PaymentTransaction, PaymentStatus
from apps.guests.models import GuestProfile
from apps.tenants.models import Tenant
from apps.tenants.regional_services import CurrencyService


class AnalyticsService:
    """
    Analytics service querying the tenant-isolated PostgreSQL database.
    """

    VALID_RESERVATION_STATUSES = [
        Reservation.Status.CONFIRMED,
        Reservation.Status.CHECKED_IN,
        Reservation.Status.CHECKED_OUT,
    ]

    @staticmethod
    def parse_date_range(
        start_str: Optional[str] = None,
        end_str: Optional[str] = None,
        preset: Optional[str] = None
    ) -> Tuple[date, date]:
        """
        Parse and validate start_date and end_date, supporting common presets.
        Defaults to the last 30 days.
        """
        today = timezone.localdate()

        if preset:
            preset = preset.lower()
            if preset == "today":
                return today, today
            elif preset == "this_week":
                start = today - timedelta(days=today.weekday())
                return start, today
            elif preset == "this_month":
                start = today.replace(day=1)
                return start, today
            elif preset == "last_30_days":
                return today - timedelta(days=29), today
            elif preset == "last_90_days":
                return today - timedelta(days=89), today
            elif preset == "this_year":
                start = today.replace(month=1, day=1)
                return start, today

        if start_str:
            try:
                start_date = datetime.strptime(start_str.strip(), "%Y-%m-%d").date()
            except ValueError:
                raise ValueError(f"Invalid start_date format '{start_str}'. Use YYYY-MM-DD.")
        else:
            start_date = today - timedelta(days=29)

        if end_str:
            try:
                end_date = datetime.strptime(end_str.strip(), "%Y-%m-%d").date()
            except ValueError:
                raise ValueError(f"Invalid end_date format '{end_str}'. Use YYYY-MM-DD.")
        else:
            end_date = today

        if start_date > end_date:
            raise ValueError(f"start_date ({start_date}) cannot be after end_date ({end_date}).")

        return start_date, end_date

    @classmethod
    def get_occupancy_rate(
        cls,
        tenant: Tenant,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Calculate occupancy rates based on tenant's room inventory and active reservations.
        Requirements: 19.2, 19.5
        """
        db = tenant.db_name
        total_rooms = Room.objects.using(db).filter(is_active=True).count()

        days_count = (end_date - start_date).days + 1
        total_room_nights_available = total_rooms * days_count

        # Fetch relevant reservations in the period
        reservations = Reservation.objects.using(db).filter(
            status__in=cls.VALID_RESERVATION_STATUSES,
            check_in_date__lte=end_date,
            check_out_date__gt=start_date,
        ).values('check_in_date', 'check_out_date')

        # Daily room night counts
        daily_breakdown: List[Dict[str, Any]] = []
        total_occupied_nights = 0

        current = start_date
        while current <= end_date:
            # Count reservations occupying this night
            occupied_count = sum(
                1 for r in reservations
                if r['check_in_date'] <= current < r['check_out_date']
            )
            # Cap at total_rooms for sanity
            if total_rooms > 0:
                occupied_count = min(occupied_count, total_rooms)
                daily_rate = round((occupied_count / total_rooms) * 100, 2)
            else:
                daily_rate = 0.0

            total_occupied_nights += occupied_count
            daily_breakdown.append({
                "date": current.isoformat(),
                "occupied_rooms": occupied_count,
                "total_rooms": total_rooms,
                "occupancy_rate": daily_rate,
            })
            current += timedelta(days=1)

        overall_rate = 0.0
        if total_room_nights_available > 0:
            overall_rate = round((total_occupied_nights / total_room_nights_available) * 100, 2)

        return {
            "tenant_slug": tenant.slug,
            "hotel_name": tenant.hotel_name,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days_count": days_count,
            "total_active_rooms": total_rooms,
            "total_room_nights_available": total_room_nights_available,
            "total_room_nights_occupied": total_occupied_nights,
            "overall_occupancy_rate": overall_rate,
            "daily_breakdown": daily_breakdown,
        }

    @classmethod
    def get_revenue_totals(
        cls,
        tenant: Tenant,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Calculate revenue totals, ADR, RevPAR, room category revenue,
        and payment gateway distributions in tenant's primary currency.
        Requirements: 19.3, 19.4, 19.5
        """
        db = tenant.db_name
        primary_currency = tenant.primary_currency or "NPR"

        # Filter reservations overlapping the period
        reservations_qs = Reservation.objects.using(db).filter(
            status__in=cls.VALID_RESERVATION_STATUSES,
            check_in_date__lte=end_date,
            check_out_date__gte=start_date,
        )

        agg = reservations_qs.aggregate(
            total_rev=Sum('total_price_npr'),
            total_bookings=Count('id')
        )
        total_revenue_npr = Decimal(str(agg['total_rev'] or 0))
        total_bookings = agg['total_bookings'] or 0

        # Convert to primary currency
        total_revenue_primary = CurrencyService.convert_currency(
            total_revenue_npr,
            from_currency='NPR',
            to_currency=primary_currency
        )

        # Occupancy metrics for ADR and RevPAR
        occupancy_info = cls.get_occupancy_rate(tenant, start_date, end_date)
        total_occupied_nights = occupancy_info['total_room_nights_occupied']
        total_available_nights = occupancy_info['total_room_nights_available']

        # ADR: Average Daily Rate = Total Room Revenue / Occupied Room Nights
        adr_npr = Decimal('0.00')
        if total_occupied_nights > 0:
            adr_npr = round(total_revenue_npr / Decimal(str(total_occupied_nights)), 2)
        adr_primary = CurrencyService.convert_currency(adr_npr, 'NPR', primary_currency)

        # RevPAR: Revenue Per Available Room = Total Room Revenue / Available Room Nights
        revpar_npr = Decimal('0.00')
        if total_available_nights > 0:
            revpar_npr = round(total_revenue_npr / Decimal(str(total_available_nights)), 2)
        revpar_primary = CurrencyService.convert_currency(revpar_npr, 'NPR', primary_currency)

        # Breakdown by Room Category
        categories = RoomCategory.objects.using(db).all()
        by_category: List[Dict[str, Any]] = []

        for cat in categories:
            cat_qs = reservations_qs.filter(category=cat)
            cat_agg = cat_qs.aggregate(rev=Sum('total_price_npr'), count=Count('id'))
            cat_rev_npr = Decimal(str(cat_agg['rev'] or 0))
            cat_count = cat_agg['count'] or 0

            cat_rev_primary = CurrencyService.convert_currency(cat_rev_npr, 'NPR', primary_currency)
            share_pct = 0.0
            if total_revenue_npr > 0:
                share_pct = round(float((cat_rev_npr / total_revenue_npr) * 100), 2)

            by_category.append({
                "category_id": cat.id,
                "category_name": cat.name,
                "category_slug": cat.slug,
                "bookings_count": cat_count,
                "revenue_npr": f"{cat_rev_npr:.2f}",
                "revenue_primary": f"{cat_rev_primary:.2f}",
                "share_percentage": share_pct,
            })

        # Breakdown by Payment Gateway (from successful PaymentTransactions in period or for period reservations)
        transactions_qs = PaymentTransaction.objects.using(db).filter(
            Q(status=PaymentStatus.SUCCESS) &
            (
                Q(created_at__date__gte=start_date, created_at__date__lte=end_date) |
                Q(reservation__in=reservations_qs)
            )
        )
        gateway_groups = transactions_qs.values('gateway').annotate(
            total_amount=Sum('amount_npr'),
            txn_count=Count('id')
        )

        by_gateway: List[Dict[str, Any]] = []
        for g in gateway_groups:
            g_npr = Decimal(str(g['total_amount'] or 0))
            g_primary = CurrencyService.convert_currency(g_npr, 'NPR', primary_currency)
            by_gateway.append({
                "gateway": g['gateway'],
                "transaction_count": g['txn_count'],
                "amount_npr": f"{g_npr:.2f}",
                "amount_primary": f"{g_primary:.2f}",
            })

        return {
            "tenant_slug": tenant.slug,
            "primary_currency": primary_currency,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_bookings": total_bookings,
            "total_revenue_npr": f"{total_revenue_npr:.2f}",
            "total_revenue_primary": f"{total_revenue_primary:.2f}",
            "adr_npr": f"{adr_npr:.2f}",
            "adr_primary": f"{adr_primary:.2f}",
            "revpar_npr": f"{revpar_npr:.2f}",
            "revpar_primary": f"{revpar_primary:.2f}",
            "by_category": by_category,
            "by_gateway": by_gateway,
        }

    @classmethod
    def get_bookings_by_source(
        cls,
        tenant: Tenant,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Aggregate booking source distribution (Online Web, Walk-In, Phone, WhatsApp).
        Requirements: 19.4, 19.5
        """
        db = tenant.db_name
        primary_currency = tenant.primary_currency or "NPR"

        reservations_qs = Reservation.objects.using(db).filter(
            status__in=cls.VALID_RESERVATION_STATUSES,
            check_in_date__lte=end_date,
            check_out_date__gte=start_date,
        )

        total_count = reservations_qs.count()
        total_rev_npr = Decimal(str(reservations_qs.aggregate(rev=Sum('total_price_npr'))['rev'] or 0))

        source_groups = reservations_qs.values('source').annotate(
            count=Count('id'),
            revenue=Sum('total_price_npr')
        ).order_by('-count')

        sources_data: List[Dict[str, Any]] = []
        source_labels = dict(Reservation.BookingSource.choices)

        for item in source_groups:
            src = item['source']
            src_count = item['count']
            src_rev_npr = Decimal(str(item['revenue'] or 0))
            src_rev_primary = CurrencyService.convert_currency(src_rev_npr, 'NPR', primary_currency)

            pct = 0.0
            if total_count > 0:
                pct = round((src_count / total_count) * 100, 2)

            sources_data.append({
                "source": src,
                "source_display": source_labels.get(src, src),
                "bookings_count": src_count,
                "percentage": pct,
                "revenue_npr": str(src_rev_npr),
                "revenue_primary": str(src_rev_primary),
            })

        return {
            "tenant_slug": tenant.slug,
            "primary_currency": primary_currency,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_bookings": total_count,
            "total_revenue_npr": str(total_rev_npr),
            "sources": sources_data,
        }

    @classmethod
    def get_guest_demographics(
        cls,
        tenant: Tenant,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Aggregate guest origin countries, repeat guest ratios, and party sizes.
        Requirements: 19.4, 19.5
        """
        db = tenant.db_name

        reservations_qs = Reservation.objects.using(db).filter(
            status__in=cls.VALID_RESERVATION_STATUSES,
            check_in_date__lte=end_date,
            check_out_date__gte=start_date,
        )

        total_reservations = reservations_qs.count()

        # Adults / children / group size
        adults_agg = reservations_qs.aggregate(
            total_adults=Sum('adults'),
            total_children=Sum('children'),
            avg_adults=Avg('adults'),
        )
        total_adults = adults_agg['total_adults'] or 0
        total_children = adults_agg['total_children'] or 0
        avg_party_size = 0.0
        if total_reservations > 0:
            avg_party_size = round((total_adults + total_children) / total_reservations, 2)

        # Unique vs Repeat Guests
        # Count frequency of guest contacts across entire tenant history
        guest_identifiers = reservations_qs.exclude(
            Q(guest_email="") & Q(guest_phone="")
        ).values_list('guest_email', 'guest_phone')

        unique_guests = set()
        for email, phone in guest_identifiers:
            key = (email.lower() if email else "") or phone
            if key:
                unique_guests.add(key)

        total_unique_guests = len(unique_guests)

        # Count repeat bookings
        repeat_guests_count = 0
        for ident in unique_guests:
            hist_count = Reservation.objects.using(db).filter(
                Q(guest_email__iexact=ident) | Q(guest_phone=ident),
                status__in=cls.VALID_RESERVATION_STATUSES
            ).count()
            if hist_count > 1:
                repeat_guests_count += 1

        repeat_rate = 0.0
        if total_unique_guests > 0:
            repeat_rate = round((repeat_guests_count / total_unique_guests) * 100, 2)

        # Country distribution from GuestProfile
        country_groups = GuestProfile.objects.using(db).values('country').annotate(
            count=Count('id')
        ).order_by('-count')

        total_profiles = GuestProfile.objects.using(db).count()
        by_country: List[Dict[str, Any]] = []

        for c in country_groups:
            c_name = c['country'] or "Unspecified"
            c_cnt = c['count']
            pct = 0.0
            if total_profiles > 0:
                pct = round((c_cnt / total_profiles) * 100, 2)
            by_country.append({
                "country": c_name,
                "count": c_cnt,
                "percentage": pct,
            })

        return {
            "tenant_slug": tenant.slug,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "total_reservations": total_reservations,
            "total_unique_guests": total_unique_guests,
            "repeat_guests_count": repeat_guests_count,
            "repeat_guest_rate": repeat_rate,
            "total_adults": total_adults,
            "total_children": total_children,
            "average_party_size": avg_party_size,
            "by_country": by_country,
        }

    @classmethod
    def get_dashboard_summary(
        cls,
        tenant: Tenant,
        start_date: date,
        end_date: date
    ) -> Dict[str, Any]:
        """
        Unified KPI summary for the tenant management console.
        """
        occupancy = cls.get_occupancy_rate(tenant, start_date, end_date)
        revenue = cls.get_revenue_totals(tenant, start_date, end_date)
        sources = cls.get_bookings_by_source(tenant, start_date, end_date)
        demographics = cls.get_guest_demographics(tenant, start_date, end_date)

        # Currently checked-in rooms
        today = timezone.localdate()
        current_in_house = Reservation.objects.using(tenant.db_name).filter(
            status=Reservation.Status.CHECKED_IN
        ).count()

        return {
            "tenant": {
                "slug": tenant.slug,
                "hotel_name": tenant.hotel_name,
                "primary_currency": tenant.primary_currency,
            },
            "period": {
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            "kpi": {
                "overall_occupancy_rate": occupancy['overall_occupancy_rate'],
                "total_active_rooms": occupancy['total_active_rooms'],
                "total_room_nights_occupied": occupancy['total_room_nights_occupied'],
                "in_house_guests_count": current_in_house,
                "total_revenue_npr": revenue['total_revenue_npr'],
                "total_revenue_primary": revenue['total_revenue_primary'],
                "adr_primary": revenue['adr_primary'],
                "revpar_primary": revenue['revpar_primary'],
                "total_bookings": revenue['total_bookings'],
                "repeat_guest_rate": demographics['repeat_guest_rate'],
            },
            "occupancy_breakdown": occupancy['daily_breakdown'],
            "revenue_by_category": revenue['by_category'],
            "revenue_by_gateway": revenue['by_gateway'],
            "bookings_by_source": sources['sources'],
            "guest_demographics": demographics,
        }

    @classmethod
    def export_csv(
        cls,
        tenant: Tenant,
        report_type: str,
        start_date: date,
        end_date: date
    ) -> str:
        """
        Generate CSV export scoped strictly to tenant data.
        Requirements: 19.6
        """
        output = io.StringIO()
        writer = csv.writer(output)
        report_type = (report_type or 'summary').lower()

        if report_type == 'occupancy':
            data = cls.get_occupancy_rate(tenant, start_date, end_date)
            writer.writerow(["Date", "Total Rooms", "Occupied Rooms", "Occupancy Rate (%)"])
            for row in data['daily_breakdown']:
                writer.writerow([
                    row['date'],
                    row['total_rooms'],
                    row['occupied_rooms'],
                    f"{row['occupancy_rate']}%",
                ])

        elif report_type == 'revenue':
            data = cls.get_revenue_totals(tenant, start_date, end_date)
            writer.writerow(["Room Category", "Bookings Count", "Revenue (NPR)", f"Revenue ({tenant.primary_currency})", "Share (%)"])
            for cat in data['by_category']:
                writer.writerow([
                    cat['category_name'],
                    cat['bookings_count'],
                    cat['revenue_npr'],
                    cat['revenue_primary'],
                    f"{cat['share_percentage']}%",
                ])

        elif report_type == 'source':
            data = cls.get_bookings_by_source(tenant, start_date, end_date)
            writer.writerow(["Booking Source", "Bookings Count", "Percentage (%)", "Revenue (NPR)", f"Revenue ({tenant.primary_currency})"])
            for s in data['sources']:
                writer.writerow([
                    s['source_display'],
                    s['bookings_count'],
                    f"{s['percentage']}%",
                    s['revenue_npr'],
                    s['revenue_primary'],
                ])

        else:  # 'summary' default
            summary = cls.get_dashboard_summary(tenant, start_date, end_date)
            kpi = summary['kpi']
            writer.writerow(["Metric", "Value"])
            writer.writerow(["Hotel Name", tenant.hotel_name])
            writer.writerow(["Period Start", start_date.isoformat()])
            writer.writerow(["Period End", end_date.isoformat()])
            writer.writerow(["Primary Currency", tenant.primary_currency])
            writer.writerow(["Total Active Rooms", kpi['total_active_rooms']])
            writer.writerow(["Occupancy Rate", f"{kpi['overall_occupancy_rate']}%"])
            writer.writerow(["Occupied Room Nights", kpi['total_room_nights_occupied']])
            writer.writerow(["Total Bookings", kpi['total_bookings']])
            writer.writerow([f"Total Revenue ({tenant.primary_currency})", kpi['total_revenue_primary']])
            writer.writerow([f"ADR ({tenant.primary_currency})", kpi['adr_primary']])
            writer.writerow([f"RevPAR ({tenant.primary_currency})", kpi['revpar_primary']])
            writer.writerow(["Repeat Guest Rate", f"{kpi['repeat_guest_rate']}%"])

        return output.getvalue()
