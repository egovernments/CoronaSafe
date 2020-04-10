from django.db import connection, transaction
from django_filters import rest_framework as filters
from dry_rest_permissions.generics import DRYPermissionFiltersBase, DRYPermissions
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from simple_history.utils import bulk_create_with_history

from care.facility.api.serializers.facility import (
    FacilityBasicInfoSerializer,
    FacilitySerializer,
    FacilityUpsertSerializer,
)
from care.facility.api.serializers.patient import PatientListSerializer
from care.facility.models import Facility, FacilityCapacity, PatientRegistration
from care.users.models import User
from config.utils import get_psql_search_tokens


class FacilityFilter(filters.FilterSet):
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    facility_type = filters.NumberFilter(field_name="facility_type")
    district = filters.NumberFilter(field_name="district__id")
    district_name = filters.CharFilter(field_name="district__name", lookup_expr="icontains")
    local_body = filters.NumberFilter(field_name="local_body__id")
    local_body_name = filters.CharFilter(field_name="local_body__name", lookup_expr="icontains")
    state = filters.NumberFilter(field_name="state__id")
    state_name = filters.CharFilter(field_name="state__name", lookup_expr="icontains")


class FacilityQSPermissions(DRYPermissionFiltersBase):
    def filter_queryset(self, request, queryset, view):
        search_text = request.query_params.get("search_text")
        if search_text:
            with connection.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id
                    FROM (
                      SELECT f.id,
                        to_tsvector('english', coalesce(f.name, ' '))
                        || to_tsvector('english', coalesce(d.name, ' '))
                        || to_tsvector('english', coalesce(s.name, ' '))
                        AS document
                      FROM facility_facility f
                        LEFT JOIN users_district d ON f.district_id = d.id
                        LEFT JOIN users_state s ON f.state_id = s.id
                    ) facility_search
                    WHERE facility_search.document @@ to_tsquery('english', %s)
                """,
                    (get_psql_search_tokens(search_text),),
                )
                queryset = queryset.filter(id__in=[r[0] for r in cursor.fetchall()])
        if request.user.is_superuser or request.query_params.get("all") == "true":
            return queryset
        elif request.user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]:
            return queryset.filter(district=request.user.district)
        else:
            return queryset.filter(created_by=request.user)


class FacilityViewSet(viewsets.ModelViewSet):
    """Viewset for facility CRUD operations."""

    queryset = Facility.objects.filter(is_active=True).select_related("local_body", "district", "state")
    permission_classes = (
        IsAuthenticated,
        DRYPermissions,
    )
    filter_backends = (
        FacilityQSPermissions,
        filters.DjangoFilterBackend,
    )
    filterset_class = FacilityFilter

    def get_serializer_class(self):
        if self.request.query_params.get("all") == "true":
            return FacilityBasicInfoSerializer
        else:
            return FacilitySerializer

    def list(self, request, *args, **kwargs):
        """
        Facility List

        Supported filters
        - `name` - supports for ilike match
        - `facility_type` - ID
        - `district` - ID
        - `district_name` - supports for ilike match
        - `local_body` - ID
        - `local_body_name` - supports for ilike match
        - `state_body` - ID
        - `state_body_name` - supports for ilike match

        Other query params
        - `all` - bool. Returns all facilities with a limited dataset, accessible to all users.
        - `search_text` - string. Searches across name, district name and state name.
        """
        return super(FacilityViewSet, self).list(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        """
        Facility Create

        - `local_govt_body` is a read_only field
        - `local_body` is the field for local_body/ panchayath / municipality / corporation
        - `district` current supports only Kerala, will be changing when the UI is ready to support any district
        """
        return super(FacilityViewSet, self).create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Facility Update

        - `local_govt_body` is a read_only field
        - `local_body` is the field for local_body / panchayath / municipality / corporation
        - `district` current supports only Kerala, will be changing when the UI is ready to support any district
        """
        return super(FacilityViewSet, self).update(request, *args, **kwargs)

    @action(methods=["POST"], detail=False)
    def bulk_upsert(self, request):
        """
        Upserts based on case insensitive name (after stripping off blank spaces) and district.
        Check serializer for more.

        Request:
        [
            {
                "name": "Name",
                "district": 1,
                "facility_type": 2,
                "address": "Address",
                "phone_number": "Phone",
                "capacity": [
                    {
                        "room_type": 0,
                        "total_capacity": "350",
                        "current_capacity": "350"
                    },
                    {
                        "room_type": 1,
                        "total_capacity": 0,
                        "current_capacity": 0
                    }
                ]
            }
        ]
        :param request:
        :return:
        """
        data = request.data
        if not isinstance(data, list):
            data = [data]

        serializer = FacilityUpsertSerializer(data=data, many=True)
        serializer.is_valid(raise_exception=True)

        district_id = request.data[0]["district"]
        facilities = (
            Facility.objects.filter(district_id=district_id)
            .select_related("local_body", "district", "state", "created_by__district", "created_by__state")
            .prefetch_related("facilitycapacity_set")
        )

        facility_map = {f.name.lower(): f for f in facilities}
        facilities_to_update = []
        facilities_to_create = []

        for f in serializer.validated_data:
            f["district_id"] = f.pop("district")
            if f["name"].lower() in facility_map:
                facilities_to_update.append(f)
            else:
                f["created_by_id"] = request.user.id
                facilities_to_create.append(f)

        with transaction.atomic():
            capacity_create_objs = []
            for f in facilities_to_create:
                capacity = f.pop("facilitycapacity_set")
                f_obj = Facility.objects.create(**f)
                for c in capacity:
                    capacity_create_objs.append(FacilityCapacity(facility=f_obj, **c))
            for f in facilities_to_update:
                capacity = f.pop("facilitycapacity_set")
                f_obj = facility_map.get(f["name"].lower())
                changed = False
                for k, v in f.items():
                    if getattr(f_obj, k) != v:
                        setattr(f_obj, k, v)
                        changed = True
                if changed:
                    f_obj.save()
                capacity_map = {c.room_type: c for c in f_obj.facilitycapacity_set.all()}
                for c in capacity:
                    changed = False
                    if c["room_type"] in capacity_map:
                        c_obj = capacity_map.get(c["room_type"])
                        for k, v in c.items():
                            if getattr(c_obj, k) != v:
                                setattr(c_obj, k, v)
                                changed = True
                        if changed:
                            c_obj.save()
                    else:
                        capacity_create_objs.append(FacilityCapacity(facility=f_obj, **c))

            bulk_create_with_history(capacity_create_objs, FacilityCapacity, batch_size=500)

        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(methods=["get"], detail=True)
    def patients(self, *args, **kwargs):
        queryset = PatientRegistration.objects.filter(facility_id=kwargs["pk"]).select_related(
            "local_body", "district", "state"
        )
        return self.get_paginated_response(PatientListSerializer(self.paginate_queryset(queryset), many=True).data)
