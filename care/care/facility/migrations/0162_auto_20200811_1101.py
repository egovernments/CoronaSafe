# Generated by Django 2.2.11 on 2020-08-11 05:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('facility', '0161_auto_20200810_1338'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patientconsultation',
            name='diagnosis',
            field=models.TextField(blank=True, default='', null=True),
        ),
    ]
