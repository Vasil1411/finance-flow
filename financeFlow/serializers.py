from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from financeFlow.models import Category, Transaction, Budget, SavingGoal
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


# 1. New user registration (with secure password hashing)
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    email = serializers.EmailField(required=True)
    username = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password']
        )
        return user


# 2. Categories (Supports Create, Read, Update, Delete)
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'type', 'allocation_type']
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# 3. Transactions (Supports Create, Read, Update, Delete with receipt file & saving goal support)
class TransactionSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    saving_goal_name = serializers.CharField(source='saving_goal.name', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id',
            'category',
            'category_name',
            'saving_goal',
            'saving_goal_name',
            'amount',
            'type',
            'date',
            'description',
            'receipt_file',
            'items',
            'created_at',
        ]
        read_only_fields = ['user', 'created_at']
        extra_kwargs = {
            'saving_goal': {'required': False, 'allow_null': True},
            'receipt_file': {'required': False, 'allow_null': True},
            'items': {'required': False, 'allow_null': True},
        }

    def validate(self, data):
        request = self.context.get('request')
        if not request:
            return data

        user = request.user
        category = data.get('category')
        saving_goal = data.get('saving_goal')
        transaction_type = data.get('type')

        if category:
            if category.user != user:
                raise serializers.ValidationError({"category": "This category does not belong to the user."})
            if transaction_type and category.type != transaction_type:
                raise serializers.ValidationError({"category": "Category type does not match transaction type."})

        if saving_goal and saving_goal.user != user:
            raise serializers.ValidationError({"saving_goal": "This saving goal does not belong to the user."})

        return data

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)


# 4. Budgets (Supports Create, Read, Update, Delete)
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


# 5. Saving Goals (Supports Create, Read, Update, Delete)
class SavingGoalSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavingGoal
        fields = ['id', 'name', 'target_amount', 'current_amount', 'deadline', 'is_completed']
        read_only_fields = ['user']

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email_input = attrs.get("username")
        password = attrs.get("password")

        if email_input and password:
            try:
                user_obj = User.objects.get(email=email_input)
                user = authenticate(username=user_obj.username, password=password)
            except User.DoesNotExist:
                user = None

            if not user:
                raise serializers.ValidationError("No active account found with the given credentials")

            refresh = self.get_token(user)
            data = {}
            data['access'] = str(refresh.access_token)
            data['refresh'] = str(refresh)
            data['username'] = user.username
            data['email'] = user.email
            data['is_staff'] = user.is_staff
            return data

        raise serializers.ValidationError("Must include 'username' (email) and 'password'")