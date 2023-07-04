from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Vital, ESP, Doctor, Patient

admin.site.register(Vital)
admin.site.register(ESP)
admin.site.register(Doctor)
admin.site.register(Patient)
admin.site.register(get_user_model())