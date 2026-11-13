from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from django.conf import settings

class RequestPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            email = request.data.get('email')
            print(f"DEBUG: Получен имейл за ресет -> {email}")
            
            user = User.objects.get(email=email)
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Линк към фронтенда (React)
            reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"
            
            subject = "Възстановяване на парола за FinanceFlow"
            
            # Обикновен текст (fallback за пощи, които не поддържат HTML)
            plain_message = f"Здравейте,\n\nПолучихме заявка за смяна на парола. Кликнете на линка:\n{reset_link}"
            
            # 🌟 КРАСИВ HTML ТЕМПЛЕЙТ ЗА ИМЕЙЛА
            html_message = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="color: #4F46E5; text-align: center;">FinanceFlow</h2>
                <h3 style="color: #333333;">Възстановяване на парола</h3>
                <p style="color: #555555; font-size: 16px;">Здравейте,</p>
                <p style="color: #555555; font-size: 16px;">Получихме заявка за възстановяване на паролата за вашия профил във FinanceFlow. Моля, кликнете върху бутона по-долу, за да зададете нова парола:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{reset_link}" style="background-color: #4F46E5; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; display: inline-block;">Смяна на парола</a>
                </div>
                
                <p style="color: #777777; font-size: 14px;">Ако не сте направили тази заявка, моля игнорирайте този имейл.</p>
                <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;">
                <p style="color: #999999; font-size: 12px; text-align: center;">Екипът на FinanceFlow &bull; Всички права запазени</p>
            </div>
            """
            
            # Изпращане с поддръжка на HTML
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                html_message=html_message, # <--- ТОВА ПРАВЕШЕ ИМЕЙЛА КРАСИВ И HTML
                fail_silently=False,
            )
            
            return Response({"message": "Reset instructions have been sent."}, status=status.HTTP_200_OK)
            
        except User.DoesNotExist:
            # За сигурност връщаме 200, за да не се разкрива дали имейлът съществува
            return Response({"message": "If the email exists, reset instructions have been sent."}, status=status.HTTP_200_OK)
            
        except Exception as e:
            print("="*50)
            print(f"❌ ТОЧНА ГРЕШКА: {str(e)}")
            traceback.print_exc()
            print("="*50)
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# Правилното:
class ConfirmPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        uid = request.data.get('uid')
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not uid or not token or not new_password:
            return Response({"error": "All fields (uid, token, new_password) are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Декодираме потребителското ID от uidb64
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)

            # Проверяваме дали токенът е валиден за този потребител
            if default_token_generator.check_token(user, token):
                user.set_password(new_password)
                user.save()
                return Response({"message": "Password has been reset successfully."}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
                
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Invalid token or user data."}, status=status.HTTP_400_BAD_REQUEST)