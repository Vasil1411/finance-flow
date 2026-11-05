from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from .category import Category

class Budget(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='budgets')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='budgets')
    amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'), message="Budget amount must be at least 0.01.")]
    )
    month = models.DateField()

    class Meta:
        unique_together = ('user', 'category', 'month')

    def clean(self):
        super().clean()
        if self.category and self.category.type != 'EXPENSE':
            raise ValidationError({'category': "Budget can only be set for categories of type 'Expense'."})
        if self.category and self.category.user != self.user:
            raise ValidationError({'category': "This category does not belong to the user."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Budget for {self.category.name}: {self.amount}"