from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from financeFlow.models import Category, Transaction, Budget, SavingGoal


# 1. New user registration (with secure password hashing)
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']


    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user




# 3. Categories (Supports Create, Read, Update, Delete)
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'allocation_type']
        read_only_fields = ['user']  # User is automatically assigned from the request

    def create(self, validated_data):
        # Automatically assign the currently authenticated user to the category
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
   


# 4. Transactions (Supports Create, Read, Update, Delete with validation)
class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Transaction
        fields = ['id', 'category', 'category_name', 'amount', 'type', 'date', 'description', 'created_at']
        read_only_fields = ['user', 'created_at']

    def validate(self, data):
        user = self.context['request'].user
        category = data.get('category')
        transaction_type = data.get('type')

        if category:
            if category.user != user:
                raise serializers.ValidationError({"category": "This category does not belong to the user."})
            if category.type != transaction_type:
                raise serializers.ValidationError({"category": "Category type does not match transaction type."})
        
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# 5. Budgets (Supports Create, Read, Update, Delete)
class BudgetSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Budget
        fields = ['id', 'category', 'category_name', 'amount', 'month']
        read_only_fields = ['user']

    def validate(self, data):
        user = self.context['request'].user
        category = data.get('category')

        if category:
            if category.user != user:
                raise serializers.ValidationError({"category": "This category does not belong to the user."})
            if category.type != 'EXPENSE':
                raise serializers.ValidationError({"category": "Budgets can only be set for 'Expense' categories."})
        
        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# 6. Saving Goals (Supports Create, Read, Update, Delete)
class SavingGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavingGoal
        fields = ['id', 'name', 'target_amount', 'current_amount', 'deadline', 'is_completed']
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)