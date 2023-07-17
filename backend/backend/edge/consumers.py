import json
from .models import Vital, Patient, get_user_model, ESP
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
 

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
        data = event['data'].split(',')
        user = get_user_model().objects.get(email=data[0])
        user = Patient.objects.get(user=user.pk)
        # self.send(text_data=json.dumps({

        #     'heart_rate':int(data[0]),
        #     'temp': round(float(data[1]), 4),
        #     'time': data[2],
        # }))
        query = Vital.objects.create(userID=user,heartRate=float(data[1]), temp= float(data[2]),timestamp=(data[3]+","+data[4]))
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
            'heart_rate':int(data[1]),
            'temp': round(float(data[2]), 4),
            'time': data[3],
        }))
        espID = ESP.objects.get(espID=data[0])
        query = Vital.objects.create(espID=espID, userID=espID.userID, heartRate=data[1], temp= round(float(data[2]), 4),timestamp=data[3])
        query.save()

