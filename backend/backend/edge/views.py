from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout, get_user_model
from .forms import UserRegistrationForm
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.hashers import make_password
from django.views.decorators.csrf import csrf_exempt
from django.middleware.csrf import get_token
from .models import Vital, Doctor, Patient
import json
from datetime import datetime

from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse

def loginPage(request):
    form = UserRegistrationForm()
    if request.user.is_authenticated:
        return redirect('vital')
    if request.method == 'POST' and request.POST.get('phone_number') == None:
        emailaddress = request.POST.get('emailaddress').lower()
        password = request.POST.get('password')
        try:
            user = get_user_model().objects.get(email = emailaddress)
        except:
            messages.error(request, 'user does not exist')
            print('user does not exist')
            return redirect('login')
        user = authenticate(request, username=user.get_username(), password = password)
        print(request)
        if user is not None:
            login(request,user)
            return redirect('vital')
        else:
            messages.error(request, 'Username or password does not exist')
            print('Username or password does not exist')
    elif request.method == 'POST' and request.POST.get('phone_number') != None:
        return register(request)
    return render(request, 'edge/login_register.html', {'form': form})

def register(request):
    form = UserRegistrationForm()
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            Doctor.objects.create(user=get_user_model().objects.get(email = form.data.get('email')))
            return redirect('home')
        else:
            messages.error(request, 'user does not exist')
            print(form.errors.as_data)
    return render(request, 'edge/login_register.html', {'form': form, 'style': -50, 'check': 'checked'})
        
@login_required
def home(request):
    doctor = Doctor.objects.get(user=request.user)
    patients =  Patient.objects.filter(doctor=doctor)
    vitals = []
    for patient in patients:
        vitals.append(Vital.objects.filter(userID=patient))
    print(patients)
    
    return render(request, 'edge/main.html', {'patients': patients, 'vitals': vitals})

@login_required
def vital_signs_chart(request):
    doctor = Doctor.objects.get(user=request.user)
    patients =  Patient.objects.filter(doctor=doctor)
    data = []
    for patient in patients:
        vitals=Vital.objects.filter(userID=patient)
        timestamps = []
        heart_rates = []
        temperatures = []
        if vitals:
            for vital in vitals:
                heart_rates.append(vital.heartRate)
                temperatures.append(vital.temp)
                timestamps.append(vital.timestamp)
            data.append({
                'patient': patient.user.get_username(),
                'timestamps': timestamps,
                'heart_rates': heart_rates,
                'temperatures': temperatures,
            })
    for d in data:
        print(d)
    return render(request, 'edge/chart.html', {'data': data})

@api_view(['POST'])
def signup(request):
    fullname = request.data.get('fullName').split(' ')
    first_name=fullname[0]
    last_name = fullname[1] if len(fullname) == 2 else None
    email = request.data.get('email')
    phone_number = request.data.get('phoneNumber')
    relative_phone_number = request.data.get('relativePhoneNumber')
    password = request.data.get('password')
    date_of_birth = request.data.get('dateOfBirth')
    date_of_birth = datetime.strptime(date_of_birth, '%d/%m/%Y').strftime('%Y-%m-%d')
    gender = 'M' if request.data.get('gender') =='Male' else 'F'
    user = get_user_model().objects.create(first_name=first_name, last_name=last_name,email=email, phone_number=phone_number, password=make_password(password))
    Patient.objects.create(user=user, relative_phone_number=relative_phone_number, date_of_birth=date_of_birth, gender=gender)
    return Response({'message': 'User created successfully', 'username': user.get_username()}, status=status.HTTP_201_CREATED)

@api_view(['POST'])
def patientLogin(request):
    if request.method == 'POST':
        email = request.data.get('email')
        password = request.data.get('password')

        try:
            user = get_user_model().objects.get(email = email)
        except:
            return Response({'message': 'User not found'}, status=401)
        
        user = authenticate(username=email, password = password)
        
        if user is not None:
            # Authentication successful, return a JSON response
            print(login(request, user))
            return JsonResponse({'message': 'login successfull','username': email})
        else:
            # Authentication failed, return an error JSON response
            return Response({'error': 'Invalid credentials'}, status=401)
    return Response({'error': 'Invalid request'}, status=400)

@api_view(['POST'])
def logoutPage(request):
    print('logout')
    logout(request)
    return Response({'message': 'Logout successful'})

@api_view(['GET'])
def get_csrf_token(request):
    csrf_token = get_token(request)
    return JsonResponse({'csrfToken': csrf_token})