from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    PatientViewSet,
    DoctorViewSet,
    HealthRecordViewSet,
    DoctorNoteViewSet,
    register_user,
    get_user_type,
    get_patient_records,
    get_available_doctors
)

router = DefaultRouter()
router.register(r'patients', PatientViewSet)
router.register(r'doctors', DoctorViewSet)
router.register(r'health-records', HealthRecordViewSet, basename='health-records')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', register_user, name='register'),
    path('user-type/', get_user_type, name='user_type'),
    path('patient-records/<int:patient_id>/', get_patient_records, name='patient_records'),
    path('available-doctors/', get_available_doctors, name='available-doctors'),
    path('health-records/<int:record_id>/notes/', DoctorNoteViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='health-record-notes'),
] 