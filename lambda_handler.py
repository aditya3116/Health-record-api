import os
from mangum import Mangum
from aws_lambda_powertools import Logger
from health_record_api.wsgi import application

# Configure logging
logger = Logger()

# Create the Mangum handler
handler = Mangum(application, lifespan="off")

@logger.inject_lambda_context
def lambda_handler(event, context):
    """
    AWS Lambda handler for Django application
    """
    try:
        # Log the incoming event
        logger.info("Received event", extra={"event": event})
        
        # Handle the request using Mangum
        response = handler(event, context)
        
        # Log the response
        logger.info("Response generated", extra={"status_code": response.get("statusCode")})
        
        return response
    except Exception as e:
        logger.exception("Error processing request")
        raise 