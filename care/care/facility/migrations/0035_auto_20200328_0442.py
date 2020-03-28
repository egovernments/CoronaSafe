# Generated by Django 2.2.11 on 2020-03-28 04:42

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('facility', '0034_auto_20200327_1628'),
    ]

    operations = [
        migrations.CreateModel(
            name='PatientConsultation',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('suggestion', models.CharField(choices=[('HI', 'HOME ISOLATION'), ('A', 'ADMISSION'), ('R', 'REFERRAL')], max_length=3)),
                ('admitted', models.BooleanField(default=False)),
                ('admission_date', models.DateTimeField(null=True)),
                ('discharge_date', models.DateTimeField(null=True)),
                ('facility', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='consultations', to='facility.Facility')),
                ('patient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='consultations', to='facility.PatientRegistration')),
                ('referred_to', models.ForeignKey(null=True, on_delete=django.db.models.deletion.PROTECT, related_name='referred_patients', to='facility.Facility')),
            ],
        ),
        migrations.AddConstraint(
            model_name='patientconsultation',
            constraint=models.CheckConstraint(check=models.Q(models.Q(_negated=True, suggestion='R'), ('referred_to__isnull', False), _connector='OR'), name='if_referral_suggested'),
        ),
        migrations.AddConstraint(
            model_name='patientconsultation',
            constraint=models.CheckConstraint(check=models.Q(('admitted', False), ('admission_date__isnull', False), _connector='OR'), name='if_admitted'),
        ),
    ]
