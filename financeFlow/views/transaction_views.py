import json
from decimal import Decimal
from datetime import date
from django.db.models import Q
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from financeFlow.models import Transaction, Budget
from financeFlow.serializers import TransactionSerializer, BudgetSerializer
from django.conf import settings
from google import genai   
from google.genai import types

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Връща транзакциите само на лотнатия потребител
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
        # Обработваме сурови данни или FormData, включително евентуални "items" пратени като JSON стринг
        items_raw = self.request.data.get('items')
        parsed_items = []
        if items_raw:
            if isinstance(items_raw, str):
                try:
                    parsed_items = json.loads(items_raw)
                except json.JSONDecodeError:
                    parsed_items = []
            elif isinstance(items_raw, list):
                parsed_items = items_raw

        serializer.save(user=self.request.user, items=parsed_items)

    def perform_update(self, serializer):
        items_raw = self.request.data.get('items')
        parsed_items = None
        if items_raw is not None:
            if isinstance(items_raw, str):
                try:
                    parsed_items = json.loads(items_raw)
                except json.JSONDecodeError:
                    parsed_items = []
            elif isinstance(items_raw, list):
                parsed_items = items_raw

        if parsed_items is not None:
            serializer.save(items=parsed_items)
        else:
            serializer.save()

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
                    from PIL import Image
                    import io
                    
                    img = Image.open(io.BytesIO(file_bytes))
                    img.verify()
                    
                    img = Image.open(io.BytesIO(file_bytes))
                    img.thumbnail((1280, 1280)) # Смачква огромните снимки от телефон
                    
                    output = io.BytesIO()
                    if img.mode in ("RGBA", "P"):
                        img = img.convert("RGB")
                    img.save(output, format="JPEG", quality=80)
                    file_bytes = output.getvalue()
                    mime_type = "image/jpeg"
                except Exception:
                    pass # Ако не успее, праща оригиналния файл
            # ---------------------------------------------------------

            api_key = getattr(settings, 'GEMINI_API_KEY', None)
            
            # ТУК Е ФИКСЪТ: Таймаутът се слага при инициализацията на Клиента!
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
                "  * 'quantity': number (quantity of the item, default to 1 if not specified)." )

            models_to_try = [
                'gemini-3.8-flash',
                'gemini-3.5-flash-lite',
                'gemini-3.1-flash-lite'
            ]
            
            raw_response_text = None
            last_error = None

            for model_name in models_to_try:
                try:
                    # МАХНАТ Е http_options от тук, за да не чупи заявката
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[image_part, prompt],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.2
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