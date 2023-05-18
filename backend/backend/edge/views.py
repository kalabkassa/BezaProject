from django.shortcuts import render
from .models import Vitals

heartRate = []
temp = []
time = []

def main(request):
    vitals = Vitals.objects.all()
    for vital in vitals:
        heartRate.append(vital.heartRate)
        temp.append(vital.temp)
    i = 0
    while(i < 60):
        time.append(i)
        i+1
    return render(request, 'edge/main.html', {'heartRate':heartRate, 'temp': temp, 'time': time})