from django.contrib.postgres.fields import JSONField
from django.db import models
from multiselectfield import MultiSelectField

from care.facility.models import CATEGORY_CHOICES, PatientBaseModel
from care.facility.models.mixins.permissions.patient import PatientRelatedPermissionMixin
from care.facility.models.patient_base import (
    ADMIT_CHOICES,
    CURRENT_HEALTH_CHOICES,
    REVERSE_SYMPTOM_CATEGORY_CHOICES,
    SYMPTOM_CHOICES,
    SuggestionChoices,
    reverse_choices,
)
from care.users.models import User


class PatientConsultation(PatientBaseModel, PatientRelatedPermissionMixin):
    SUGGESTION_CHOICES = [
        (SuggestionChoices.HI, "HOME ISOLATION"),
        (SuggestionChoices.A, "ADMISSION"),
        (SuggestionChoices.R, "REFERRAL"),
        (SuggestionChoices.OP, "OP CONSULTATION"),
        (SuggestionChoices.DC, "DOMICILIARY CARE"),
    ]
    REVERSE_SUGGESTION_CHOICES = reverse_choices(SUGGESTION_CHOICES)

    patient = models.ForeignKey("PatientRegistration", on_delete=models.CASCADE, related_name="consultations")

    ip_no = models.CharField(max_length=100, default="", null=True, blank=True)

    facility = models.ForeignKey("Facility", on_delete=models.CASCADE, related_name="consultations")
    diagnosis = models.TextField(default="", null=True, blank=True)
    symptoms = MultiSelectField(choices=SYMPTOM_CHOICES, default=1, null=True, blank=True)
    other_symptoms = models.TextField(default="", blank=True)
    symptoms_onset_date = models.DateTimeField(null=True, blank=True)
    category = models.CharField(choices=CATEGORY_CHOICES, max_length=8, default=None, blank=True, null=True)
    examination_details = models.TextField(null=True, blank=True)
    existing_medication = models.TextField(null=True, blank=True)
    prescribed_medication = models.TextField(null=True, blank=True)
    consultation_notes = models.TextField(null=True, blank=True)
    course_in_facility = models.TextField(null=True, blank=True)
    discharge_advice = JSONField(default=dict)
    prescriptions = JSONField(default=dict)  # To be Used Later on
    suggestion = models.CharField(max_length=4, choices=SUGGESTION_CHOICES)
    referred_to = models.ForeignKey(
        "Facility", null=True, blank=True, on_delete=models.PROTECT, related_name="referred_patients",
    )
    admitted = models.BooleanField(default=False)
    admitted_to = models.IntegerField(choices=ADMIT_CHOICES, default=None, null=True, blank=True)
    admission_date = models.DateTimeField(null=True, blank=True)
    discharge_date = models.DateTimeField(null=True, blank=True)
    bed_number = models.CharField(max_length=100, null=True, blank=True)

    is_telemedicine = models.BooleanField(default=False)

    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="patient_assigned_to")

    verified_by = models.TextField(default="", null=True, blank=True)

    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="created_user")

    last_edited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="last_edited_user")

    CSV_MAPPING = {
        "consultation_created_date": "Date of Consultation",
        "admission_date": "Date of Admission",
        "symptoms_onset_date": "Date of Onset of Symptoms",
        "symptoms": "Symptoms at time of consultation",
        "category": "Category",
        "examination_details": "Examination Details",
        "suggestion": "Suggestion",
    }

    CSV_MAKE_PRETTY = {
        "category": (lambda x: REVERSE_SYMPTOM_CATEGORY_CHOICES.get(x, "-")),
        "suggestion": (lambda x: PatientConsultation.REVERSE_SUGGESTION_CHOICES.get(x, "-")),
    }

    # CSV_DATATYPE_DEFAULT_MAPPING = {
    #     "admission_date": (None, models.DateTimeField(),),
    #     "symptoms_onset_date": (None, models.DateTimeField(),),
    #     "symptoms": ("-", models.CharField(),),
    #     "category": ("-", models.CharField(),),
    #     "examination_details": ("-", models.CharField(),),
    #     "suggestion": ("-", models.CharField(),),
    # }

    def __str__(self):
        return f"{self.patient.name}<>{self.facility.name}"

    def save(self, *args, **kwargs):
        """
        # Removing Patient Hospital Change on Referral
        if not self.pk or self.referred_to is not None:
            # pk is None when the consultation is created
            # referred to is not null when the person is being referred to a new facility
            self.patient.facility = self.referred_to or self.facility
            self.patient.save()
        """
        super(PatientConsultation, self).save(*args, **kwargs)

    class Meta:
        constraints = [
            models.CheckConstraint(
                name="if_referral_suggested",
                check=~models.Q(suggestion=SuggestionChoices.R) | models.Q(referred_to__isnull=False),
            ),
            models.CheckConstraint(
                name="if_admitted", check=models.Q(admitted=False) | models.Q(admission_date__isnull=False),
            ),
        ]


