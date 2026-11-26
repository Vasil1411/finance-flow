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


def _parse_year_month(date_str: str):
    """Очаква YYYY-MM или YYYY-MM-DD и връща (year_int, month_int, 'YYYY-MM')."""
    parts = date_str.split('-')
    if len(parts) < 2 or not (parts[0].isdigit() and parts[1].isdigit()):
        raise ValueError("Invalid date format")
    year_int = int(parts[0])
    month_int = int(parts[1])
    if not (1 <= month_int <= 12):
        raise ValueError("Month out of range")
    return year_int, month_int, f"{year_int:04d}-{month_int:02d}"


def _calculate_all_time_reserve(user):
    """
    Изчислява свободния натрупан резерв (All-Time) от всички приходи минус всички разходи,
    както и общата сума, вече разпределена в спестовни цели.
    """
    total_income = (
        Transaction.objects.filter(user=user, type='INCOME')
        .aggregate(total=Sum('amount'))['total']
        or Decimal('0.00')
    )
    total_expenses = (
        Transaction.objects.filter(user=user, type='EXPENSE')
        .aggregate(total=Sum('amount'))['total']
        or Decimal('0.00')
    )
    allocated_in_goals = (
        SavingGoal.objects.filter(user=user)
        .aggregate(total=Sum('current_amount'))['total']
        or Decimal('0.00')
    )
    free_reserve = total_income - total_expenses
    return {
        "total_income_all_time": total_income,
        "total_expenses_all_time": total_expenses,
        "free_reserve": free_reserve,
        "allocated_in_goals": allocated_in_goals,
        "total_wealth_with_goals": free_reserve + allocated_in_goals,
    }


class SavingGoalViewSet(viewsets.ModelViewSet):
    serializer_class = SavingGoalSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SavingGoal.objects.filter(user=self.request.user)

    @action(detail=False, methods=['GET'], url_path='reserve-summary')
    def reserve_summary(self, request):
        stats = _calculate_all_time_reserve(request.user)
        return Response(
            {
                "free_reserve": f"{stats['free_reserve']:.2f}",
                "allocated_in_goals": f"{stats['allocated_in_goals']:.2f}",
                "total_wealth_with_goals": f"{stats['total_wealth_with_goals']:.2f}",
                "total_income_all_time": f"{stats['total_income_all_time']:.2f}",
                "total_expenses_all_time": f"{stats['total_expenses_all_time']:.2f}",
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=['POST'], url_path='contribute')
    def contribute(self, request, pk=None):
        goal_lookup = self.get_object()
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
        try:
            year_int, month_int, month_prefix = _parse_year_month(tx_date_str)
        except ValueError:
            return Response(
                {"error": "Invalid 'date' format. Use YYYY-MM-DD."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        description = request.data.get('description') or f"Contribution to goal: {goal_lookup.name}"

        create_tx = request.data.get('create_transaction', True)
        if isinstance(create_tx, str):
            create_tx = create_tx.lower() in ('true', '1', 'yes')

        force_override = request.data.get('force', False)
        if isinstance(force_override, str):
            force_override = force_override.lower() in ('true', '1', 'yes')

        use_reserve = request.data.get('use_reserve', False)
        if isinstance(use_reserve, str):
            use_reserve = use_reserve.lower() in ('true', '1', 'yes')

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

        created_transaction = None

        with db_transaction.atomic():
            goal = (
                SavingGoal.objects.select_for_update()
                .filter(pk=goal_lookup.pk, user=request.user)
                .first()
            )
            if not goal:
                return Response(
                    {"error": "Saving goal not found."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            reserve_stats = _calculate_all_time_reserve(request.user)
            all_time_reserve = reserve_stats["free_reserve"]

            available_in_monthly_fund = None
            fund_source = None

            if savings_category:
                monthly_budget = (
                    Budget.objects.select_for_update()
                    .filter(
                        user=request.user,
                        category=savings_category,
                        month__year=year_int,
                        month__month=month_int,
                    )
                    .first()
                )

                if monthly_budget:
                    spent_in_fund = (
                        Transaction.objects.filter(
                            user=request.user,
                            category=savings_category,
                            type='EXPENSE',
                            date__year=year_int,
                            date__month=month_int,
                        ).aggregate(total=Sum('amount'))['total']
                        or Decimal('0.00')
                    )
                    available_in_monthly_fund = max(
                        Decimal('0.00'),
                        (monthly_budget.amount or Decimal('0.00')) - spent_in_fund,
                    )
                    fund_source = f"monthly_budget:{savings_category.name}({month_prefix})"

            # 1. Потребителят изрично избира да тегли от All-Time резерва
            if use_reserve:
                if amount > all_time_reserve and not force_override:
                    return Response(
                        {
                            "error": "Insufficient funds in your All-Time savings reserve.",
                            "fund_source": "all_time_reserve",
                            "requested_amount": f"{amount:.2f}",
                            "available_amount": f"{max(Decimal('0.00'), all_time_reserve):.2f}",
                            "can_use_reserve": False,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                fund_source = "all_time_reserve"
                if "[From All-Time Reserve]" not in description:
                    description = f"{description} [From All-Time Reserve]"
                remaining_after = all_time_reserve - amount

            # 2. Стандартен поток: проверка на месечния SAVINGS бюджет (ако съществува)
            elif available_in_monthly_fund is not None:
                if amount > available_in_monthly_fund and not force_override:
                    can_cover_from_reserve = amount <= all_time_reserve
                    return Response(
                        {
                            "error": "Insufficient funds in savings fund.",
                            "fund_source": fund_source,
                            "requested_amount": f"{amount:.2f}",
                            "available_amount": f"{available_in_monthly_fund:.2f}",
                            "reserve_available": f"{max(Decimal('0.00'), all_time_reserve):.2f}",
                            "can_use_reserve": can_cover_from_reserve,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                remaining_after = available_in_monthly_fund - amount

            # 3. Няма месечен бюджет -> проверяваме директно All-Time резерва
            else:
                fund_source = "all_time_reserve"
                if amount > all_time_reserve and not force_override:
                    return Response(
                        {
                            "error": "Insufficient funds in your All-Time savings reserve.",
                            "fund_source": fund_source,
                            "requested_amount": f"{amount:.2f}",
                            "available_amount": f"{max(Decimal('0.00'), all_time_reserve):.2f}",
                            "can_use_reserve": False,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                remaining_after = all_time_reserve - amount

            goal.current_amount = (goal.current_amount or Decimal('0.00')) + amount
            if goal.target_amount and goal.current_amount >= goal.target_amount:
                goal.is_completed = True
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

        updated_reserve = _calculate_all_time_reserve(request.user)

        return Response(
            {
                "goal": SavingGoalSerializer(goal, context={'request': request}).data,
                "contribution_amount": f"{amount:.2f}",
                "fund_source": fund_source,
                "remaining_fund_after": f"{remaining_after:.2f}",
                "reserve_remaining": f"{updated_reserve['free_reserve']:.2f}",
                "savings_category_used": savings_category.name if savings_category else None,
                "transaction": (
                    TransactionSerializer(created_transaction, context={'request': request}).data
                    if created_transaction
                    else None
                ),
            },
            status=status.HTTP_200_OK,
        )