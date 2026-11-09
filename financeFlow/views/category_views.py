from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from financeFlow.models import Category
from financeFlow.serializers import CategorySerializer

class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return categories belonging only to the authenticated user
        queryset = Category.objects.filter(user=self.request.user)
        
        # Filter by allocation_type (for example ?allocation_type=NEEDS)
        allocation_type = self.request.query_params.get('allocation_type')
        if allocation_type and allocation_type.upper() != 'ALL':
            queryset = queryset.filter(allocation_type=allocation_type.upper())
            
        return queryset