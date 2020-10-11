from django.db.models import Q
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from care.facility.api.serializers import TIMESTAMP_FIELDS
from care.facility.api.serializers.facility import FacilityBasicInfoSerializer
from care.facility.api.serializers.patient import PatientDetailSerializer, PatientListSerializer
from care.facility.models import (
    FACILITY_TYPES,
    SHIFTING_STATUS_CHOICES,
    Facility,
    PatientRegistration,
    ShiftingRequest,
    User,
    VEHICLE_CHOICES,
)
from config.serializers import ChoiceField


def inverse_choices(choices):
    output = {}
    for choice in choices:
        output[choice[1]] = choice[0]
    return output


REVERSE_SHIFTING_STATUS_CHOICES = inverse_choices(SHIFTING_STATUS_CHOICES)


def has_facility_permission(user, facility):
    return (
        user.is_superuser
        or (facility and user in facility.users.all())
        or (
            user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]
            and (facility and user.district == facility.district)
        )
        or (user.user_type >= User.TYPE_VALUE_MAP["StateLabAdmin"] and (facility and user.state == facility.state))
    )


class ShiftingSerializer(serializers.ModelSerializer):

    id = serializers.UUIDField(source="external_id", read_only=True)

    status = ChoiceField(choices=SHIFTING_STATUS_CHOICES)
    patient_object = PatientListSerializer(source="patient", read_only=True, required=False)

    orgin_facility_object = FacilityBasicInfoSerializer(source="orgin_facility", read_only=True, required=False)
    shifting_approving_facility_object = FacilityBasicInfoSerializer(
        source="shifting_approving_facility", read_only=True, required=False
    )
    assigned_facility_object = FacilityBasicInfoSerializer(source="assigned_facility", read_only=True, required=False)

    assigned_facility_type = ChoiceField(choices=FACILITY_TYPES)
    preferred_vehicle_choice = ChoiceField(choices=VEHICLE_CHOICES)

    orgin_facility = serializers.UUIDField(source="orgin_facility.external_id", allow_null=False, required=True)
    shifting_approving_facility = serializers.UUIDField(
        source="shifting_approving_facility.external_id", allow_null=False, required=True
    )
    assigned_facility = serializers.UUIDField(source="assigned_facility.external_id", allow_null=True, required=False)

    patient = serializers.UUIDField(source="patient.external_id", allow_null=False, required=True)

    def __init__(self, instance=None, **kwargs):
        if instance:
            kwargs["partial"] = True
        super().__init__(instance=instance, **kwargs)

    def update(self, instance, validated_data):

        LIMITED_RECIEVING_STATUS_ = [
            "DESTINATION APPROVED",
            "DESTINATION REJECTED",
            "COMPLETED",
        ]
        LIMITED_RECIEVING_STATUS = [REVERSE_SHIFTING_STATUS_CHOICES[x] for x in LIMITED_RECIEVING_STATUS_]
        LIMITED_SHIFTING_STATUS_ = [
            "APPROVED",
            "REJECTED",
            "PATIENT TO BE PICKED UP",
            "TRANSPORTATION TO BE ARRANGED",
            "TRANSFER IN PROGRESS",
            "COMPLETED",
            "PENDING",
            "ON HOLD",
        ]
        LIMITED_SHIFTING_STATUS = [REVERSE_SHIFTING_STATUS_CHOICES[x] for x in LIMITED_SHIFTING_STATUS_]
        LIMITED_ORGIN_STATUS = []

        user = self.context["request"].user

        if "is_kasp" in validated_data:
            if validated_data["is_kasp"] != instance.is_kasp:  # Check only when changed
                if not has_facility_permission(user, instance.shifting_approving_facility):
                    raise ValidationError({"kasp": ["Permission Denied"]})

        if "status" in validated_data:
            if validated_data["status"] in LIMITED_RECIEVING_STATUS:
                if instance.assigned_facility:
                    if not has_facility_permission(user, instance.assigned_facility):
                        raise ValidationError({"status": ["Permission Denied"]})
                else:
                    raise ValidationError({"status": ["Permission Denied"]})
            elif "status" in validated_data:
                if validated_data["status"] in LIMITED_SHIFTING_STATUS:
                    if not has_facility_permission(user, instance.shifting_approving_facility):
                        raise ValidationError({"status": ["Permission Denied"]})

        # Dont allow editing origin or patient
        if "orgin_facility" in validated_data:
            validated_data.pop("orgin_facility")
        if "patient" in validated_data:
            validated_data.pop("patient")

        if "shifting_approving_facility" in validated_data:
            shifting_approving_facility_external_id = validated_data.pop("shifting_approving_facility")["external_id"]
            if shifting_approving_facility_external_id:
                validated_data["shifting_approving_facility_id"] = Facility.objects.get(
                    external_id=shifting_approving_facility_external_id
                ).id

        if "assigned_facility" in validated_data:
            assigned_facility_external_id = validated_data.pop("assigned_facility")["external_id"]
            if assigned_facility_external_id:
                validated_data["assigned_facility_id"] = Facility.objects.get(
                    external_id=assigned_facility_external_id
                ).id

        return super().update(instance, validated_data)

    def create(self, validated_data):

        # Do Validity checks for each of these data
        if "status" in validated_data:
            validated_data.pop("status")

        validated_data["is_kasp"] = False

        orgin_facility_external_id = validated_data.pop("orgin_facility")["external_id"]
        # validated_data["orgin_facility_id"] = Facility.objects.get(external_id=orgin_facility_external_id).id

        shifting_approving_facility_external_id = validated_data.pop("shifting_approving_facility")["external_id"]
        validated_data["shifting_approving_facility_id"] = Facility.objects.get(
            external_id=shifting_approving_facility_external_id
        ).id

        if "assigned_facility" in validated_data:
            assigned_facility_external_id = validated_data.pop("assigned_facility")["external_id"]
            if assigned_facility_external_id:

                validated_data["assigned_facility_id"] = Facility.objects.get(
                    external_id=assigned_facility_external_id
                ).id

        patient_external_id = validated_data.pop("patient")["external_id"]
        patient = PatientRegistration.objects.get(external_id=patient_external_id)

        if patient.is_active == False:
            raise ValidationError({"patient": ["Cannot shift discharged patient"]})
        if patient.allow_transfer == False:
            patient.allow_transfer = True
            patient.save()

        validated_data["orgin_facility_id"] = patient.facility.id
        validated_data["patient_id"] = patient.id

        if ShiftingRequest.objects.filter(~Q(status__in=[30, 50, 80]), patient=patient).exists():
            raise ValidationError({"request": ["Shifting Request for Patient already exists"]})

        return super().create(validated_data)

    class Meta:
        model = ShiftingRequest
        exclude = ("deleted",)
        read_only_fields = TIMESTAMP_FIELDS


class ShiftingDetailSerializer(ShiftingSerializer):

    patient = PatientDetailSerializer(read_only=True, required=False)

    class Meta:
        model = ShiftingRequest
        exclude = ("deleted",)
        read_only_fields = TIMESTAMP_FIELDS
