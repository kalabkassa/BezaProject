import React, { useState, useEffect } from 'react';
import { PermissionsAndroid, View, Text, Switch } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import Geolocation from 'react-native-geolocation-service';
import  AsyncStorage  from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosInstance';

module.exports = async LocationComponent => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [locationPermission, setLocationPermission] = useState(RESULTS.DENIED);
  const [locationDataEnabled, setLocationDataEnabled] = useState(false);
  const [username, setUsername] = React.useState('');

  AsyncStorage.getItem('locationDataEnabled')
  .then((value) => {
    console.log(value);
    if (value) {
      setLocationDataEnabled(JSON.parse(value));
    }
  })
  .catch((error) => {
    console.error('Error retrieving location data preference:', error);
  }); 
  AsyncStorage.getItem('username').then((user) => {
    setUsername(user);
  })
  
    useEffect(() => { 
      async function requestLocationPermission() {
      if(locationDataEnabled){
      try {
        const permissionStatus = await check(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);
        if (permissionStatus === RESULTS.GRANTED) {
          setLocationPermission(RESULTS.GRANTED);
          // Location permission has already been granted
          // You can proceed to get the user's location here
          Geolocation.getCurrentPosition(
            (position) => {
              setLatitude(position.coords.latitude);
              setLongitude(position.coords.longitude);
            },
            (error) => {
              console.error('Error getting location:', error);
            }
          );
        } else {
          setLocationPermission(permissionStatus);
          // Location permission needs to be requested
          const requestResult = await request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION);

          if (requestResult === RESULTS.GRANTED) {
            setLocationPermission(RESULTS.GRANTED);
            // Permission has been granted
            // You can proceed to get the user's location here
            Geolocation.getCurrentPosition(
              (position) => {
                setLatitude(position.coords.latitude);
                setLongitude(position.coords.longitude);
              },
              (error) => {
                console.error('Error getting location:', error);
              }
            );
          } else {
            // Permission was denied
            console.log('Location permission denied');
          }
        }
      } catch (error) {
        console.error('Error requesting location permission:', error);
      }}
      else{
          setLatitude(0);
          setLongitude(0);
        }
    let data = latitude+","+longitude;   
    const response = await axiosInstance.post('http://192.168.8.7:8000/location/' , {
        user: username,
        locationEnabled: locationDataEnabled,
        latitude: latitude,
        longitude: longitude,
      })
    }

    requestLocationPermission();
    console.log(latitude, longitude);
      }, [locationDataEnabled, latitude, longitude]);
  
  return {latitude, longitude,};
}



