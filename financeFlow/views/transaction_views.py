from django.db.models import Q
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from financeFlow.models import Transaction, Budget
from financeFlow.serializers import TransactionSerializer, BudgetSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return transactions belonging only to the authenticated user
        queryset = Transaction.objects.filter(user=self.request.user)

        # 1. Filter by date range (start_date and end_date) or by month (for example ?month=2025-05)
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        month = self.request.query_params.get('month')  

        if start_date and end_date:
            queryset = queryset.filter(date__gte=start_date, date__lte=end_date)
        elif month:
            queryset = queryset.filter(date__startswith=month)

        # 2. Filter by category (by ID)
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        # 3. Filter by type (INCOME / EXPENSE)
        transaction_type = self.request.query_params.get('type')
        if transaction_type and transaction_type.upper() != 'ALL':
            queryset = queryset.filter(type=transaction_type.upper())


        return queryset.order_by('-date')


