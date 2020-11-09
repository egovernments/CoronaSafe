from collections import defaultdict

from django.conf import settings
from django_filters import rest_framework as filters
from django_filters import Filter
from djqscsv import render_to_csv_response
from dry_rest_permissions.generics import DRYPermissions
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.generics import get_object_or_404
from rest_framework.mixins import DestroyModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from care.facility.api.serializers.patient_external_test import PatientExternalTestSerializer
from care.facility.api.viewsets.mixins.access import UserAccessMixin
from care.facility.models import PatientExternalTest
from care.users.models import User, Ward


def prettyerrors(errors):
    pretty_errors = defaultdict(list)
    for attribute in PatientExternalTest.HEADER_CSV_MAPPING.keys():
        if attribute in errors:
            for error in errors.get(attribute, ""):
                pretty_errors[attribute].append(str(error))
    return dict(pretty_errors)


class MFilter(Filter):
    def filter(self, qs, value):
        if not value:
            return qs
        values = value.split(",")
        _filter = {self.field_name + "__in": values, self.field_name + "__isnull": False}
        qs = qs.filter(**_filter)
        return qs


class PatientExternalTestFilter(filters.FilterSet):
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    srf_id = filters.CharFilter(field_name="srf_id", lookup_expr="icontains")
    mobile_number = filters.CharFilter(field_name="mobile_number", lookup_expr="icontains")
    wards = MFilter(field_name="ward__id")
    districts = MFilter(field_name="district__id")


class PatientExternalTestViewSet(
    RetrieveModelMixin, ListModelMixin, DestroyModelMixin, GenericViewSet,
):
    serializer_class = PatientExternalTestSerializer
    queryset = PatientExternalTest.objects.select_related("ward", "local_body", "district").all().order_by("-id")
    permission_classes = (IsAuthenticated,)
    filter_backends = (filters.DjangoFilterBackend,)
    filterset_class = PatientExternalTestFilter
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def get_queryset(self):
        queryset = self.queryset
        if not self.request.user.is_superuser:
            if self.request.user.user_type >= User.TYPE_VALUE_MAP["StateLabAdmin"]:
                queryset = queryset.filter(district__state=self.request.user.state)
            elif self.request.user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]:
                queryset = queryset.filter(district=self.request.user.district)
            elif self.request.user.user_type >= User.TYPE_VALUE_MAP["LocalBodyAdmin"]:
                queryset = queryset.filter(local_body=self.request.user.local_body)
            elif self.request.user.user_type >= User.TYPE_VALUE_MAP["WardAdmin"]:
                queryset = queryset.filter(ward=self.request.user.ward, ward__isnull=False)
        return queryset

    def check_upload_permission(self):
        if (
            self.request.user.is_superuser == True
            or self.request.user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]
        ):
            return True
        return False

    def list(self, request, *args, **kwargs):
        if settings.CSV_REQUEST_PARAMETER in request.GET:
            mapping = PatientExternalTest.CSV_MAPPING.copy()
            pretty_mapping = PatientExternalTest.CSV_MAKE_PRETTY.copy()
            queryset = self.filter_queryset(self.get_queryset()).values(*mapping.keys())
            return render_to_csv_response(queryset, field_header_map=mapping, field_serializer_map=pretty_mapping)
        return super(PatientExternalTestViewSet, self).list(request, *args, **kwargs)

    @action(methods=["POST"], detail=False)
    def bulk_upsert(self, request, *args, **kwargs):
        if not self.check_upload_permission():
            raise PermissionDenied("Permission to Endpoint Denied")
        # if len(request.FILES.keys()) != 1:
        #     raise ValidationError({"file": "Upload 1 File at a time"})
        # csv_file = request.FILES[list(request.FILES.keys())[0]]
        # csv_file.seek(0)
        # reader = csv.DictReader(io.StringIO(csv_file.read().decode("utf-8-sig")))
        if "sample_tests" not in request.data:
            raise ValidationError({"sample_tests": "No Data was provided"})
        if type(request.data["sample_tests"]) != type([]):
            raise ValidationError({"sample_tests": "Data should be provided as a list"})
        errors = {}
        counter = 0
        ser_objects = []
        invalid = False
        for sample in request.data["sample_tests"]:
            counter += 1
            serialiser_obj = PatientExternalTestSerializer(data=sample)
            valid = serialiser_obj.is_valid()
            current_error = prettyerrors(serialiser_obj._errors)
            if current_error and (not valid):
                errors[counter] = current_error
                invalid = True
            ser_objects.append(serialiser_obj)
        if invalid:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)
        for ser_object in ser_objects:
            ser_object.save()
        return Response(status=status.HTTP_202_ACCEPTED)
