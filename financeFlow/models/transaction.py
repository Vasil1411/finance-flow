from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from .category import Category

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='transactions')
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'), message="Sum must be at least 0.01.")]
    )
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    date = models.DateField()
    description = models.TextField(blank=True, null=True)
    
    # 🧾 Поле за прикачена бележка / фактура (картинка или PDF)
    receipt_file = models.FileField(upload_to='receipts/', null=True, blank=True)
    
    # 🛒 Ново поле за съхранение на артикулите, цените и отстъпките (във формат JSON)
    items = models.JSONField(default=list, blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        super().clean()
        if self.category and self.category.user != self.user:
            raise ValidationError({'category': "This category does not belong to the user."})
        if self.category and self.category.type != self.type:
            raise ValidationError({'category': "The type of the category does not match the type of the transaction."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.type}: {self.amount} ({self.date})"