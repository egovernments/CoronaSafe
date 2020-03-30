# Generated by Django 2.2.11 on 2020-03-30 10:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('facility', '0048_auto_20200330_0433'),
    ]

    operations = [
        migrations.AddField(
            model_name='patientconsultation',
            name='examination_details',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patientconsultation',
            name='existing_medication',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='patientconsultation',
            name='prescribed_medication',
            field=models.TextField(blank=True, null=True),
        ),
    ]
