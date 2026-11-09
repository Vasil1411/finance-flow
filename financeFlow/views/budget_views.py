from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from financeFlow.models import Budget
from financeFlow.serializers import BudgetSerializer

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return budgets belonging only to the authenticated user
        queryset = Budget.objects.filter(user=self.request.user)

        # Filter by month for the "Budgets & categories" screen (for example ?month=2025-05)
        month = self.request.query_params.get('month')
        if month:
            queryset = queryset.filter(month__startswith=month)

        return queryset