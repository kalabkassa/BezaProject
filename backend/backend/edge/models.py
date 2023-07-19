from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    username = None
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name', 'last_name', 'phone_number', 'date_of_birth']
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=10, null=True)

    def __str__(self):
        return self.email

class Doctor(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)

    def __str__(self):
        return self.user.get_username()

class Patient(models.Model):
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, null=True)
    relative_phone_number = models.CharField(max_length=10, null=True)
    date_of_birth = models.DateField(null=True,)
    GENDER_CHOICES = (
        ('M', 'Male'),
        ('F', 'Female'),
    )
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, null=True)

    def __str__(self):
        return self.user.get_username()
    

class ESP(models.Model):
    userID = models.ForeignKey(Patient, on_delete=models.CASCADE, null=True)
    espID = models.CharField(max_length=100) 

    def __str__(self):
        return self.espID

class Vital(models.Model):
    userID = models.ForeignKey(Patient, on_delete=models.CASCADE, null=True)
    espID = models.ForeignKey(ESP, on_delete=models.CASCADE, null=True)
    heartRate = models.IntegerField(null=True)
    temp = models.IntegerField(null=True)
    spo2 = models.IntegerField(null=True)
    timestamp = models.CharField(default='nan', max_length=30)

    def __str__(self):
        return self.userID.user.get_username()
    