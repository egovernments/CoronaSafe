from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db import transaction
from rest_framework import exceptions, serializers

from care.facility.models import Facility, FacilityUser
from care.users.api.serializers.lsg import DistrictSerializer, LocalBodySerializer, StateSerializer
from care.users.models import GENDER_CHOICES
from config.serializers import ChoiceField

User = get_user_model()


class SignUpSerializer(serializers.ModelSerializer):
    user_type = ChoiceField(choices=User.TYPE_CHOICES)
    gender = ChoiceField(choices=GENDER_CHOICES)
    password = serializers.CharField(write_only=True)

    # until we start supporting other states
    state = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "user_type",
            "local_body",
            "district",
            "state",
            "phone_number",
            "gender",
            "age",
        )

    def create(self, validated_data):
        validated_data["password"] = make_password(validated_data.get("password"))
        return super().create(validated_data)


class UserCreateSerializer(SignUpSerializer):
    password = serializers.CharField(required=False)
    facilities = serializers.ListSerializer(
        child=serializers.IntegerField(), required=False, allow_empty=True, write_only=True
    )

    class Meta:
        model = User
        include = ("facilities",)
        exclude = ()

    def validate_facilities(self, facility_ids):
        if facility_ids:
            if len(facility_ids) != Facility.objects.filter(id__in=facility_ids).count():
                available_facility_ids = Facility.objects.filter(id__in=facility_ids).values_list("id", flat=True)
                not_found_ids = list(set(facility_ids) - set(available_facility_ids))
                raise serializers.ValidationError(
                    f"Some facilities are not available - {', '.join([str(_id) for _id in not_found_ids])}"
                )
        return facility_ids

    def validate(self, attrs):
        validated = super(UserCreateSerializer, self).validate(attrs)
        if (
            validated["user_type"] > self.context["created_by"].user_type
            and not self.context["created_by"].is_superuser
        ):
            raise exceptions.ValidationError({"user_type": ["User cannot create another user with higher permissions"]})
        return validated

    def create(self, validated_data):
        with transaction.atomic():
            facilities = validated_data.pop("facilities", [])
            print(validated_data)
            validated_data["password"] = make_password(validated_data["password"])

            user = super().create(validated_data)

            if facilities:
                facility_objs = Facility.objects.filter(id__in=facilities)
                facility_user_objs = [
                    FacilityUser(facility=facility, user=user, created_by=self.context["created_by"])
                    for facility in facility_objs
                ]
                FacilityUser.objects.bulk_create(facility_user_objs)
            return user


class UserSerializer(SignUpSerializer):
    user_type = ChoiceField(choices=User.TYPE_CHOICES, read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)

    local_body_object = LocalBodySerializer(source="local_body", read_only=True)
    district_object = DistrictSerializer(source="district", read_only=True)
    state_object = StateSerializer(source="state", read_only=True)

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "user_type",
            "local_body",
            "district",
            "state",
            "phone_number",
            "gender",
            "age",
            "is_superuser",
            "verified",
            "local_body_object",
            "district_object",
            "state_object",
        )
        read_only_fields = ("is_superuser", "verified")

    extra_kwargs = {"url": {"lookup_field": "username"}}


class UserListSerializer(serializers.ModelSerializer):
    local_body_object = LocalBodySerializer(source="local_body", read_only=True)
    district_object = DistrictSerializer(source="district", read_only=True)
    state_object = StateSerializer(source="state", read_only=True)

    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "local_body_object", "district_object", "state_object")
