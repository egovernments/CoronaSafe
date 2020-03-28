# Generated by Django 2.2.11 on 2020-03-28 18:44

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('users', '0015_merge_20200327_1215'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='user_type',
            field=models.IntegerField(choices=[(5, 'Doctor'), (10, 'Staff'), (15, 'Patient'), (20, 'Volunteer'),
                                               (40, 'DistrictNodalLabOfficer')]),
        ),
    ]
