import random
import string
import time

import celery
from django.conf import settings
from django.core.files.storage import default_storage
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from hardcopy import bytestring_to_pdf

from care.facility.models import DailyRound, PatientConsultation, PatientRegistration, PatientSample


def randomString(stringLength):
    letters = string.ascii_letters
    return "".join(random.choice(letters) for i in range(stringLength))


@celery.task()
def generate_discharge_report(patient, email):
    patient = PatientRegistration.objects.get(id=patient)
    consultation = PatientConsultation.objects.filter(patient=patient).order_by("-created_date")
    if consultation.exists():
        consultation = consultation.first()
        samples = PatientSample.objects.filter(patient=patient, consultation=consultation)
        daily_rounds = DailyRound.objects.filter(consultation=consultation)
    else:
        consultation = None
        samples = None
        daily_rounds = None

    html_string = render_to_string(
        "patient_pdf_template.html",
        {"patient": patient, "samples": samples, "consultation": consultation, "dailyround": daily_rounds},
    )
    print(1)
    filename = str(int(round(time.time() * 1000))) + randomString(10) + ".pdf"
    print(2)
    bytestring_to_pdf(
        html_string.encode(),
        default_storage.open(filename, "w+"),
        **{"no-margins": None, "disable-gpu": None, "window-size": "2480,3508"},
    )
    print(3)
    file = default_storage.open(filename, "rb")
    print(4)
    msg = EmailMessage(
        "Patient Discharge Summary", "Please find the attached file", settings.DEFAULT_FROM_EMAIL, (email,),
    )
    print(5)
    msg.content_subtype = "html"  # Main content is now text/html
    msg.attach(patient.name + "-Discharge_Summary", file.read(), "application/pdf")
    msg.send()
    print(6)
    default_storage.delete(filename)
