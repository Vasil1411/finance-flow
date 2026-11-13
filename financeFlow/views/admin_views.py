from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from django.contrib.auth.models import User
from rest_framework import serializers
from financeFlow.models import Transaction, Budget, SavingGoal

# Сериалайзър само за показване на потребителите и броя техните транзакции
class AdminUserListSerializer(serializers.ModelSerializer):
    transactions_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'date_joined', 'transactions_count']

    def get_transactions_count(self, obj):
        return Transaction.objects.filter(user=obj).count()

# 1. Ендпойнт за общите статистики
class AdminDashboardStatsView(APIView):
    permission_classes = [IsAdminUser] # Само за админи (is_staff = True)

    def get(self, request):
        return Response({
            "total_users": User.objects.count(),
            "active_users": User.objects.filter(is_active=True).count(),
            "total_transactions": Transaction.objects.count(),
            "total_budgets": Budget.objects.count(),
            "total_goals": SavingGoal.objects.count(),
        })

# 2. Ендпойнт за списъка с потребители
class AdminUserListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = User.objects.all().order_by('-date_joined')
        serializer = AdminUserListSerializer(users, many=True)
        return Response(serializer.data)