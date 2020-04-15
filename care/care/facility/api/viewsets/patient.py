import datetime
import json
from json import JSONDecodeError

from django.contrib.postgres.search import TrigramSimilarity
from django.db.models.query_utils import Q
from django_filters import rest_framework as filters
from dry_rest_permissions.generics import DRYPermissionFiltersBase, DRYPermissions
from rest_framework import serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import ListModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from care.facility.api.serializers.patient import (
    FacilityPatientStatsHistorySerializer,
    PatientDetailSerializer,
    PatientListSerializer,
    PatientSearchSerializer,
    PatientTransferSerializer,
)
from care.facility.api.serializers.patient_icmr import PatientICMRSerializer
from care.facility.api.viewsets import UserAccessMixin
from care.facility.api.viewsets.mixins.history import HistoryMixin
from care.facility.models import Facility, FacilityPatientStatsHistory, PatientRegistration, PatientSearch
from care.facility.models.patient_base import DiseaseStatusEnum
from care.facility.models.patient_icmr import PatientIcmr
from care.users.models import User


class PatientFilterSet(filters.FilterSet):
    source = filters.ChoiceFilter(choices=PatientRegistration.SourceChoices)
    facility = filters.NumberFilter(field_name="facility_id")
    phone_number = filters.CharFilter(field_name="phone_number")


class PatientDRYFilter(DRYPermissionFiltersBase):
    def filter_queryset(self, request, queryset, view):
        if view.action == "list":
            queryset = self.filter_list_queryset(request, queryset, view)

        if not request.user.is_superuser:
            if request.user.user_type >= User.TYPE_VALUE_MAP["StateLabAdmin"]:
                queryset = queryset.filter(state=request.user.state)
            elif request.user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]:
                queryset = queryset.filter(district=request.user.district)
            elif view.action != "transfer":
                queryset = queryset.filter(
                    Q(created_by=request.user)
                    | Q(facility__created_by=request.user)
                    | Q(facility__users__id__exact=request.user.id)
                )
        return queryset

    def filter_list_queryset(self, request, queryset, view):
        try:
            show_without_facility = json.loads(request.query_params.get("without_facility"))
        except (
            JSONDecodeError,
            TypeError,
        ):
            show_without_facility = False
        return queryset.filter(facility_id__isnull=show_without_facility)


class PatientViewSet(HistoryMixin, viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, DRYPermissions)
    queryset = PatientRegistration.objects.all().select_related(
        "local_body",
        "district",
        "state",
        "facility",
        "facility__local_body",
        "facility__district",
        "facility__state",
        "nearest_facility",
        "nearest_facility__local_body",
        "nearest_facility__district",
        "nearest_facility__state",
    )
    serializer_class = PatientDetailSerializer
    filter_backends = (
        PatientDRYFilter,
        filters.DjangoFilterBackend,
    )
    filterset_class = PatientFilterSet

    def get_queryset(self):
        filter_query = self.request.query_params.get("disease_status")
        queryset = super().get_queryset()
        if filter_query:
            disease_status = filter_query if filter_query.isdigit() else DiseaseStatusEnum[filter_query].value
            return queryset.filter(disease_status=disease_status)

        return queryset

    def get_serializer_class(self):
        if self.action == "list":
            return PatientListSerializer
        elif self.action == "icmr_sample":
            return PatientICMRSerializer
        elif self.action == "transfer":
            return PatientTransferSerializer
        else:
            return self.serializer_class

    def list(self, request, *args, **kwargs):
        """
        Patient List

        `without_facility` accepts boolean - default is false -
            if true: shows only patients without a facility mapped
            if false (default behaviour): shows only patients with a facility mapped

        `disease_status` accepts - string and int -
            SUSPECTED = 1
            POSITIVE = 2
            NEGATIVE = 3
            RECOVERY = 4
            RECOVERED = 5
            EXPIRED = 6

        """
        return super(PatientViewSet, self).list(request, *args, **kwargs)

    @action(detail=True, methods=["GET"])
    def icmr_sample(self, *args, **kwargs):
        patient = self.get_object()
        patient.__class__ = PatientIcmr
        return Response(data=PatientICMRSerializer(patient).data)

    @action(detail=True, methods=["POST"])
    def transfer(self, request, *args, **kwargs):
        patient = self.get_object()
        serializer = self.get_serializer_class()(patient, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(status=status.HTTP_204_NO_CONTENT)


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


class PatientSearchViewSet(UserAccessMixin, ListModelMixin, GenericViewSet):
    http_method_names = ["get"]
    queryset = PatientSearch.objects.all()
    serializer_class = PatientSearchSerializer
    permission_classes = (IsAuthenticated, DRYPermissions)

    def get_queryset(self):
        if self.action != "list":
            return super(PatientSearchViewSet, self).get_queryset()
        else:
            serializer = PatientSearchSerializer(data=self.request.query_params, partial=True)
            serializer.is_valid(raise_exception=True)

            search_keys = ["date_of_birth", "year_of_birth", "phone_number", "name", "age"]
            search_fields = {
                key: serializer.validated_data[key] for key in search_keys if serializer.validated_data.get(key)
            }
            if not search_fields:
                raise serializers.ValidationError(
                    {"detail": [f"None of the search keys provided. Available: {', '.join(search_keys)}"]}
                )

            if not self.request.user.is_superuser:
                search_fields["state_id"] = self.request.user.state_id

            if "age" in search_fields:
                age = search_fields.pop("age")
                year_of_birth = datetime.datetime.now().year - age
                search_fields["age__gte"] = year_of_birth - 5
                search_fields["age__lte"] = year_of_birth + 5

            name = search_fields.pop("name", None)

            queryset = self.queryset.filter(**search_fields)

            if name:
                queryset = (
                    queryset.annotate(similarity=TrigramSimilarity("name", name))
                    .filter(similarity__gt=0.2)
                    .order_by("-similarity")
                )

            return queryset

    def retrieve(self, request, *args, **kwargs):
        raise NotImplementedError()

    def list(self, request, *args, **kwargs):
        """
        Patient Search

        ### Available filters -

        - year_of_birth: in YYYY format
        - date_of_birth: in YYYY-MM-DD format
        - phone_number: in E164 format: eg: +917795937091
        - name: free text search
        - age: number - searches age +/- 5 years

        **SPECIAL NOTE**: the values should be urlencoded

        `Eg: api/v1/patient/search/?year_of_birth=1992&phone_number=%2B917795937091`

        """
        return super(PatientSearchViewSet, self).list(request, *args, **kwargs)
