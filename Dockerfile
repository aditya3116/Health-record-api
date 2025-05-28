FROM public.ecr.aws/lambda/python:3.11

# Copy requirements file
COPY requirements.txt ${LAMBDA_TASK_ROOT}

# Install the specified packages
RUN pip install -r requirements.txt

# Copy your Django application
COPY . ${LAMBDA_TASK_ROOT}

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_SETTINGS_MODULE=health_record_api.settings_prod

# Create static files directory
RUN mkdir -p ${LAMBDA_TASK_ROOT}/staticfiles

# Collect static files
RUN python manage.py collectstatic --noinput --clear

# Set permissions for Lambda execution
RUN chmod -R 755 ${LAMBDA_TASK_ROOT}/staticfiles

# Set the CMD to your handler
CMD [ "lambda_handler.lambda_handler" ] 