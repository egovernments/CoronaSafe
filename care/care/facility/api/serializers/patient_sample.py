import datetime

from django.utils.timezone import make_aware
from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from care.facility.api.serializers import TIMESTAMP_FIELDS
from care.facility.models.patient_sample import PatientSample, PatientSampleFlow
from config.serializers import ChoiceField


class PatientSampleFlowSerializer(serializers.ModelSerializer):
    status = ChoiceField(choices=PatientSample.SAMPLE_TEST_FLOW_CHOICES, required=False)

    class Meta:
        model = PatientSampleFlow
        fields = "__all__"


class PatientSampleSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source="patient.name")
    facility = serializers.IntegerField(read_only=True, source="consultation.facility_id")

    status = ChoiceField(choices=PatientSample.SAMPLE_TEST_FLOW_CHOICES, required=False)
    result = ChoiceField(choices=PatientSample.SAMPLE_TEST_RESULT_CHOICES, required=False)

    date_of_sample = serializers.DateTimeField(required=False)
    date_of_result = serializers.DateTimeField(required=False)

    class Meta:
        model = PatientSample
        read_only_fields = ("facility",)
        exclude = TIMESTAMP_FIELDS

    def create(self, validated_data):
        return super(PatientSampleSerializer, self).create(validated_data)


class PatientSamplePatchSerializer(PatientSampleSerializer):
    notes = serializers.CharField(required=False)

    def update(self, instance, validated_data):
        try:
            is_completed = validated_data.get("result") in [1, 2]
            new_status = validated_data.get(
                "status", PatientSample.SAMPLE_TEST_FLOW_MAP["COMPLETED"] if is_completed else None
            )
            choice = PatientSample.SAMPLE_TEST_FLOW_CHOICES[new_status - 1][1]
            if is_completed:
                validated_data["status"] = PatientSample.SAMPLE_TEST_FLOW_MAP["COMPLETED"]
        except KeyError:
            raise ValidationError({"status": ["is required"]})
        valid_choices = PatientSample.SAMPLE_FLOW_RULES[PatientSample.SAMPLE_TEST_FLOW_CHOICES[instance.status - 1][1]]
        if choice not in valid_choices:
            raise ValidationError({"status": [f"Next valid choices are: {', '.join(valid_choices)}"]})
        if choice != "COMPLETED" and validated_data.get("result"):
            raise ValidationError({"result": [f"Result can't be updated unless test is complete"]})
        if choice == "COMPLETED" and not validated_data.get("result"):
            raise ValidationError({"result": [f"is required as the test is complete"]})

        if validated_data.get("status") == PatientSample.SAMPLE_TEST_FLOW_MAP["SENT_TO_COLLECTON_CENTRE"]:
            validated_data["date_of_sample"] = make_aware(datetime.datetime.now())
        elif validated_data.get("status") == PatientSample.SAMPLE_TEST_FLOW_MAP["REQUEST_SUBMITTED"]:
            validated_data["result"] = PatientSample.SAMPLE_TEST_RESULT_MAP["AWAITING"]
        elif validated_data.get("result") is not None:
            validated_data["date_of_result"] = make_aware(datetime.datetime.now())

        return super().update(instance, validated_data)


class PatientSampleDetailSerializer(PatientSampleSerializer):
    flow = serializers.ListSerializer(child=PatientSampleFlowSerializer())
