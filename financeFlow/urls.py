from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from financeFlow.views import (
    RegisterView,
    CategoryViewSet,
    TransactionViewSet,
    BudgetViewSet,
    SavingGoalViewSet,
)


# 1. Initialize the DefaultRouter for our modular ViewSets (CRUD)
router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'budgets', BudgetViewSet, basename='budget')
router.register(r'saving-goals', SavingGoalViewSet, basename='saving-goal')

urlpatterns = [
    path('admin/', admin.site.urls),

# 2. Authentication endpoints
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 3. Automatically generated CRUD endpoints (categories, transactions, budgets, saving-goals)
    path('', include(router.urls)),

    
]
