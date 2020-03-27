import datetime

from django.utils.timezone import make_aware
from rest_framework import fields, serializers

from care.facility.models import (
    MEDICAL_HISTORY_CHOICES,
    FacilityPatientStatsHistory,
    PatientRegistration,
    PatientTeleConsultation,
)


class PatientSerializer(serializers.ModelSerializer):
    medical_history = fields.MultipleChoiceField(choices=MEDICAL_HISTORY_CHOICES)

    class Meta:
        model = PatientRegistration
        exclude = ("created_by", "deleted")


class PatientTeleConsultationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PatientTeleConsultation
        fields = "__all__"


class PatientDetailSerializer(PatientSerializer):
    tele_consultation_history = serializers.ListSerializer(child=PatientTeleConsultationSerializer(), read_only=True)


class FacilityPatientStatsHistorySerializer(serializers.ModelSerializer):
    entry_date = serializers.DateField(default=make_aware(datetime.datetime.today()).date())

    class Meta:
        model = FacilityPatientStatsHistory
        exclude = ("deleted",)
        read_only_fields = (
            "id",
            "facility",
        )

    def create(self, validated_data):
        instance, _ = FacilityPatientStatsHistory.objects.update_or_create(
            facility=validated_data["facility"],
            entry_date=validated_data["entry_date"],
            defaults={**validated_data, "deleted": False},
        )
        return instance
