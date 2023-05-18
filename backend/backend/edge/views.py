from django.shortcuts import render
from .models import Vitals

# Create your views here.
def main(request):
    return render(request, 'edge/main.html')