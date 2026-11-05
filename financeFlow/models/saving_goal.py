from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator

class SavingGoal(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='saving_goals')
    name = models.CharField(max_length=150)
    target_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'), message="Target amount must be at least 0.01.")]
    )
    current_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0.00,
        validators=[MinValueValidator(Decimal('0.00'), message="Current amount cannot be negative.")]
    )
    deadline = models.DateField(blank=True, null=True)
    is_completed = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        if self.current_amount >= self.target_amount:
            self.is_completed = True
        else:
            self.is_completed = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Goal: {self.name} ({self.current_amount}/{self.target_amount})"