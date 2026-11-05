from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from financeFlow.models import Transaction
from financeFlow.serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return transactions belonging only to the authenticated user
        return Transaction.objects.filter(user=self.request.user)