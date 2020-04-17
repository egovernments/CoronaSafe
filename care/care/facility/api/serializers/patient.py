import datetime

from django.db import transaction
from django.utils.timezone import make_aware
from rest_framework import serializers

from care.facility.api.serializers import TIMESTAMP_FIELDS
from care.facility.api.serializers.facility import FacilityBasicInfoSerializer, FacilitySerializer
from care.facility.api.serializers.patient_consultation import PatientConsultationSerializer
from care.facility.models import (
    DISEASE_CHOICES,
    GENDER_CHOICES,
    Disease,
    Facility,
    FacilityPatientStatsHistory,
    PatientContactDetails,
    PatientMetaInfo,
    PatientRegistration,
    PatientSearch,
)
from care.facility.models.patient_base import DISEASE_STATUS_CHOICES, DiseaseStatusEnum
from care.facility.models.patient_consultation import PatientConsultation
from care.facility.models.patient_tele_consultation import PatientTeleConsultation
from care.users.api.serializers.lsg import DistrictSerializer, LocalBodySerializer, StateSerializer
from care.utils.serializer.phonenumber_ispossible_field import PhoneNumberIsPossibleField
from config.serializers import ChoiceField


class PatientMetaInfoSerializer(serializers.ModelSerializer):
    occupation = ChoiceField(choices=PatientMetaInfo.OccupationChoices)

    class Meta:
        model = PatientMetaInfo
        fields = "__all__"


class PatientListSerializer(serializers.ModelSerializer):
    facility = serializers.IntegerField(source="facility_id", allow_null=True, read_only=True)
    facility_object = FacilityBasicInfoSerializer(source="facility", read_only=True)
    local_body_object = LocalBodySerializer(source="local_body", read_only=True)
    district_object = DistrictSerializer(source="district", read_only=True)
    state_object = StateSerializer(source="state", read_only=True)

    disease_status = ChoiceField(choices=DISEASE_STATUS_CHOICES, default=DiseaseStatusEnum.SUSPECTED.value)
    source = ChoiceField(choices=PatientRegistration.SourceChoices)

    class Meta:
        model = PatientRegistration
        exclude = ("created_by", "deleted", "ongoing_medication", "patient_search_id", "year_of_birth", "meta_info")
        read_only = TIMESTAMP_FIELDS


class PatientContactDetailsSerializer(serializers.ModelSerializer):
    relation_with_patient = ChoiceField(choices=PatientContactDetails.RelationChoices)
    mode_of_contact = ChoiceField(choices=PatientContactDetails.ModeOfContactChoices)

    patient_in_contact_object = PatientListSerializer(read_only=True, source="patient_in_contact")

    class Meta:
        model = PatientContactDetails
        exclude = ("patient",)


