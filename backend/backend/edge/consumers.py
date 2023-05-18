import json
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
        self.send(text_data=json.dumps({
            'spo2':data[0],
            # 'hb': data[1],  
        }))

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
            'heart_rate':int(data[0]),
            'temp': round(float(data[1]), 4),
            'time': data[2],
        }))
