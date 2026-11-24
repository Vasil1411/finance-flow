from datetime import date
from decimal import Decimal, InvalidOperation

from django.db import transaction as db_transaction
from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from financeFlow.models import Budget, Category, SavingGoal, Transaction
from financeFlow.serializers import SavingGoalSerializer, TransactionSerializer


class SavingGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavingGoal.objects.filter(user=self.request.user)

    @action(detail=True, methods=['POST'], url_path='contribute')
    def contribute(self, request, pk=None):
        goal = self.get_object()
        raw_amount = request.data.get('amount')

        try:
            amount = Decimal(str(raw_amount))
        except (InvalidOperation, TypeError, ValueError):
            return Response(
                {"error": "Invalid 'amount'. Provide a valid positive number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if amount <= Decimal('0.00'):
            return Response(
                {"error": "Contribution amount must be greater than 0.00."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        tx_date_str = str(request.data.get('date') or date.today())
        month_prefix = tx_date_str[:7]  # YYYY-MM
        description = request.data.get('description') or f"Contribution to goal: {goal.name}"

        create_tx = request.data.get('create_transaction', True)
        if isinstance(create_tx, str):
            create_tx = create_tx.lower() in ('true', '1', 'yes')

        force_override = request.data.get('force', False)
        if isinstance(force_override, str):
            force_override = force_override.lower() in ('true', '1', 'yes')

        category_id = request.data.get('category_id')
        if category_id:
            savings_category = Category.objects.filter(
                id=category_id,
                user=request.user,
                type='EXPENSE',
            ).first()
            if not savings_category:
                return Response(
                    {"error": "Category not found or is not an EXPENSE category of this user."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            savings_category = Category.objects.filter(
                user=request.user,
                type='EXPENSE',
                allocation_type='SAVINGS',
            ).first()

        # Проверка за наличност във фонда (месечен бюджет за SAVINGS категорията, ако има)
        available_in_fund = None
        fund_source = None

        if savings_category:
            monthly_budget = Budget.objects.filter(
                user=request.user,
                category=savings_category,
                month__startswith=month_prefix,
            ).first()

            if monthly_budget:
                spent_in_fund = (
                    Transaction.objects.filter(
                        user=request.user,
                        category=savings_category,
                        type='EXPENSE',
                        date__startswith=month_prefix,
                    ).aggregate(total=Sum('amount'))['total']
                    or Decimal('0.00')
                )
                available_in_fund = (monthly_budget.amount or Decimal('0.00')) - spent_in_fund
                fund_source = f"monthly_budget:{savings_category.name}({month_prefix})"

        # Ако няма зададен месечен бюджет за фонда, проверяваме общия нетен баланс
        if available_in_fund is None:
            total_income = (
                Transaction.objects.filter(user=request.user, type='INCOME')
                .aggregate(total=Sum('amount'))['total']
                or Decimal('0.00')
            )
            total_expenses = (
                Transaction.objects.filter(user=request.user, type='EXPENSE')
                .aggregate(total=Sum('amount'))['total']
                or Decimal('0.00')
            )
            available_in_fund = total_income - total_expenses
            fund_source = "overall_net_balance"

        if amount > available_in_fund and not force_override:
            return Response(
                {
                    "error": "Insufficient funds in savings fund.",
                    "fund_source": fund_source,
                    "requested_amount": f"{amount:.2f}",
                    "available_amount": f"{available_in_fund:.2f}",
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        created_transaction = None
        with db_transaction.atomic():
            goal.current_amount = (goal.current_amount or Decimal('0.00')) + amount
            goal.save()

            if create_tx:
                created_transaction = Transaction.objects.create(
                    user=request.user,
                    category=savings_category,
                    saving_goal=goal,
                    amount=amount,
                    type='EXPENSE',
                    date=tx_date_str,
                    description=description,
                )

        return Response(
            {
                "goal": SavingGoalSerializer(goal, context={'request': request}).data,
                "contribution_amount": f"{amount:.2f}",
                "fund_source": fund_source,
                "remaining_fund_after": f"{(available_in_fund - amount):.2f}",
                "savings_category_used": savings_category.name if savings_category else None,
                "transaction": (
                    TransactionSerializer(created_transaction, context={'request': request}).data
                    if created_transaction
                    else None
                ),
            },
            status=status.HTTP_200_OK,
        )