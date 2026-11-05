from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from financeFlow.models import SavingGoal
from financeFlow.serializers import SavingGoalSerializer

class SavingGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return saving goals belonging only to the authenticated user
        return SavingGoal.objects.filter(user=self.request.user)