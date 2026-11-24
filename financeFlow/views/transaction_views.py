import io
import json
from decimal import Decimal

from django.conf import settings
from django.db import transaction as db_transaction
from django.db.models import Sum
from google import genai
from google.genai import types
from PIL import Image
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from financeFlow.models import Budget, Category, SavingGoal, Transaction
from financeFlow.serializers import TransactionSerializer


def _parse_items_field(request_data):
    """Връща списък с items или None, ако ключът 'items' не присъства в заявката."""
    if 'items' not in request_data:
        return None

    items_raw = request_data.get('items')
    if items_raw is None or items_raw == '':
        return []
    if isinstance(items_raw, str):
        try:
            parsed = json.loads(items_raw)
            return parsed if isinstance(parsed, list) else []
        except json.JSONDecodeError:
            return []
    if isinstance(items_raw, list):
        return items_raw
    return []


def _apply_goal_delta(goal: SavingGoal, delta: Decimal):
    """Актуализира сумата и статуса на SavingGoal безопасно."""
    updated = (goal.current_amount or Decimal('0.00')) + delta
    goal.current_amount = max(Decimal('0.00'), updated)
    if goal.target_amount is not None:
        goal.is_completed = goal.current_amount >= goal.target_amount
    goal.save()


def _validate_savings_fund_for_delta(user, tx_date, additional_amount: Decimal):
    """
    Проверява дали има достатъчно остатък в месечния SAVINGS бюджет за дадения месец
    (или в общия нетен баланс, ако за месеца няма зададен SAVINGS бюджет).
    """
    if additional_amount <= Decimal('0.00'):
        return

    month_prefix = str(tx_date or '')[:7]
    savings_categories = Category.objects.filter(
        user=user,
        type='EXPENSE',
        allocation_type='SAVINGS',
    )

    savings_budget_total = None
    if month_prefix:
        savings_budget_total = Budget.objects.filter(
            user=user,
            category__in=savings_categories,
            month__startswith=month_prefix,
        ).aggregate(total=Sum('amount'))['total']

    if savings_budget_total is not None:
        spent_in_savings = (
            Transaction.objects.filter(
                user=user,
                category__in=savings_categories,
                type='EXPENSE',
                date__startswith=month_prefix,
            ).aggregate(total=Sum('amount'))['total']
            or Decimal('0.00')
        )
        available = savings_budget_total - spent_in_savings
        if additional_amount > available:
            raise ValidationError({
                "error": "Insufficient funds in savings fund.",
                "fund_source": f"monthly_savings_budget({month_prefix})",
                "requested_amount": f"{additional_amount:.2f}",
                "available_amount": f"{max(Decimal('0.00'), available):.2f}",
            })
        return

    # Резервна проверка спрямо общия нетен баланс, ако няма зададен месечен SAVINGS бюджет
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
    net_balance = total_income - total_expenses
    if additional_amount > net_balance:
        raise ValidationError({
            "error": "Insufficient funds in savings fund.",
            "fund_source": "overall_net_balance",
            "requested_amount": f"{additional_amount:.2f}",
            "available_amount": f"{max(Decimal('0.00'), net_balance):.2f}",
        })


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Връща транзакциите само на логнатия потребител
        queryset = Transaction.objects.filter(user=self.request.user)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        month = self.request.query_params.get('month')

        if start_date and end_date:
            queryset = queryset.filter(date__gte=start_date, date__lte=end_date)
        elif month:
            queryset = queryset.filter(date__startswith=month)

        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        transaction_type = self.request.query_params.get('type')
        if transaction_type and transaction_type.upper() != 'ALL':
            queryset = queryset.filter(type=transaction_type.upper())

        return queryset.order_by('-date')

    def perform_create(self, serializer):
        parsed_items = _parse_items_field(self.request.data)
        items_to_save = parsed_items if parsed_items is not None else []

        with db_transaction.atomic():
            validated_type = serializer.validated_data.get('type')
            validated_goal = serializer.validated_data.get('saving_goal')
            validated_amount = serializer.validated_data.get('amount') or Decimal('0.00')
            validated_date = serializer.validated_data.get('date')

            if validated_type == 'EXPENSE' and validated_goal:
                _validate_savings_fund_for_delta(
                    user=self.request.user,
                    tx_date=validated_date,
                    additional_amount=validated_amount,
                )

            instance = serializer.save(user=self.request.user, items=items_to_save)

            if instance.saving_goal_id and instance.type == 'EXPENSE':
                goal = (
                    SavingGoal.objects.select_for_update()
                    .filter(pk=instance.saving_goal_id, user=self.request.user)
                    .first()
                )
                if goal:
                    _apply_goal_delta(goal, instance.amount or Decimal('0.00'))

    def perform_update(self, serializer):
        instance = serializer.instance

        old_goal_id = instance.saving_goal_id
        old_amount = instance.amount or Decimal('0.00')
        old_type = instance.type

        parsed_items = _parse_items_field(self.request.data)
        save_kwargs = {}
        if parsed_items is not None:
            save_kwargs['items'] = parsed_items

        with db_transaction.atomic():
            # 1. Заключваме и временно връщаме стария ефект върху старата цел (ако има такъв)
            if old_goal_id and old_type == 'EXPENSE':
                old_goal = (
                    SavingGoal.objects.select_for_update()
                    .filter(pk=old_goal_id, user=self.request.user)
                    .first()
                )
                if old_goal:
                    _apply_goal_delta(old_goal, -old_amount)

            # 2. Валидираме преди да запишем новата сума (при заделяне към цел)
            new_type = serializer.validated_data.get('type', instance.type)
            new_goal = serializer.validated_data.get('saving_goal', instance.saving_goal)
            new_amount = serializer.validated_data.get('amount', instance.amount) or Decimal('0.00')
            new_date = serializer.validated_data.get('date', instance.date)

            if new_type == 'EXPENSE' and new_goal:
                if old_goal_id == new_goal.id and old_type == 'EXPENSE':
                    additional_needed = new_amount - old_amount
                else:
                    additional_needed = new_amount

                if additional_needed > Decimal('0.00'):
                    _validate_savings_fund_for_delta(
                        user=self.request.user,
                        tx_date=new_date,
                        additional_amount=additional_needed,
                    )

            # 3. Записваме обновената транзакция
            updated_instance = serializer.save(**save_kwargs)

            final_goal_id = updated_instance.saving_goal_id
            final_amount = updated_instance.amount or Decimal('0.00')
            final_type = updated_instance.type

            # 4. Прилагаме новия ефект върху новата цел (ако има такъв)
            if final_goal_id and final_type == 'EXPENSE':
                new_goal_obj = (
                    SavingGoal.objects.select_for_update()
                    .filter(pk=final_goal_id, user=self.request.user)
                    .first()
                )
                if new_goal_obj:
                    _apply_goal_delta(new_goal_obj, final_amount)

    def perform_destroy(self, instance):
        with db_transaction.atomic():
            goal_id = instance.saving_goal_id
            amount = instance.amount or Decimal('0.00')
            tx_type = instance.type

            super().perform_destroy(instance)

            if goal_id and tx_type == 'EXPENSE':
                goal = (
                    SavingGoal.objects.select_for_update()
                    .filter(pk=goal_id, user=self.request.user)
                    .first()
                )
                if goal:
                    _apply_goal_delta(goal, -amount)

    @action(detail=False, methods=['POST'], url_path='parse-receipt')
    def parse_receipt(self, request):
        """
        AI-powered receipt parser using optimized multi-model Gemini fallback strategy.
        """
        uploaded_file = request.FILES.get('receipt_file')

        if not uploaded_file:
            return Response(
                {"error": "No file provided. Please upload an image or PDF."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            file_bytes = uploaded_file.read()
            file_name = uploaded_file.name.lower()

            mime_type = "image/jpeg"
            if file_name.endswith('.png'):
                mime_type = "image/png"
            elif file_name.endswith('.pdf'):
                mime_type = "application/pdf"

            # ---- ОПТИМИЗАЦИЯ С PILLOW (За да не чакате 2 минути) ----
            if not file_name.endswith('.pdf'):
                try:
                    img = Image.open(io.BytesIO(file_bytes))
                    img.verify()

                    img = Image.open(io.BytesIO(file_bytes))
                    img.thumbnail((1280, 1280))  # Смачква огромните снимки от телефон

                    output = io.BytesIO()
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    img.save(output, format="JPEG", quality=80)
                    file_bytes = output.getvalue()
                    mime_type = "image/jpeg"
                except Exception:
                    pass  # Ако не успее, праща оригиналния файл
            # ---------------------------------------------------------

            api_key = getattr(settings, 'GEMINI_API_KEY', None)

            client = genai.Client(
                api_key=api_key,
                http_options={'timeout': 15000}
            )

            image_part = types.Part.from_bytes(
                data=file_bytes,
                mime_type=mime_type
            )

            prompt = (
                "Analyze this receipt or invoice image/document thoroughly. "
                "Extract the details and return them STRICTLY as a valid JSON object (no markdown, just raw JSON) with these exact keys:\n"
                "- 'amount': string representing the total final amount (e.g., '11.39')\n"
                "- 'type': always 'EXPENSE'\n"
                "- 'date': transaction date in YYYY-MM-DD format (if missing, use today's date)\n"
                "- 'description': merchant or company name (e.g., 'VIVACOM' or 'Лидл България')\n"
                "- 'items': a list of objects for every individual product or line item, each containing:\n"
                "  * 'name': string (product name)\n"
                "  * 'price': string (final price paid for the item)\n"
                "  * 'discount': string or null (the discount amount or percentage applied to this item, if explicitly written on the receipt; otherwise null or '0')\n"
                "  * 'quantity': number (quantity of the item, default to 1 if not specified)."
            )

            models_to_try = [
                'gemini-2.5-flash-lite',
                'gemini-3.1-flash-lite',
                'gemini-3.8-flash',
                'gemini-3.7-flash',
                'gemini-3.6-flash',
                'gemini-3.5-flash',
                'gemini-3.5-flash-lite',
                'gemini-4-argon'
            ]

            raw_response_text = None
            last_error = None

            for model_name in models_to_try:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[image_part, prompt],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.1,
                            max_output_tokens=4096
                        )
                    )
                    if response and response.text:
                        raw_response_text = response.text
                        break
                except Exception as model_err:
                    last_error = model_err
                    continue

            if not raw_response_text:
                raise Exception(f"All fallback models failed. Last error: {last_error}")

            parsed_data = json.loads(raw_response_text)
            parsed_data["message"] = "File successfully parsed!"

            return Response(parsed_data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {
                    "error": "AI parsing failed.",
                    "details": str(e)
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )