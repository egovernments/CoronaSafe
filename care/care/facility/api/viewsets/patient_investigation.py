import uuid

from django.db import transaction
from django_filters import Filter, FilterSet
from django_filters import rest_framework as filters
from rest_framework import mixins, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models.query_utils import Q

from care.facility.api.serializers.patient_investigation import (
    PatientInvestigationGroupSerializer,
    PatientInvestigationSerializer,
    InvestigationValueSerializer,
)
from care.facility.models.patient_consultation import PatientConsultation
from care.facility.models.patient_investigation import (
    PatientInvestigation,
    PatientInvestigationGroup,
    InvestigationSession,
    InvestigationValue,
)
from care.users.models import User
from care.utils.cache.patient_investigation import get_investigation_id


class InvestigationGroupFilter(filters.FilterSet):
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")


class GroupFilter(Filter):
    def filter(self, qs, value):
        if not value:
            return qs

        qs = qs.filter(groups__external_id=value)
        return qs


class PatientInvestigationFilter(filters.FilterSet):
    name = filters.CharFilter(field_name="name", lookup_expr="icontains")
    group = GroupFilter()


class InvestigationGroupViewset(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = PatientInvestigationGroupSerializer
    queryset = PatientInvestigationGroup.objects.all()
    lookup_field = "external_id"
    permission_classes = (IsAuthenticated,)
    filterset_class = InvestigationGroupFilter

    filter_backends = (filters.DjangoFilterBackend,)


class PatientInvestigationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    serializer_class = PatientInvestigationSerializer
    queryset = PatientInvestigation.objects.all()
    lookup_field = "external_id"
    permission_classes = (IsAuthenticated,)
    filterset_class = PatientInvestigationFilter

    filter_backends = (filters.DjangoFilterBackend,)


class InvestigationValueViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = InvestigationValueSerializer
    queryset = InvestigationValue.objects.all()
    lookup_field = "external_id"
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        if self.request.user.is_superuser:
            return self.queryset
        elif self.request.user.user_type >= User.TYPE_VALUE_MAP["StateLabAdmin"]:
            return self.queryset.filter(consultation__patient__facility__state=self.request.user.state)
        elif self.request.user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]:
            return self.queryset.filter(consultation__patient__facility__district=self.request.user.district)
        filters = Q(consultation__patient__facility__users__id__exact=self.request.user.id)
        filters |= Q(consultation__assigned_to=self.request.user)
        return self.queryset.filter(filters).distinct("id")

    def create(self, request, *args, **kwargs):

        if "investigations" not in request.data:
            return Response({"investigation": "is required"}, status=status.HTTP_400_BAD_REQUEST)

        investigations = request.data["investigations"]

        if not isinstance(investigations, list):
            return Response({"error": "Data must be a list"}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            consultation_id = PatientConsultation.objects.get(external_id=kwargs.get("consultation_external_id")).id
            session_id = uuid.uuid4()
            session = InvestigationSession(session=session_id)
            session.save()

            for value in investigations:
                value["session"] = session.id
                value["investigation"] = get_investigation_id(value["investigation"])
                value["consultation"] = consultation_id
                print(value)
            serializer = self.get_serializer(data=investigations, many=True)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