class PatientDetailSerializer(PatientListSerializer):
    class MedicalHistorySerializer(serializers.Serializer):
        disease = ChoiceField(choices=DISEASE_CHOICES)
        details = serializers.CharField(required=False, allow_blank=True)

    class PatientTeleConsultationSerializer(serializers.ModelSerializer):
        class Meta:
            model = PatientTeleConsultation
            fields = "__all__"

    phone_number = PhoneNumberIsPossibleField()
    facility = serializers.IntegerField(source="facility_id", allow_null=True, required=False)
    medical_history = serializers.ListSerializer(child=MedicalHistorySerializer(), required=False)

    tele_consultation_history = serializers.ListSerializer(child=PatientTeleConsultationSerializer(), read_only=True)
    last_consultation = serializers.SerializerMethodField(read_only=True)
    facility_object = FacilitySerializer(source="facility", read_only=True)
    nearest_facility_object = FacilitySerializer(source="nearest_facility", read_only=True)

    source = ChoiceField(choices=PatientRegistration.SourceChoices, default=PatientRegistration.SourceEnum.CARE.value)
    disease_status = ChoiceField(choices=DISEASE_STATUS_CHOICES, default=DiseaseStatusEnum.SUSPECTED.value)

    meta_info = PatientMetaInfoSerializer(required=False, allow_null=True)
    contacted_patients = PatientContactDetailsSerializer(many=True, required=False, allow_null=True)
    countries_travelled = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = PatientRegistration
        exclude = ("created_by", "deleted", "patient_search_id", "year_of_birth")
        include = ("contacted_patients",)
        read_only = TIMESTAMP_FIELDS

    def get_last_consultation(self, obj):
        last_consultation = PatientConsultation.objects.filter(patient=obj).last()
        if not last_consultation:
            return None
        return PatientConsultationSerializer(last_consultation).data

    def validate_facility(self, value):
        if value is not None and Facility.objects.filter(id=value).first() is None:
            raise serializers.ValidationError("facility not found")
        return value

    def validate(self, attrs):
        validated = super().validate(attrs)
        if not self.partial and not validated.get("age") and not validated.get("date_of_birth"):
            raise serializers.ValidationError({"non_field_errors": [f"Either age or date_of_birth should be passed"]})
        return validated

    def create(self, validated_data):
        with transaction.atomic():
            medical_history = validated_data.pop("medical_history", [])
            meta_info = validated_data.pop("meta_info", {})
            contacted_patients = validated_data.pop("contacted_patients", [])

            validated_data["created_by"] = self.context["request"].user
            patient = super().create(validated_data)
            diseases = []

            for disease in medical_history:
                diseases.append(Disease(patient=patient, **disease))
            if diseases:
                Disease.objects.bulk_create(diseases, ignore_conflicts=True)

            if meta_info:
                meta_info_obj = PatientMetaInfo.objects.create(**meta_info)
                patient.meta_info = meta_info_obj
                patient.save()

            if contacted_patients:
                contacted_patient_objs = [PatientContactDetails(**data, patient=patient) for data in contacted_patients]
                PatientContactDetails.objects.bulk_create(contacted_patient_objs)

            return patient

    def update(self, instance, validated_data):
        with transaction.atomic():
            medical_history = validated_data.pop("medical_history", [])
            meta_info = validated_data.pop("meta_info", {})
            contacted_patients = validated_data.pop("contacted_patients", [])

            patient = super().update(instance, validated_data)
            Disease.objects.filter(patient=patient).update(deleted=True)
            diseases = []
            for disease in medical_history:
                diseases.append(Disease(patient=patient, **disease))
            if diseases:
                Disease.objects.bulk_create(diseases, ignore_conflicts=True)

            if meta_info:
                for key, value in meta_info.items():
                    setattr(patient.meta_info, key, value)
                patient.meta_info.save()

            if self.partial is not True:  # clear the list and enter details if PUT
                patient.contacted_patients.all().delete()

            if contacted_patients:
                contacted_patient_objs = [PatientContactDetails(**data, patient=patient) for data in contacted_patients]
                PatientContactDetails.objects.bulk_create(contacted_patient_objs)

            return patient


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


class PatientSearchSerializer(serializers.ModelSerializer):
    gender = ChoiceField(choices=GENDER_CHOICES)
    phone_number = PhoneNumberIsPossibleField()

    class Meta:
        model = PatientSearch
        fields = "__all__"


class PatientTransferSerializer(serializers.ModelSerializer):
    facility_object = FacilityBasicInfoSerializer(source="facility", read_only=True)
    patient = serializers.IntegerField(source="id", read_only=True)

    class Meta:
        model = PatientRegistration
        fields = ("facility", "date_of_birth", "patient", "facility_object")

    def validate_date_of_birth(self, value):
        if self.instance and self.instance.date_of_birth != value:
            raise serializers.ValidationError("Date of birth does not match")
        return value

    def create(self, validated_data):
        raise NotImplementedError

    def save(self, **kwargs):
        self.instance.facility = self.validated_data["facility"]
        self.instance.save()
