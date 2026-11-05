from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    # Transaction types (Income or Expense)
    TRANSACTION_TYPES = (
        ('INCOME', 'Приход'),
        ('EXPENSE', 'Разход'),
    )

    # 50/30/20 Budgeting Rule choices
    RULE_CHOICES = (
        ('NEED', 'Needs (50%)'),
        ('WANT', 'Wants (30%)'),
        ('SAVINGS', 'Savings (20%)'),
        ('NONE', 'None / Income'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    
    # 50/30/20 rule allocation category type
    allocation_type = models.CharField(
        max_length=10, 
        choices=RULE_CHOICES, 
        default='NONE'
    )

    class Meta:
        verbose_name_plural = "Categories"
        unique_together = ('user', 'name', 'type')

    def __str__(self):
        return f"{self.name} [{self.get_type_display()}] - {self.get_allocation_type_display()}"