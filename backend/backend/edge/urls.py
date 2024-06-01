from django.conf import settings
from django.conf.urls.static import static
from django.urls import path
from .views import home, vital_signs_chart, loginPage, signup, register, patientLogin, restlogoutPage, get_csrf_token, search_results, logoutPage, location, register_device_token, test

urlpatterns = [
    path('test/', test, name='test'),
    path('', home, name='home'),
    path('vital/', vital_signs_chart, name='vital'),
    path('login/', loginPage, name='login'),
    path('patientsignup/', signup, name='patientSignup'),
    path('signup/', register, name='doctorSignup'),
    path('patientlogin/', patientLogin, name='patientLogin'),
    path('logout/', restlogoutPage, name='restlogoutPage'),
    path('getcsrf/', get_csrf_token, name='getcsrf'),
    path('search/', search_results, name='search_results'),
    path('logoutPage/', logoutPage, name='logout'),
    path('location/', location, name='location'),
    path('register-device-token/', register_device_token, name='register_device_token'),
] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
