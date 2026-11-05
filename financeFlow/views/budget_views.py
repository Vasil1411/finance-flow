from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from financeFlow.models import Budget
from financeFlow.serializers import BudgetSerializer

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return budgets belonging only to the authenticated user
        return Budget.objects.filter(user=self.request.user)