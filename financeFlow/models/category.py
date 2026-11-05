from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    TRANSACTION_TYPES = (
        ('INCOME', 'Приход'),
        ('EXPENSE', 'Разход'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='categories')
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)

    class Meta:
        verbose_name_plural = "Categories"
        unique_together = ('user', 'name', 'type')

    def __str__(self):
        return f"{self.name} [{self.get_type_display()}]"