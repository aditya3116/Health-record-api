# Created by: Aadit
# Date: May 2025
# Description: API Views for the Health Record Management System
# This file handles all the API endpoints and business logic

from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth.models import User, Group
from .models import Patient, Doctor, HealthRecord, DoctorNote
from .serializers import (
    PatientSerializer, DoctorSerializer,
    HealthRecordSerializer, DoctorNoteSerializer,
    UserSerializer
)
from rest_framework import serializers

class IsPatientOwner(permissions.BasePermission):
    """Custom permission to only allow patients to access their own records"""
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class IsDoctorOwner(permissions.BasePermission):
    """Custom permission to only allow doctors to access their own profile"""
    def has_object_permission(self, request, view, obj):
        return obj.user == request.user

class PatientViewSet(viewsets.ModelViewSet):
    """ViewSet for managing patient data and records"""
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated, IsPatientOwner]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['get'])
    def health_records(self, request, pk=None):
        """Get all health records for a specific patient"""
        patient = self.get_object()
        records = HealthRecord.objects.filter(patient=patient)
        serializer = HealthRecordSerializer(records, many=True)
        return Response(serializer.data)

class DoctorViewSet(viewsets.ModelViewSet):
    """ViewSet for managing doctor profiles and their patient relationships"""
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated, IsDoctorOwner]

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=False, methods=['get'])
    def patients(self, request):
        """Get all patients assigned to the logged-in doctor"""
        doctor = request.user.doctor
        patients = doctor.patients.all()
        serializer = PatientSerializer(patients, many=True)
        return Response(serializer.data)

class HealthRecordViewSet(viewsets.ModelViewSet):
    """ViewSet for managing health records with proper access control"""
    serializer_class = HealthRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Filter records based on user type (patient or doctor)"""
        user = self.request.user
        if hasattr(user, 'patient'):
            return HealthRecord.objects.filter(patient=user.patient)
        elif hasattr(user, 'doctor'):
            return HealthRecord.objects.filter(patient__in=user.doctor.patients.all())
        return HealthRecord.objects.none()

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user.patient)

class DoctorNoteViewSet(viewsets.ModelViewSet):
    """ViewSet for managing doctor notes on health records"""
    serializer_class = DoctorNoteSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """Get notes for a specific health record"""
        record_id = self.kwargs.get('record_id')
        if record_id:
            return DoctorNote.objects.filter(health_record_id=record_id)
        return DoctorNote.objects.none()

    def perform_create(self, serializer):
        """Create a new note with proper validation"""
        try:
            record_id = self.kwargs.get('record_id')
            health_record = get_object_or_404(HealthRecord, id=record_id)
            
            # Verify the doctor has access to this patient's record
            if not hasattr(self.request.user, 'doctor'):
                raise serializers.ValidationError({"error": "Only doctors can add notes"})
            
            doctor = self.request.user.doctor
            if health_record.patient not in doctor.patients.all():
                raise serializers.ValidationError(
                    {"error": "You don't have permission to add notes to this patient's record"}
                )
            
            serializer.save(
                doctor=doctor,
                health_record=health_record
            )
        except HealthRecord.DoesNotExist:
            raise serializers.ValidationError({"error": "Health record not found"})
        except Exception as e:
            raise serializers.ValidationError({"error": str(e)})

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user (patient or doctor) with proper role assignment"""
    serializer = UserSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        user_type = request.data.get('user_type', 'patient')
        
        if user_type == 'patient':
            # Create patient profile
            patient = Patient.objects.create(user=user)
            group = Group.objects.get_or_create(name='Patient')[0]
            
            # Get and assign doctor if doctor_id is provided
            doctor_id = request.data.get('doctor_id')
            if not doctor_id:
                return Response(
                    {'error': 'Doctor selection is required for patient registration'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                doctor = Doctor.objects.get(id=doctor_id)
                doctor.patients.add(patient)
                print(f"Assigned patient {patient.user.username} to doctor {doctor.user.username}")
            except Doctor.DoesNotExist:
                return Response(
                    {'error': 'Selected doctor not found'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        else:
            Doctor.objects.create(user=user)
            group = Group.objects.get_or_create(name='Doctor')[0]
        
        user.groups.add(group)
        return Response({
            'message': 'User registered successfully',
            'user_type': user_type,
            'username': user.username,
            'doctor': doctor.user.username if user_type == 'patient' and 'doctor' in locals() else None
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_type(request):
    """Get the type of the logged-in user (patient or doctor)"""
    user = request.user
    if user.groups.filter(name='Doctor').exists():
        return Response({'user_type': 'doctor'})
    elif user.groups.filter(name='Patient').exists():
        return Response({'user_type': 'patient'})
    return Response({'user_type': 'unknown'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_patient_records(request, patient_id):
    """Get all health records for a specific patient (doctor access only)"""
    user = request.user
    if not user.groups.filter(name='Doctor').exists():
        return Response({'error': 'Only doctors can view patient records'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Get the patient and verify they are assigned to this doctor
        doctor = user.doctor
        patient = get_object_or_404(Patient, id=patient_id, doctors=doctor)
        records = HealthRecord.objects.filter(patient=patient)
        serializer = HealthRecordSerializer(records, many=True)
        return Response(serializer.data)
    except Patient.DoesNotExist:
        return Response(
            {'error': 'Patient not found or not assigned to you'},
            status=status.HTTP_404_NOT_FOUND
        )

@api_view(['GET'])
@permission_classes([AllowAny])
def get_available_doctors(request):
    """Get a list of all available doctors for patient registration"""
    try:
        # Get users in the Doctor group
        doctor_group = Group.objects.get(name='Doctor')
        doctors = Doctor.objects.filter(user__groups=doctor_group)
        
        # Serialize the doctors with their user information
        doctors_data = []
        for doctor in doctors:
            doctors_data.append({
                'id': doctor.id,
                'username': doctor.user.username,
                'email': doctor.user.email
            })
        
        return Response(doctors_data, status=status.HTTP_200_OK)
    except Group.DoesNotExist:
        return Response({'error': 'Doctor group not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 