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
    SavingGoalViewSet,         # Ако ползваш имейл логин вюто от по-рано
    RequestPasswordResetView,          # 👈 НОВО: Заявка за ресет на парола
    ConfirmPasswordResetView,          # 👈 НОВО: Потвърждение и смяна на парола
    AdminUserListView,
    AdminDashboardStatsView,
)


from .serializers import MyTokenObtainPairSerializer

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer



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
    path('auth/login/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'), # или TokenObtainPairView
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # 👈 НОВО: Ендпоинти за възстановяване на забравена парола с имейл
    path('auth/password-reset/', RequestPasswordResetView.as_view(), name='password_reset_request'),
    path('auth/password-reset-confirm/', ConfirmPasswordResetView.as_view(), name='password_reset_confirm'),


    path('api/admin/stats/', AdminDashboardStatsView.as_view(), name='admin_stats'),
    path('api/admin/users/', AdminUserListView.as_view(), name='admin_users'),
    
    # 3. Automatically generated CRUD endpoints (categories, transactions, budgets, saving-goals)
    path('', include(router.urls)),
]