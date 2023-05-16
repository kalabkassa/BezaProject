from django.urls import path
from .consumers import edgeConsumer
from .consumers import tempConsumer

websocket_urlpatterns = [
    path('update/', edgeConsumer.as_asgi()),
    path('update/temp/', tempConsumer.as_asgi()),
]