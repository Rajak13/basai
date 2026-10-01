from django.contrib import admin
from .models import GuestProfile


@admin.register(GuestProfile)
class GuestProfileAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "phone", "city", "country", "created_at")
    search_fields = ("full_name", "email", "phone", "city")
