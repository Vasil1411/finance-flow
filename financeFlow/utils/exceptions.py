from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError

def custom_exception_handler(exc, context):
    """
    Custom global exception handler for Django REST Framework.
    Standardizes all error responses into a consistent JSON format.
    """
    # Call DRF's default exception handler first to get the standard error response
    response = exception_handler(exc, context)

    # If response is None, it means an unhandled exception occurred (e.g., 500 Server Error)
    if response is None:
        if isinstance(exc, DjangoValidationError):
            data = {
                "status": "error",
                "message": "Validation error occurred.",
                "errors": exc.message_dict if hasattr(exc, 'message_dict') else str(exc)
            }
            return Response(data, status=status.HTTP_400_BAD_REQUEST)
        
        # Generic unhandled server error
        data = {
            "status": "error",
            "message": "An internal server error occurred.",
            "details": str(exc)
        }
        return Response(data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Standardize DRF error response structure
    customized_response = {
        "status": "error",
        "message": "Request processing failed.",
        "errors": response.data
    }
    
    response.data = customized_response
    return response