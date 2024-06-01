import json
from .models import Vital, Patient, get_user_model, ESP, LocationData
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

from fcm_django.models import FCMDevice
from firebase_admin.messaging import Message, Notification
 
def send_notification(title, body, user):
    # Get a device to send the notification to (you may need to customize this logic)
    device = FCMDevice.objects.get(user=user.pk)
    if device:
        print(device.send_message(Message(notification=Notification(title=title, body=body, image="url"))))

class edgeConsumer(WebsocketConsumer):

    def connect(self):
        self.room_group_name = 'test'
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        print('connected')
        self.accept()
    
    def disconnect(self, code):
        print(f'connection closed with code: {code}')
    
    def receive(self, text_data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type':'update',
                'data':text_data
            }
        )
    def update(self, event):
        print(event['data'])
        data = event['data'].split(',')
        print(data)
        user = get_user_model().objects.get(email=data[0])
        patient = Patient.objects.get(user=user.pk)
        longitude = LocationData.objects.filter(userID=patient).last().longitude
        latitude = LocationData.objects.filter(userID=patient).last().latitude
        self.send(text_data=json.dumps({
            'user': data[0],
            'heart_rate':float(data[1]),
            'temp': round(float(data[2]), 4),
            'time': data[3],
            'longitude': longitude,
            'latitude': latitude
        }))
        heartrate = float(data[1])
        temp = float(data[2])
        if(heartrate < 60 ):
            if(temp < 30):
                send_notification("Low Body Temprature and Low Heart Rate Critical", "hit navigate to get a list of near by hospitals", user)
            elif(temp > 40):
                send_notification("High Body Temprature warning and Low Heart Rate Critical", "hit navigate to get a list of near by hospitals", user)
            else:    
                send_notification("Low Heart Rate warning", "hit navigate to get a list of near by hospitals", user)
        elif(heartrate > 100):
            if(temp < 30):
                send_notification("Low Body Temprature and Low Heart Rate Critical", "hit navigate to get a list of near by hospitals", user)
            elif(temp > 40):
                send_notification("High Body Temprature warning and Low Heart Rate Critical", "hit navigate to get a list of near by hospitals", user)
            else:
                send_notification("High Heart Rate warning", "hit navigate to get a list of near by hospitals", user)
        elif(temp < 30):
            send_notification("Low Body Temprature warning", "hit navigate to get a list of near by hospitals", user)
        elif(temp > 40):
            send_notification("High Body Temprature warning", "hit navigate to get a list of near by hospitals", user)

        query = Vital.objects.create(userID=patient,heartRate=heartrate, temp= temp, timestamp=(data[3]+","+data[4]))
        query.save()

class tempConsumer(WebsocketConsumer):
    def connect(self):
        self.room_group_name = 'test'
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        print('connected')
        self.accept()
    
    def disconnect(self, code):
        print(f'connection closed with code: {code}')
    
    def receive(self, text_data):
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type':'update',
                'data':text_data
            }
        )
    def update(self, event):
        data = event['data'].split(',')
        print(data)
        self.send(text_data=json.dumps({
            'heart_rate':float(data[1]),
            'temp': round(float(data[2]), 4),
            'time': data[3],
        }))
        espID = ESP.objects.get(espID=data[0])
        query = Vital.objects.create(espID=espID, userID=espID.userID, heartRate=data[1], temp= round(float(data[2]), 4),timestamp=data[3])
        query.save()

