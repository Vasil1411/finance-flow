from datetime import date
from decimal import Decimal
from django.db.models import Sum
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from financeFlow.models import Budget, Category, Transaction
from financeFlow.serializers import BudgetSerializer


class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Return budgets belonging only to the authenticated user
        queryset = Budget.objects.filter(user=self.request.user)

        # Filter by month for the "Budgets & categories" screen (for example ?month=2026-11)
        month = self.request.query_params.get('month')
        if month:
            queryset = queryset.filter(month__startswith=month)

        return queryset

    @action(detail=False, methods=['GET'], url_path='summary')
    def summary(self, request):
        """
        Returns remaining budget per Budget item for a given month (?month=YYYY-MM)
        and the actual 50/30/20 allocation breakdown based on user transactions.
        """
        month_param = request.query_params.get('month')
        if not month_param:
            today = date.today()
            month_param = f"{today.year:04d}-{today.month:02d}"

        # Basic validation for YYYY-MM format
        parts = month_param.split('-')
        if len(parts) != 2 or not (parts[0].isdigit() and parts[1].isdigit()):
            return Response(
                {"error": "Invalid 'month' format. Use YYYY-MM (e.g., 2026-11)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        year_int = int(parts[0])
        month_int = int(parts[1])
        if not (1 <= month_int <= 12):
            return Response(
                {"error": "Month must be between 01 and 12."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = request.user
        month_prefix = f"{year_int:04d}-{month_int:02d}"

        # 1. Budgets & remaining amount for the selected month
        budgets_qs = (
            Budget.objects.filter(user=user, month__startswith=month_prefix)
            .select_related('category')
        )

        # Precompute expense totals per category for the month
        expense_by_category_qs = (
            Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__startswith=month_prefix,
                category__isnull=False,
            )
            .values('category_id')
            .annotate(total=Sum('amount'))
        )
        spent_map = {
            row['category_id']: (row['total'] or Decimal('0.00'))
            for row in expense_by_category_qs
        }

        budgets_summary = []
        total_budgeted = Decimal('0.00')
        total_spent_in_budgets = Decimal('0.00')

        for budget in budgets_qs:
            budget_amount = budget.amount or Decimal('0.00')
            spent_amount = spent_map.get(budget.category_id, Decimal('0.00'))
            remaining_amount = budget_amount - spent_amount
            usage_percentage = (
                round((spent_amount / budget_amount) * Decimal('100'), 2)
                if budget_amount > 0
                else Decimal('0.00')
            )

            total_budgeted += budget_amount
            total_spent_in_budgets += spent_amount

            budgets_summary.append({
                "id": budget.id,
                "category_id": budget.category_id,
                "category_name": budget.category.name,
                "allocation_type": budget.category.allocation_type,
                "month": str(budget.month),
                "budget_amount": f"{budget_amount:.2f}",
                "spent_amount": f"{spent_amount:.2f}",
                "remaining_amount": f"{remaining_amount:.2f}",
                "usage_percentage": float(usage_percentage),
                "is_exceeded": spent_amount > budget_amount,
            })

        # 2. 50/30/20 Rule breakdown for the selected month
        total_income = (
            Transaction.objects.filter(
                user=user,
                type='INCOME',
                date__startswith=month_prefix,
            ).aggregate(total=Sum('amount'))['total']
            or Decimal('0.00')
        )

        # Group expenses by category allocation_type
        allocation_totals = {
            'NEED': Decimal('0.00'),
            'WANT': Decimal('0.00'),
            'SAVINGS': Decimal('0.00'),
            'NONE': Decimal('0.00'),
        }

        expense_by_allocation_qs = (
            Transaction.objects.filter(
                user=user,
                type='EXPENSE',
                date__startswith=month_prefix,
            )
            .values('category__allocation_type')
            .annotate(total=Sum('amount'))
        )

        for row in expense_by_allocation_qs:
            alloc_key = row['category__allocation_type'] or 'NONE'
            if alloc_key not in allocation_totals:
                alloc_key = 'NONE'
            allocation_totals[alloc_key] += (row['total'] or Decimal('0.00'))

        def build_bucket(key, label, target_pct):
            amount_val = allocation_totals[key]
            pct_of_income = (
                round((amount_val / total_income) * Decimal('100'), 2)
                if total_income > 0
                else Decimal('0.00')
            )
            return {
                "key": key,
                "label": label,
                "amount": f"{amount_val:.2f}",
                "actual_percentage_of_income": float(pct_of_income),
                "target_percentage": target_pct,
                "difference_percentage": float(pct_of_income - Decimal(str(target_pct))),
            }

        rule_buckets = {
            "needs": build_bucket("NEED", "Needs (50%)", 50),
            "wants": build_bucket("WANT", "Wants (30%)", 30),
            "savings": build_bucket("SAVINGS", "Savings (20%)", 20),
            "unassigned": build_bucket("NONE", "Unassigned / None", 0),
        }

        total_expenses = sum(allocation_totals.values(), Decimal('0.00'))
        net_balance = total_income - total_expenses

        return Response(
            {
                "month": month_prefix,
                "totals": {
                    "income": f"{total_income:.2f}",
                    "expenses": f"{total_expenses:.2f}",
                    "net_balance": f"{net_balance:.2f}",
                    "total_budgeted": f"{total_budgeted:.2f}",
                    "total_spent_in_budgets": f"{total_spent_in_budgets:.2f}",
                    "total_remaining_in_budgets": f"{(total_budgeted - total_spent_in_budgets):.2f}",
                },
                "budgets": budgets_summary,
                "rule_50_30_20": rule_buckets,
            },
            status=status.HTTP_200_OK,
        )