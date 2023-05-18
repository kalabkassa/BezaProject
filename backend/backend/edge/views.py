from django.shortcuts import render
from .models import Vitals

# Create your views here.
def main(request):
    query = Vitals.objects.create(heartRate=98, temp= 38,timestamp="May 2023 17 05:00")
    query.save()
    return render(request, 'edge/main.html')