from rest_framework import generics
from django.contrib.auth.models import User
from financeFlow.serializers import RegisterSerializer
from rest_framework.permissions import AllowAny

# View for user registration (accessible to anyone)
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]