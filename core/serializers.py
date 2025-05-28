# Created by: Aadit
# Date: May 2025
# Description: Serializers for the Health Record Management System
# This file handles data serialization/deserialization for API responses

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Patient, Doctor, HealthRecord, DoctorNote

class UserSerializer(serializers.ModelSerializer):
    """Serializer for the User model with secure password handling"""
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password')

    def create(self, validated_data):
        # Create a new user with a properly hashed password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class PatientSerializer(serializers.ModelSerializer):
    """Serializer for Patient model with nested user information"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Patient
        fields = '__all__'

    def create(self, validated_data):
        # Create a new patient profile with associated user
        user_data = validated_data.pop('user')
        user = UserSerializer().create(user_data)
        patient = Patient.objects.create(user=user, **validated_data)
        return patient

class DoctorSerializer(serializers.ModelSerializer):
    """Serializer for Doctor model with nested user information"""
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Doctor
        fields = '__all__'

    def create(self, validated_data):
        # Create a new doctor profile with associated user and patients
        user_data = validated_data.pop('user')
        patients_data = validated_data.pop('patients', [])
        user = UserSerializer().create(user_data)
        doctor = Doctor.objects.create(user=user, **validated_data)
        doctor.patients.set(patients_data)
        return doctor

class DoctorNoteSerializer(serializers.ModelSerializer):
    """Serializer for doctor's notes with doctor name"""
    doctor_name = serializers.SerializerMethodField()

    class Meta:
        model = DoctorNote
        fields = ['id', 'note', 'date', 'doctor_name', 'doctor', 'health_record']
        read_only_fields = ('doctor', 'health_record', 'doctor_name')

    def get_doctor_name(self, obj):
        # Get the doctor's full name or username as fallback
        return obj.doctor.user.get_full_name() or obj.doctor.user.username

class HealthRecordSerializer(serializers.ModelSerializer):
    """Serializer for health records with nested doctor notes"""
    doctor_notes = DoctorNoteSerializer(many=True, read_only=True)

    class Meta:
        model = HealthRecord
        fields = ['id', 'title', 'description', 'date', 'patient', 'doctor_notes']
        read_only_fields = ('patient',) 