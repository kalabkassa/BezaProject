from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth import get_user_model
from django.forms.widgets import DateInput
from django.db import models

class UserRegistrationForm(UserCreationForm):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name in self.fields:
            self.fields[field_name].widget.attrs['autofocus'] = False
            self.fields[field_name].widget.attrs['placeholder'] = field_name
        self.fields['first_name'].widget.attrs['placeholder'] = 'first name'
        self.fields['last_name'].widget.attrs['placeholder'] = 'last name'
        self.fields['password1'].widget.attrs['placeholder'] = 'password'
        self.fields['password2'].widget.attrs['placeholder'] = 'confirm password'
    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    phone_number = forms.CharField(max_length=20)
    date_of_birth = forms.DateField(widget=DateInput(attrs={'type': 'date'}))

    class Meta:
        model = get_user_model()
        fields = ['first_name', 'last_name', 'email', 'password1', 'password2', 'phone_number']
