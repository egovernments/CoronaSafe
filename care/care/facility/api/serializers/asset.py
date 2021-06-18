from django.shortcuts import get_object_or_404
from care.utils.queryset.facility import get_facility_queryset
from rest_framework.serializers import ModelSerializer, UUIDField

from care.facility.api.serializers import TIMESTAMP_FIELDS
from care.facility.api.serializers.facility import FacilityBareMinimumSerializer
from care.facility.models.asset import Asset, AssetLocation, AssetTransaction
from config.serializers import ChoiceField
from rest_framework.exceptions import ValidationError
from django.db import transaction


class AssetLocationSerializer(ModelSerializer):
    facility = FacilityBareMinimumSerializer(read_only=True)
    id = UUIDField(source="external_id", read_only=True)

    class Meta:
        model = AssetLocation
        exclude = ("deleted", "external_id")
        read_only_fields = TIMESTAMP_FIELDS


class AssetSerializer(ModelSerializer):
    id = UUIDField(source="external_id", read_only=True)
    status = ChoiceField(choices=Asset.StatusChoices, read_only=True)
    asset_type = ChoiceField(choices=Asset.AssetTypeChoices)

    location_object = AssetLocationSerializer(source="current_location", read_only=True)

    location = UUIDField(write_only=True, required=True)

    class Meta:
        model = Asset
        exclude = ("deleted", "external_id", "current_location")
        read_only_fields = TIMESTAMP_FIELDS

    def validate(self, attrs):

        user = self.context["request"].user
        if "location" in attrs:
            location = get_object_or_404(AssetLocation.objects.filter(external_id=attrs["location"]))

            facilities = get_facility_queryset(user)
            if not facilities.filter(id=location.facility.id).exists():
                raise PermissionError()
            del attrs["location"]
            attrs["current_location"] = location

        return super().validate(attrs)

    def update(self, instance, validated_data):
        user = self.context["request"].user
        with transaction.atomic():
            if "current_location" in validated_data:
                if instance.current_location != validated_data["current_location"]:
                    if instance.current_location.facility.id != validated_data["current_location"].facility.id:
                        raise ValidationError({"location": "Interfacility transfer is not allowed here"})
                    AssetTransaction(
                        from_location=instance.current_location,
                        to_location=validated_data["current_location"],
                        asset=instance,
                        performed_by=user,
                    ).save()
            updated_instance = super().update(instance, validated_data)
        return updated_instance
