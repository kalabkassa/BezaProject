import json
import threading
from django.utils import timezone
from .models import Vital, Patient, get_user_model, ESP, LocationData, StaticContext, Condition
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync

from fcm_django.models import FCMDevice
from firebase_admin.messaging import Message, Notification

from ontology.reasoner import classify_patient


def send_notification(title, body, user):
    # Get a device to send the notification to (you may need to customize this logic)
    device = FCMDevice.objects.get(user=user.pk)
    if device:
        print(device.send_message(
            Message(notification=Notification(title=title, body=body, image="url"))))

def run_classification_thread(patient_id, hr, temp):
    thread = threading.Thread(target=classify_patient, args=(patient_id, hr, temp,))
    thread.start()

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
                'type': 'update',
                'data': text_data
            }
        )

    def context_parser(self, patient, dynamic_context):
        static_contexts = StaticContext.objects.filter(userID=patient)
        if not static_contexts.exists():
            return {'matched': False, 'reason': 'No static context available'}

        matches = []
        for sc in static_contexts:
            hr_match = abs(dynamic_context['heartRate'] - sc.heartRate) <= 5
            temp_match = abs(dynamic_context['temp'] - sc.temp) <= 0.5
            loc_match = (sc.longitude == dynamic_context['longitude'] and
                         sc.latitude == dynamic_context['latitude'])

            if hr_match or temp_match or loc_match:
                match_score = sum([hr_match, temp_match, loc_match])
                matches.append((match_score, sc))

        if not matches:
            return {'matched': False, 'reason': 'No intersection with static context'}

        matches.sort(key=lambda x: x[0], reverse=True)
        matched_static = matches[0][1]

        return {
            'matched': True,
            'reference': matched_static,
            'match_score': matches[0][0],
            'suggestion': matched_static.description,
            'suppress_alert': matched_static.is_normal
        }

    def preProcessor(event):
        print(event['data'])
        data = event['data'].split(',')

        # Step 1: Parse dynamic context
        email = data[0]
        heart_rate = float(data[1])
        temp = float(data[2])
        timestamp = data[3] + ',' + data[4]

        user = get_user_model().objects.get(email=email)
        patient = Patient.objects.get(user=user.pk)

        location = LocationData.objects.filter(userID=patient).last()
        longitude = location.longitude if location else None
        latitude = location.latitude if location else None

        dynamic_context = {
            'heartRate': heart_rate,
            'temp': temp,
            'longitude': longitude,
            'latitude': latitude
        }

        return dynamic_context

    def update(self, event):
        dynamic_context = preProcessor(event)
        # Step 2: Use context parser
        parsed_result = self.context_parser(patient, dynamic_context)
        suppress_alert = parsed_result.get('suppress_alert', False)
        suggestion = parsed_result.get('suggestion')
        matched = parsed_result.get('matched', False)

        # Step 3: Send data to frontend
        response = {
            'user': email,
            'heart_rate': heart_rate,
            'temp': round(temp, 4),
            'time': data[3],
            'longitude': longitude,
            'latitude': latitude,
            'context_match': matched,
            'suggestion': suggestion if matched else None,
            'suppress_alert': suppress_alert
        }
        self.send(text_data=json.dumps(response))

        # Step 4: Smart Notification Logic
        if suppress_alert:
            print("Alert suppressed due to is_normal=True")
        elif matched and suggestion:
            # Use static context suggestion instead of default alert
            send_notification("Context-Aware Recommendation", suggestion, user)
        else:
            # Default alert logic
            if heart_rate < 60:
                if temp < 30:
                    send_notification("Low Body Temperature and Low Heart Rate Critical",
                                      "Hit navigate to get a list of nearby hospitals", user)
                elif temp > 40:
                    send_notification("High Body Temperature warning and Low Heart Rate Critical",
                                      "Hit navigate to get a list of nearby hospitals", user)
                else:
                    send_notification("Low Heart Rate warning",
                                      "Hit navigate to get a list of nearby hospitals", user)
            elif heart_rate > 100:
                if temp < 30:
                    send_notification("Low Body Temperature and High Heart Rate Critical",
                                      "Hit navigate to get a list of nearby hospitals", user)
                elif temp > 40:
                    send_notification("High Body Temperature and High Heart Rate Critical",
                                      "Hit navigate to get a list of nearby hospitals", user)
                else:
                    send_notification("High Heart Rate warning",
                                      "Hit navigate to get a list of nearby hospitals", user)
            elif temp < 30:
                send_notification("Low Body Temperature warning",
                                  "Hit navigate to get a list of nearby hospitals", user)
            elif temp > 40:
                send_notification("High Body Temperature warning",
                                  "Hit navigate to get a list of nearby hospitals", user)

        # Step 5: Save reading
        Vital.objects.create(
            userID=patient,
            heartRate=heart_rate,
            temp=temp,
            timestamp=timestamp
        )


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
        try:
            current_time = timezone.now()
            print("Current time: ", current_time)
            # --- 1. Preprocess ---
            data = self._preprocess(text_data)

            # --- 2. Feature Extraction ---
            features = self._extract_features(data)

            # --- 3. Classification (in this context, DB storage and broadcasting) ---
            self._classify_and_store(features)

        except Exception as e:
            print(f"Error handling data: {e}")

    # --- Preprocessor ---
    def _preprocess(self, raw_json):
        try:
            data = json.loads(raw_json)
            if not data.get("device_id"):
                raise ValueError("Missing device_id")
            return data
        except json.JSONDecodeError as e:
            raise ValueError("Invalid JSON format") from e

    # --- Feature Extractor ---
    def _extract_features(self, data):
        try:
            return {
                "device_id": data.get("device_id"),
                "heartrate": float(data.get("heartrate", 0)),
                "temp": round(float(data.get("tempdata", 0.0)), 4),
                "timestamp": data.get("localtime")
            }
        except (ValueError, TypeError) as e:
            raise ValueError("Error extracting features") from e

    # --- Classifier / Storage ---
    def _classify_and_store(self, features):
        esp = ESP.objects.get(espID=features["device_id"])
        vital = Vital.objects.create(
            espID=esp,
            userID=esp.userID,
            heartRate=features["heartrate"],
            temp=features["temp"],
            timestamp=features["timestamp"]
        )
        vital.save()


        print(f"Stored: HR={features['heartrate']}, Temp={features['temp']}, ID={features['device_id']}")

        #status = run_classification_thread(esp.userID, hr=features["heartrate"], temp=features["temp"])

        #print(f"Stored: HR={features['heartrate']}, Temp={features['temp']}, ID={features['device_id']}, Status={status}")

        #condition = Condition.objects.create(
        #        vitalID = vital,
        #        classification = status
        #)

        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'update',
                'payload': {
                    'heart_rate': features['heartrate'],
                    'temp': features['temp'],
                    'time': features['timestamp'],
        #            'status': status,
                    'device_id': features['device_id']
                }
            }
        )

    def update(self, event):
        payload = event['payload']
        self.send(text_data=json.dumps(payload))

