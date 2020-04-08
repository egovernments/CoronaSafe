import abc
import datetime
from collections import OrderedDict
from typing import Any, Dict

import dateparser
from django.contrib.gis.geos import Point
from django.utils.timezone import make_aware
from pytz import unicode
from rest_framework.test import APITestCase

from care.facility.models import (
    BLOOD_GROUP_VALUES,
    DISEASE_CHOICES_VALUES,
    DISEASE_STATUS_VALUES,
    FACILITY_TYPES_VALUES,
    Disease,
    Facility,
    LocalBody,
    PatientRegistration,
    User,
)
from care.users.models import GENDER_VALUES, District, State
from config.tests.helper import EverythingEquals


class TestBase(APITestCase):
    """
    Base class for tests, handles most of the test setup and tools for setting up data
    """

    maxDiff = None

    @classmethod
    def create_user(cls, district: District, username: str = "user", **kwargs):
        data = {
            "email": f"{username}@somedomain.com",
            "phone_number": "5554446667",
            "age": 30,
            "gender": GENDER_VALUES.choices.Female.value,
            "username": username,
            "password": "bar",
            "district": district,
            "user_type": User.TYPE_VALUES.choices.Staff.value,
        }
        data.update(kwargs)
        return User.objects.create_user(**data)

    @classmethod
    def create_super_user(cls, district: District, username: str = "superuser"):
        user = cls.create_user(
            district=district, username=username, user_type=User.TYPE_VALUES.choices.DistrictAdmin.value,
        )
        user.is_superuser = True
        user.save()
        return user

    @classmethod
    def create_district(cls, state: State):
        return District.objects.create(state=state, name=f"District{datetime.datetime.now().timestamp()}")

    @classmethod
    def create_state(cls):
        return State.objects.create(name=f"State{datetime.datetime.now().timestamp()}")

    @classmethod
    def create_facility(cls, district: District, **kwargs):
        data = {
            "name": "Foo",
            "district": district,
            "facility_type": FACILITY_TYPES_VALUES.choices["Educational Inst"].value,
            "address": "8/88, 1st Cross, 1st Main, Boo Layout",
            "location": Point(24.452545, 49.878248),
            "oxygen_capacity": 10,
            "phone_number": "9998887776",
        }
        data.update(kwargs)
        return Facility.objects.create(**data)

    @classmethod
    def create_patient(cls, **kwargs):
        patient_data = cls.get_patient_data().copy()
        patient_data.update(kwargs)

        medical_history = patient_data.pop("medical_history", [])
        district_id = patient_data.pop("district", None)
        state_id = patient_data.pop("state", None)

        patient_data.update(
            {
                "district_id": district_id,
                "state_id": state_id,
                "disease_status": getattr(DISEASE_STATUS_VALUES.choices, patient_data["disease_status"]).value,
            }
        )

        patient = PatientRegistration.objects.create(**patient_data)
        diseases = [
            Disease.objects.create(
                patient=patient, disease=DISEASE_CHOICES_VALUES.choices[mh["disease"]].value, details=mh["details"],
            )
            for mh in medical_history
        ]
        patient.medical_history.set(diseases)

        return patient

    @classmethod
    def get_user_data(cls, district: District = None, user_type: str = None):
        """
        Returns the data to be used for API testing

            Returns:
                dict

            Params:
                district: District
                user_type: str(A valid mapping for the integer types mentioned inside the models)
        """
        district = district or cls.district
        user_type = user_type or User.TYPE_VALUES.choices.Staff.value

        return {
            "user_type": user_type,
            "district": district,
            "state": district.state,
            "phone_number": "8887776665",
            "gender": GENDER_VALUES.choices.Female.value,
            "age": 30,
            "email": "foo@foobar.com",
            "username": "user",
            "password": "bar",
        }

    @classmethod
    def get_facility_data(cls, district):
        """
        Returns the data to be used for API testing

            Returns:
                dict

            Params:
                district: int
                    An id for the instance of District object created
                user_type: str
                    A valid mapping for the integer types mentioned inside the models
        """
        return {
            "name": "Foo",
            "district": (district or cls.district).id,
            "facility_type": FACILITY_TYPES_VALUES.choices["Educational Inst"].value,
            "address": f"Address {datetime.datetime.now().timestamp}",
            "location": {"latitude": 49.878248, "longitude": 24.452545},
            "oxygen_capacity": 10,
            "phone_number": "9998887776",
            "capacity": [],
        }

    @classmethod
    def get_patient_data(cls, district=None, state=None):
        return {
            "name": "Foo",
            "age": 32,
            "gender": GENDER_VALUES.choices.Female.value,
            "is_medical_worker": True,
            "blood_group": BLOOD_GROUP_VALUES.choices["O+"].name,
            "ongoing_medication": "",
            "date_of_return": make_aware(datetime.datetime(2020, 4, 1, 15, 30, 00)),
            "disease_status": DISEASE_STATUS_VALUES.choices.SUSPECTED.name,
            "phone_number": "8888888888",
            "address": "Global citizen",
            "contact_with_confirmed_carrier": True,
            "contact_with_suspected_carrier": True,
            "estimated_contact_date": None,
            "past_travel": False,
            "countries_travelled": "",
            "present_health": "Fine",
            "has_SARI": False,
            "is_active": True,
            "state": (state or cls.state).id,
            "district": (district or cls.district).id,
            "local_body": None,
            "number_of_aged_dependents": 2,
            "number_of_chronic_diseased_dependents": 1,
            "medical_history": [{"disease": "Diabetes", "details": "150 count"}],
        }

    @classmethod
    def setUpClass(cls) -> None:
        super(TestBase, cls).setUpClass()
        cls.state = cls.create_state()
        cls.district = cls.create_district(cls.state)
        cls.user_type = User.TYPE_VALUES.choices.Staff.value
        cls.user = cls.create_user(cls.district)
        cls.super_user = cls.create_super_user(district=cls.district)
        cls.facility = cls.create_facility(cls.district)
        cls.patient = cls.create_patient()

        cls.user_data = cls.get_user_data(cls.district, cls.user_type)
        cls.facility_data = cls.get_facility_data(cls.district)
        cls.patient_data = cls.get_patient_data(cls.district)

    def setUp(self) -> None:
        self.client.force_login(self.user)

    @abc.abstractmethod
    def get_base_url(self):
        """
        Should return the base url of the testing viewset
        WITHOUT trailing slash

        eg: return "api/v1/facility"
        :return: str
        """
        raise NotImplementedError()

    def get_url(self, entry_id=None, action=None, *args, **kwargs):
        url = self.get_base_url(*args, **kwargs)
        if entry_id is not None:
            url = f"{url}/{entry_id}"
        if action is not None:
            url = f"{url}/{action}"
        return f"{url}/"

    @classmethod
    def clone_object(cls, obj):
        new_obj = obj._meta.model.objects.get(pk=obj.id)
        new_obj.pk = None
        new_obj.id = None
        new_obj.save()
        return new_obj

    @abc.abstractmethod
    def get_list_representation(self, obj) -> dict:
        """
        Returns the dict representation of the obj in list API
        :param obj: Object to be represented
        :return: dict
        """
        raise NotImplementedError()

    @abc.abstractmethod
    def get_detail_representation(self, obj=None) -> dict:
        """
        Returns the dict representation of the obj in detail/retrieve API
        :param obj: Object to be represented
        :param data: data
        :return: dict
        """
        raise NotImplementedError()

    def get_local_body_district_state_representation(self, obj):
        """
        Returns the local body, district and state representation for the obj.
        The obj is expected to have `local_body`, `district` and `state` in it's attributes
        Eg: Facility, Patient, User

        :param obj: Any object which has `local_body`, `district` and `state` in attrs
        :return:
        """
        response = {}
        response.update(self.get_local_body_representation(getattr(obj, "local_body", None)))
        response.update(self.get_district_representation(getattr(obj, "district", None)))
        response.update(self.get_state_representation(getattr(obj, "state", None)))
        return response

    def get_local_body_representation(self, local_body: LocalBody):
        if local_body is None:
            return {"local_body": None, "local_body_object": None}
        else:
            return {
                "local_body": local_body.id,
                "local_body_object": {
                    "id": local_body.id,
                    "name": local_body.name,
                    "district": local_body.district.id,
                },
            }

    def get_district_representation(self, district: District):
        if district is None:
            return {"district": None, "district_object": None}
        return {
            "district": district.id,
            "district_object": {"id": district.id, "name": district.name, "state": district.state.id,},
        }

    def get_state_representation(self, state: State):
        if state is None:
            return {"state": None, "state_object": None}
        return {"state": state.id, "state_object": {"id": state.id, "name": state.name}}

    def assertDictEqual(self, first: Dict[Any, Any], second: Dict[Any, Any], msg: Any = ...) -> None:
        first_dict = self._convert_to_matchable_types(first.copy())
        second_dict = self._convert_to_matchable_types(second.copy())
        return super(TestBase, self).assertDictEqual(first_dict, second_dict, msg)

    def _convert_to_matchable_types(self, d):
        def dict_to_matching_type(d: dict):
            return {k: to_matching_type(k, v) for k, v in d.items()}

        def to_matching_type(name: str, value):
            if isinstance(value, (OrderedDict, dict)):
                return dict_to_matching_type(dict(value))
            elif isinstance(value, list):
                return [to_matching_type("", v) for v in value]
            elif "date" in name and not isinstance(value, (type(None), EverythingEquals)):
                return_value = value
                if isinstance(value, (str, unicode,)):
                    return_value = dateparser.parse(value)
                return return_value.astimezone(tz=datetime.timezone.utc)
            return value

        return dict_to_matching_type(d)
