# Generated by Django 2.2.11 on 2020-03-22 11:58

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('facility', '0012_merge_20200321_1015'),
    ]

    operations = [
        migrations.AddField(
            model_name='building',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='facility',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='facilitycapacity',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='facilitylocation',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='facilitystaff',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='facilityvolunteer',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='hospitaldoctors',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='inventory',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='inventoryitem',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='inventorylog',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='room',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='staffroomallocation',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
    ]
