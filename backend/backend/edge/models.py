from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import BaseUserManager


class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email must be provided')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)


class CustomUser(AbstractUser):
    username = None
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=10, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

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

#Expert Knowledge
class Condition(models.Model):
    vitalID = models.ForeignKey(Vital, on_delete=models.CASCADE, null=True)
    CLASSIFICATION_CHOICES = (
        ('Normal', 'Normal'),
        ('Warning', 'Warning'),
        ('Critical', 'Critical'),
    )
    classification = models.CharField(max_length=8, choices=CLASSIFICATION_CHOICES, null=True)


class LocationData(models.Model):
    userID = models.ForeignKey(Patient, on_delete=models.CASCADE, null=True)
    locationEnabled = models.BooleanField(default=False)
    latitude = models.FloatField(null=True)
    longitude = models.FloatField(null=True)

    def __str__(self):
        return self.userID.user.get_username()


class StaticContext(models.Model):
    userID = models.ForeignKey(Patient, on_delete=models.CASCADE)
    heartRate = models.FloatField()
    temp = models.FloatField()
    longitude = models.CharField(max_length=50)
    latitude = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
    description = models.TextField(blank=True, null=True)
    is_normal = models.BooleanField(default=False)
