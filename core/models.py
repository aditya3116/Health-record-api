# Created by: Aadit
# Date: May 2025
# Description: Models for the Health Record Management System
# This file defines the database structure for the entire application

from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail

class Patient(models.Model):
    # Basic patient information linked to Django's built-in User model
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    date_of_birth = models.DateField(null=True, blank=True)
    phone_number = models.CharField(max_length=15, blank=True)
    address = models.TextField(blank=True)

    def __str__(self):
        return self.user.username

class Doctor(models.Model):
    # Doctor profile with professional details and patient relationships
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    specialization = models.CharField(max_length=100, blank=True)
    license_number = models.CharField(max_length=50, blank=True)
    patients = models.ManyToManyField(Patient, related_name='doctors', blank=True)

    def __str__(self):
        return self.user.username

class HealthRecord(models.Model):
    # Medical records for patients that can be accessed by assigned doctors
    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='health_records')
    title = models.CharField(max_length=200)
    description = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.patient.user.username} - {self.title}"

class DoctorNote(models.Model):
    # Professional notes added by doctors to patient health records
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='notes')
    health_record = models.ForeignKey(HealthRecord, on_delete=models.CASCADE, related_name='doctor_notes')
    note = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.doctor.user.username} - {self.health_record.title}"

@receiver(post_save, sender=Doctor.patients.through)
def notify_doctor_new_patient(sender, instance, created, **kwargs):
    # Automatically notify doctors when they are assigned new patients
    if created:
        doctor = instance.doctor
        patient = instance.patient
        send_mail(
            'New Patient Assigned',
            f'You have been assigned a new patient: {patient.user.get_full_name()}',
            'from@example.com',
            [doctor.user.email],
            fail_silently=True,
        ) 