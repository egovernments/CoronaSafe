from dry_rest_permissions.generics import DRYPermissions
from rest_framework.decorators import action
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import ListModelMixin
from rest_framework.permissions import IsAuthenticated

from care.facility.api.serializers.facility_capacity import (
    FacilityCapacityHistorySerializer,
    FacilityCapacitySerializer,
)
from care.facility.api.viewsets import FacilityBaseViewset
from care.facility.models import Facility, FacilityCapacity
from care.users.models import User


class FacilityCapacityViewSet(FacilityBaseViewset, ListModelMixin):
    serializer_class = FacilityCapacitySerializer
    queryset = FacilityCapacity.objects.filter(deleted=False)
    permission_classes = (
        IsAuthenticated,
        DRYPermissions,
    )

    def get_queryset(self):
        user = self.request.user
        queryset = self.queryset.filter(facility__id=self.kwargs.get("facility_pk"))
        if user.is_superuser:
            return queryset
        elif self.request.user.user_type >= User.TYPE_VALUES.choices.DistrictAdmin.value:
            return queryset.filter(facility__district=user.district)
        return queryset.filter(facility__created_by=user)

    def get_object(self):
        return get_object_or_404(self.get_queryset(), room_type=self.kwargs.get("pk"))

    def get_facility(self):
        facility_qs = Facility.objects.filter(pk=self.kwargs.get("facility_pk"))
        if not self.request.user.is_superuser:
            facility_qs.filter(created_by=self.request.user)
        return get_object_or_404(facility_qs)

    def perform_create(self, serializer):
        serializer.save(facility=self.get_facility())

    @action(detail=True, methods=["get"])
    def history(self, request, *args, **kwargs):
        obj = self.get_object()
        page = self.paginate_queryset(obj.history.all())
        model = obj.history.__dict__["model"]
        serializer = FacilityCapacityHistorySerializer(model, page, many=True)
        serializer.is_valid()
        return self.get_paginated_response(serializer.data)

    def create(self, request, *args, **kwargs):
        """
        Facility Capacity Create

        /facility/{facility_pk}/capacity/{pk}
        `pk` in the API refers to the room_type.
        """
        return super(FacilityCapacityViewSet, self).create(request, *args, **kwargs)

    def list(self, request, *args, **kwargs):
        """
        Facility Capacity List

        /facility/{facility_pk}/capacity/{pk}
        `pk` in the API refers to the room_type.
        """
        return super(FacilityCapacityViewSet, self).list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        """
        Facility Capacity Retrieve

        /facility/{facility_pk}/capacity/{pk}
        `pk` in the API refers to the room_type.
        """
        return super(FacilityCapacityViewSet, self).retrieve(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """
        Facility Capacity Updates

        /facility/{facility_pk}/capacity/{pk}
        `pk` in the API refers to the room_type.
        """
        return super(FacilityCapacityViewSet, self).update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        """
        Facility Capacity Updates

        /facility/{facility_pk}/capacity/{pk}
        `pk` in the API refers to the room_type.
        """
        return super(FacilityCapacityViewSet, self).partial_update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """
        Facility Capacity Delete

        /facility/{facility_pk}/capacity/{pk}
        `pk` in the API refers to the room_type.
        """
        return super(FacilityCapacityViewSet, self).destroy(request, *args, **kwargs)