class DailyRound(PatientBaseModel):
    consultation = models.ForeignKey(PatientConsultation, on_delete=models.PROTECT, related_name="daily_rounds")
    temperature = models.DecimalField(max_digits=5, decimal_places=2, blank=True, default=0)
    spo2 = models.DecimalField(max_digits=4, decimal_places=2, blank=True, null=True, default=None)
    temperature_measured_at = models.DateTimeField(null=True, blank=True)
    physical_examination_info = models.TextField(null=True, blank=True)
    additional_symptoms = MultiSelectField(choices=SYMPTOM_CHOICES, default=1, null=True, blank=True)
    other_symptoms = models.TextField(default="", blank=True)
    patient_category = models.CharField(choices=CATEGORY_CHOICES, max_length=8, default=None, blank=True, null=True)
    current_health = models.IntegerField(default=0, choices=CURRENT_HEALTH_CHOICES, blank=True)
    recommend_discharge = models.BooleanField(default=False, verbose_name="Recommend Discharging Patient")
    other_details = models.TextField(null=True, blank=True)
    medication_given = JSONField(default=dict)  # To be Used Later on
    admitted_to = models.IntegerField(choices=ADMIT_CHOICES, default=None, null=True, blank=True)

    @staticmethod
    def has_write_permission(request):
        if (
            request.user.user_type == User.TYPE_VALUE_MAP["DistrictReadOnlyAdmin"]
            or request.user.user_type == User.TYPE_VALUE_MAP["StateReadOnlyAdmin"]
            or request.user.user_type == User.TYPE_VALUE_MAP["StaffReadOnly"]
        ):
            return False
        return DailyRound.has_read_permission(request)

    @staticmethod
    def has_read_permission(request):
        return request.user.is_superuser or (
            (
                request.user
                in PatientConsultation.objects.get(
                    external_id=request.parser_context["kwargs"]["consultation_external_id"]
                ).patient.facility.users.all()
            )
            or (
                request.user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]
                and (
                    request.user.district
                    == PatientConsultation.objects.get(
                        external_id=request.parser_context["kwargs"]["consultation_external_id"]
                    ).patient.facility.district
                )
            )
            or (
                request.user.user_type >= User.TYPE_VALUE_MAP["StateLabAdmin"]
                and (
                    request.user.state
                    == PatientConsultation.objects.get(
                        external_id=request.parser_context["kwargs"]["consultation_external_id"]
                    ).patient.facility.state
                )
            )
        )

    def has_object_read_permission(self, request):
        return (
            request.user.is_superuser
            or (self.consultation.patient.facility and request.user in self.consultation.patient.facility.users.all())
            or (
                request.user.user_type >= User.TYPE_VALUE_MAP["DistrictLabAdmin"]
                and (
                    self.consultation.patient.facility
                    and request.user.district == self.consultation.patient.facility.district
                )
            )
            or (
                request.user.user_type >= User.TYPE_VALUE_MAP["StateLabAdmin"]
                and (
                    self.consultation.patient.facility
                    and request.user.state == self.consultation.patient.facility.district
                )
            )
        )

    def has_object_write_permission(self, request):
        if (
            request.user.user_type == User.TYPE_VALUE_MAP["DistrictReadOnlyAdmin"]
            or request.user.user_type == User.TYPE_VALUE_MAP["StateReadOnlyAdmin"]
            or request.user.user_type == User.TYPE_VALUE_MAP["StaffReadOnly"]
        ):
            return False
        return self.has_object_read_permission(request)
