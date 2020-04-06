from django.db import models

from care.facility.models import FacilityBaseModel, PatientRegistration
from care.users.models import User
from care.utils.enum_choices import EnumChoices


class PatientSample(FacilityBaseModel):
    SAMPLE_TEST_RESULT_VALUES = EnumChoices(choices={"POSITIVE": 1, "NEGATIVE": 2, "AWAITING": 3, "INVALID": 4})
    SAMPLE_TEST_RESULT_CHOICES = SAMPLE_TEST_RESULT_VALUES.list_tuple_choices()

    SAMPLE_TEST_FLOW_VALUES = EnumChoices(
        choices={
            "REQUEST_SUBMITTED": 1,
            "APPROVED": 2,
            "DENIED": 3,
            "SENT_TO_COLLECTON_CENTRE": 4,
            "RECEIVED_AND_FORWARED": 5,
            "RECEIVED_AT_LAB": 6,
            "COMPLETED": 7,
        }
    )
    SAMPLE_TEST_FLOW_CHOICES = SAMPLE_TEST_FLOW_VALUES.list_tuple_choices()
    SAMPLE_FLOW_RULES = {
        # previous rule      # next valid rules
        "REQUEST_SUBMITTED": {"APPROVED", "DENIED",},
        "APPROVED": {"SENT_TO_COLLECTON_CENTRE", "RECEIVED_AND_FORWARED", "RECEIVED_AT_LAB", "COMPLETED"},
        "DENIED": {"REQUEST_SUBMITTED"},
        "SENT_TO_COLLECTON_CENTRE": {"RECEIVED_AND_FORWARED", "RECEIVED_AT_LAB", "COMPLETED"},
        "RECEIVED_AND_FORWARED": {"RECEIVED_AT_LAB", "COMPLETED"},
        "RECEIVED_AT_LAB": {"COMPLETED"},
    }

    patient = models.ForeignKey(PatientRegistration, on_delete=models.PROTECT)
    consultation = models.ForeignKey("PatientConsultation", on_delete=models.PROTECT)

    status = models.IntegerField(
        choices=SAMPLE_TEST_FLOW_CHOICES, default=SAMPLE_TEST_FLOW_VALUES.choices.REQUEST_SUBMITTED.value,
    )
    result = models.IntegerField(
        choices=SAMPLE_TEST_RESULT_CHOICES, default=SAMPLE_TEST_RESULT_VALUES.choices.AWAITING.value,
    )

    fast_track = models.TextField(default="")

    date_of_sample = models.DateTimeField(null=True, blank=True)
    date_of_result = models.DateTimeField(null=True, blank=True)

    @property
    def flow(self):
        try:
            return self.flow_prefetched
        except AttributeError:
            return self.patientsampleflow_set.order_by("-created_date")

    @staticmethod
    def has_write_permission(request):
        return request.user.is_superuser or request.user.user_type >= User.TYPE_VALUES.choices.Staff.value

    @staticmethod
    def has_read_permission(request):
        return request.user.is_superuser or request.user.user_type >= User.TYPE_VALUES.choices.Staff.value

    def has_object_read_permission(self, request):
        return (
            request.user.is_superuser
            or request.user == self.consultation.facility.created_by
            or (
                request.user.district == self.consultation.facility.district
                and request.user.user_type >= User.TYPE_VALUES.choices.DistrictLabAdmin.value
            )
            or (
                request.user.state == self.consultation.facility.state
                and request.user.user_type >= User.TYPE_VALUES.choices.StateLabAdmin.value
            )
        )

    def has_object_update_permission(self, request):
        if not self.has_object_read_permission(request):
            return False
        if request.user.is_superuser:
            return True
        map_ = self.SAMPLE_TEST_FLOW_CHOICES
        if map_[self.status - 1][1] in ("REQUEST_SUBMITTED", "SENT_TO_COLLECTON_CENTRE",):
            return request.user.user_type >= User.TYPE_VALUES.choices.DistrictLabAdmin.value
        elif map_[self.status - 1][1] in ("APPROVED", "DENIED"):
            return request.user.user_type >= User.TYPE_VALUES.choices.Staff.value
        elif map_[self.status - 1][1] in ("RECEIVED_AND_FORWARED", "RECEIVED_AT_LAB"):
            return request.user.user_type >= User.TYPE_VALUES.choices.StateLabAdmin.value
        # The view shall raise a 400
        return True

    def has_object_destroy_permission(self, request):
        return request.user.is_superuser


class PatientSampleFlow(FacilityBaseModel):
    patient_sample = models.ForeignKey(PatientSample, on_delete=models.PROTECT)
    status = models.IntegerField(choices=PatientSample.SAMPLE_TEST_FLOW_CHOICES)
    notes = models.CharField(max_length=255)
    created_by = models.ForeignKey(User, on_delete=models.PROTECT)
