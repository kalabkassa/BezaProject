from django.shortcuts import render
from .models import Vitals

# Create your views here.
def main(request):
    vitals = Vitals.objects.all()
    print(vitals)
    return render(request, 'edge/main.html')