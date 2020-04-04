# Generated by Django 2.2.11 on 2020-04-02 22:09

from django.db import migrations
import multiselectfield.db.fields


class Migration(migrations.Migration):

    dependencies = [
        ('facility', '0068_auto_20200402_2149'),
    ]

    operations = [
        migrations.AlterField(
            model_name='patientconsultation',
            name='symptoms',
            field=multiselectfield.db.fields.MultiSelectField(blank=True, choices=[(1, 'ASYMPTOMATIC'), (2, 'FEVER'), (3, 'SORE THROAT'), (4, 'COUGH'), (5, 'BREATHLESSNESS'), (6, 'MYALGIA'), (7, 'ABDOMINAL DISCOMFORT'), (8, 'VOMITING/DIARRHOEA'), (9, 'OTHERS')], default=1, max_length=17, null=True),
        ),
    ]
