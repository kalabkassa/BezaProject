import BackgroundTask from 'react-native-background-task';
import { PermissionsAndroid, } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import  AsyncStorage  from '@react-native-async-storage/async-storage';

BackgroundTask.define(async () => {
  // Get the current location data
  const locationData = await getCurrentLocationData();

  // Send the data to your Django server
  await sendLocationDataToServer(locationData);
  
  BackgroundTask.finish();
});

// Start the background task (e.g., when the app starts or as needed)
BackgroundTask.schedule({
  period: 1800, // Set the interval in seconds (e.g., every 30 minutes)
});

// Function to get current location data
async function getCurrentLocationData() {
  var lat = 9.089;
  var longt = 34.68798;
  return {lat, longt,};
}

// Function to send location data to the Django server
async function sendLocationDataToServer(locationData) {
  // Use the fetch API to send a POST request to your Django server
  const response = await fetch('http://192.168.8.7:8000/location', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(locationData),
  });

  if (response.ok) {
    const responseData = await response.json();
    console.log('Server response:', responseData);
  } else {
    console.error('Failed to send location data to server');
  }
}
