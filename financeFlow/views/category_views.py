from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from financeFlow.models import Category
from financeFlow.serializers import CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return categories belonging only to the authenticated user
        return Category.objects.filter(user=self.request.user)