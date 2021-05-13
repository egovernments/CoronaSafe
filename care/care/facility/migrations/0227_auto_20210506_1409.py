# Generated by Django 2.2.11 on 2021-05-06 08:39

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('facility', '0226_facilityinventorylog_quantity_in_default_unit'),
    ]

    operations = [
        migrations.AddField(
            model_name='shiftingrequest',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='shifting_created_by', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='shiftingrequest',
            name='last_edited_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='shifting_last_edited_by', to=settings.AUTH_USER_MODEL),
        ),
    ]
