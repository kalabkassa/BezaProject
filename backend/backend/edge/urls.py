from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from .views import home, vital_signs_chart, loginPage, signup, register, patientLogin, logoutPage, get_csrf_token

urlpatterns = [
    path('', home, name='home'),
    path('vital/', vital_signs_chart, name='vital'),
    path('login/', loginPage, name='login'),
    path('patientsignup/', signup, name='patientSignup'),
    path('signup/', register, name='doctorSignup'),
    path('patientlogin/', patientLogin, name='patientLogin'),
    path('logout/', logoutPage, name='logout'),
    path('getcsrf/', get_csrf_token, name='getcsrf'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
