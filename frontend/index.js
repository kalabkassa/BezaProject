/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import messaging from '@react-native-firebase/messaging';

import {PermissionsAndroid, Alert, Linking} from 'react-native';
PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);

const openGoogleMaps = () => {
  const url = `https://www.google.com/maps/dir/?api=1&destination=Near by Hospital&destination_place_id=Hospital`;
  Linking.openURL(url).catch(err =>
    console.error('Error opening Google Maps:', err),
  );
};

messaging().onNotificationOpenedApp(async remoteMessage => {
  Alert.alert(
    remoteMessage.notification.title,
    remoteMessage.notification.body,
    [
      {text: 'navigate', onPress: () => openGoogleMaps()},
      {text: 'Ignore', style: 'cancel'},
    ],
  );
});

messaging().onMessage(async remoteMessage => {
  Alert.alert(
    remoteMessage.notification.title,
    remoteMessage.notification.body,
    [
      {text: 'navigate', onPress: () => openGoogleMaps()},
      {text: 'Ignore', style: 'cancel'},
    ],
  );
});

AppRegistry.registerComponent(appName, () => App);
