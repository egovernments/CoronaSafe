# Generated by Django 2.2.11 on 2020-04-01 18:41

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('facility', '0058_auto_20200401_1820'),
    ]

    operations = [
        migrations.AddField(
            model_name='patientsample',
            name='fast_track',
            field=models.TextField(default=''),
        ),
    ]
