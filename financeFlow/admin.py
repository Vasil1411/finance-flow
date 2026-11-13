# financeFlow/admin.py
from django.contrib import admin
from .models import Transaction, Budget, SavingGoal, Category

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'amount', 'type', 'date', 'description')
    list_filter = ('type', 'date', 'user')
    search_fields = ('description', 'user__email')

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'type', 'user')
    list_filter = ('type', 'user')

from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin

# Ако искаш да персонализираш как изглеждат потребителите в админа:
admin.site.unregister(User) # Извличаме дефолтния изглед
@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email')


admin.site.register(Budget)
admin.site.register(SavingGoal)