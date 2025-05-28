# Health Record API

A secure REST API for managing personal health records built with Django and Django REST Framework.

## Features

- Token-based authentication with short-lived tokens (5 minutes)
- Patient registration and management
- Doctor registration and management
- Health record creation and management
- Doctor notes and annotations
- Automatic doctor notifications for new patient assignments
- Strict access control for sensitive health data

## Setup

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `.\venv\Scripts\activate`
   - Unix/MacOS: `source venv/bin/activate`
4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
5. Apply database migrations:
   ```bash
   python manage.py migrate
   ```
6. Create a superuser (optional):
   ```bash
   python manage.py createsuperuser
   ```
7. Run the development server:
   ```bash
   python manage.py runserver
   ```

## API Endpoints

### Authentication
- `POST /api/token/`: Obtain JWT token pair
- `POST /api/token/refresh/`: Refresh access token

### Patients
- `GET /api/patients/`: List all patients (authenticated)
- `POST /api/patients/`: Create new patient
- `GET /api/patients/{id}/`: Get patient details
- `PUT /api/patients/{id}/`: Update patient details
- `DELETE /api/patients/{id}/`: Delete patient
- `GET /api/patients/{id}/health-records/`: Get patient's health records

### Doctors
- `GET /api/doctors/`: List all doctors (authenticated)
- `POST /api/doctors/`: Create new doctor
- `GET /api/doctors/{id}/`: Get doctor details
- `PUT /api/doctors/{id}/`: Update doctor details
- `DELETE /api/doctors/{id}/`: Delete doctor
- `GET /api/doctors/{id}/patients/`: Get doctor's patients

### Health Records
- `GET /api/health-records/`: List health records (filtered by user type)
- `POST /api/health-records/`: Create new health record
- `GET /api/health-records/{id}/`: Get health record details
- `PUT /api/health-records/{id}/`: Update health record
- `DELETE /api/health-records/{id}/`: Delete health record

### Doctor Notes
- `GET /api/doctor-notes/`: List doctor notes
- `POST /api/doctor-notes/`: Create new doctor note
- `GET /api/doctor-notes/{id}/`: Get note details
- `PUT /api/doctor-notes/{id}/`: Update note
- `DELETE /api/doctor-notes/{id}/`: Delete note

## Security Features

- JWT authentication with short-lived tokens (5 minutes)
- Permission-based access control
- Secure handling of sensitive data
- Token refresh mechanism
- Doctor-patient relationship validation

## Development

1. Make sure to follow PEP 8 style guide
2. Write tests for new features
3. Update documentation when adding new endpoints

## Production Deployment

Before deploying to production:

1. Change `DEBUG = False` in settings
2. Configure proper email settings
3. Set up proper CORS settings
4. Use environment variables for sensitive data
5. Set up proper database (PostgreSQL recommended)
6. Configure proper static files serving
7. Set up proper logging

# Health Records API - AWS Lambda Deployment

This Django application is configured to run as a container image on AWS Lambda.

## Prerequisites

1. AWS CLI installed and configured
2. Docker installed
3. Access to an AWS account with necessary permissions

## Building and Deploying

1. Build the Docker image:
```bash
docker build -t health-records-api .
```

2. Create a repository in Amazon ECR:
```bash
aws ecr create-repository --repository-name health-records-api
```

3. Authenticate Docker to your Amazon ECR registry:
```bash
aws ecr get-login-password --region your-region | docker login --username AWS --password-stdin your-account-id.dkr.ecr.your-region.amazonaws.com
```

4. Tag your image:
```bash
docker tag health-records-api:latest your-account-id.dkr.ecr.your-region.amazonaws.com/health-records-api:latest
```

5. Push the image to ECR:
```bash
docker push your-account-id.dkr.ecr.your-region.amazonaws.com/health-records-api:latest
```

## Lambda Configuration

1. Create a new Lambda function:
   - Choose "Container image" as the deployment package type
   - Select the image you pushed to ECR
   - Set the memory to at least 512MB
   - Set the timeout to at least 30 seconds

2. Configure environment variables in Lambda:
   - DJANGO_SETTINGS_MODULE=health_records.settings
   - DATABASE_URL=your-database-url
   - SECRET_KEY=your-secret-key
   - ALLOWED_HOSTS=your-api-gateway-url

3. Set up an API Gateway:
   - Create a new HTTP API
   - Add an integration with your Lambda function
   - Deploy the API

