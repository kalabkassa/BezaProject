from django.db import models
from django.contrib.auth.models import User

class Vitals(models.Model):
    userID = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    heartRate = models.IntegerField(null=True)
    temp = models.IntegerField(null=True)
    spo2 = models.IntegerField(null=True)
    timestamp = models.CharField(default='nan')