from django_filters import rest_framework as filters
from rest_framework import viewsets
from rest_framework.generics import get_object_or_404
from rest_framework.permissions import IsAuthenticated

from care.facility.api.mixins import UserAccessMixin
from care.facility.api.serializers.patient import (
    FacilityPatientStatsHistorySerializer,
    PatientDetailSerializer,
    PatientSerializer,
)
from care.facility.models import (
    Facility,
    FacilityPatientStatsHistory,
    PatientRegistration,
)


class PatientFilterSet(filters.FilterSet):
    phone_number = filters.CharFilter(field_name="phone_number")


class PatientViewSet(UserAccessMixin, viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = PatientRegistration.objects.filter(deleted=False)
    serializer_class = PatientSerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = PatientFilterSet

    def get_serializer_class(self):
        if self.action == "retrieve":
            return PatientDetailSerializer
        else:
            return self.serializer_class


class FacilityPatientStatsHistoryFilterSet(filters.FilterSet):
    entry_date = filters.DateFromToRangeFilter(field_name="entry_date")


class FacilityPatientStatsHistoryViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated,)
    queryset = FacilityPatientStatsHistory.objects.all().order_by("-entry_date")
    serializer_class = FacilityPatientStatsHistorySerializer
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = FacilityPatientStatsHistoryFilterSet
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        queryset = super().get_queryset()
        return queryset.filter(facility_id=self.kwargs.get("facility_pk"))

    def get_object(self):
        return get_object_or_404(self.get_queryset(), id=self.kwargs.get("pk"))

    def get_facility(self):
        facility_qs = Facility.objects.filter(pk=self.kwargs.get("facility_pk"))
        if not self.request.user.is_superuser:
            facility_qs.filter(created_by=self.request.user)
        return get_object_or_404(facility_qs)

    def perform_create(self, serializer):
        return serializer.save(facility=self.get_facility())

    def list(self, request, *args, **kwargs):
        """
        Patient Stats - List

        Available Filters
        - entry_date_before: date in YYYY-MM-DD format, inclusive of this date
        - entry_date_before: date in YYYY-MM-DD format, inclusive of this date

        """
        return super(FacilityPatientStatsHistoryViewSet, self).list(request, *args, **kwargs)
