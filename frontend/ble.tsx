import React, {useEffect, useState} from 'react';
import type {PropsWithChildren} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  FlatList,
  Switch,
} from 'react-native';

import {
  Colors,
  DebugInstructions,
  LearnMoreLinks,
  ReloadInstructions,
} from 'react-native/Libraries/NewAppScreen';
import useBLE from './useBLE';
import {Device} from 'react-native-ble-plx';
import axiosInstance from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome'; // Replace with the appropriate icon library
import Dashboard from './dashboard';
import LocationComponent from './location';

const theme = {
  primaryColor: '#2196F3',
  secondaryColor: '#FFF',
  accentColor: '#2197F2',
  textColor: '#333',
  placeholderColor: '#999',
  errortextColor: '#FF3511',
};

var i = 0;
var con = true;
var averageHB = 0;
var averageTemp = 0;
var server = 'ws://192.168.8.6:8000/update/';
var socket = new WebSocket(server);

function Ble({navigation}): JSX.Element {
  const [avgTemp, setAvgTemp] = React.useState('0');
  const [temp1, settemp1] = React.useState('0');
  const [temp2, settemp2] = React.useState('0');
  const [temp3, settemp3] = React.useState('0');
  const [temp4, settemp4] = React.useState('0');
  const [temp5, settemp5] = React.useState('0');
  const [avgHb, setAvgHb] = React.useState('0');
  const [hb1, sethb1] = React.useState('0');
  const [hb2, sethb2] = React.useState('0');
  const [hb3, sethb3] = React.useState('0');
  const [hb4, sethb4] = React.useState('0');
  const [hb5, sethb5] = React.useState('0');
  const [time1, settime1] = React.useState('');
  const [time2, settime2] = React.useState('');
  const [time3, settime3] = React.useState('');
  const [time4, settime4] = React.useState('');
  const [time5, settime5] = React.useState('');
  const [username, setUsername] = React.useState('');
  const {
    requestPermissions,
    connectToDevice,
    scanForDevices,
    allDevices,
    currentDevice,
    heartRate,
    temp,
  } = useBLE();
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  };
  const [locationDataEnabled, setLocationDataEnabled] = useState(false);

  // Function to toggle location data collection
  const toggleLocationDataCollection = async () => {
    setLocationDataEnabled(!locationDataEnabled);
    AsyncStorage.setItem(
      'locationDataEnabled',
      JSON.stringify(!locationDataEnabled),
    );
  };

  console.log(LocationComponent());

  AsyncStorage.getItem('locationDataEnabled')
    .then(value => {
      console.log(value);
      if (value) {
        setLocationDataEnabled(JSON.parse(value));
      }
    })
    .catch(error => {
      console.error('Error retrieving location data preference:', error);
    });

  useEffect(() => {
    AsyncStorage.getItem('sessionId')
      .then(sessionId => {
        if (sessionId !== null) {
          console.log('Session ID retrieved:', sessionId);
        } else {
          setUsername('');
          navigation.navigate('Login');
          console.log('No session ID found.');
        }
      })
      .catch(error => {
        navigation.navigate('Login');
        console.error('Error retrieving session ID:', error);
      });
    AsyncStorage.getItem('username').then(user => {
      setUsername(user);
    });
  }, []);

  const openModal = async () => {
    requestPermissions((isGranted: boolean) => {
      if (isGranted) {
        scanForDevices();
      }
    });
  };
  socket.onopen = () => {
    con = true;
  };
  socket.onclose = () => {
    console.log('WebSocket Disconnected');
    con = false;
  };

  useEffect(() => {
    if (currentDevice && heartRate && temp) {
      let time = new Date().toUTCString();
      let data =
        String(username) +
        ',' +
        String(heartRate.toFixed(2)) +
        ',' +
        String(temp.toFixed(2)) +
        ',' +
        String(time);
      console.log(data);
      if (con) {
        socket.send(data);
        console.log('sent');
      } else {
        socket = new WebSocket(server);
      }
    }
  }, [new Date().getSeconds()]);

  useEffect(() => {
    if (currentDevice) {
      let time = new Date().toUTCString();
      if (i === 0) {
        sethb1(heartRate.toFixed(2));
        settemp1(temp.toFixed(2));
        settime1(time);
      } else if (i === 1) {
        sethb2(heartRate.toFixed(2));
        settemp2(temp.toFixed(2));
        settime2(time);
      } else if (i === 2) {
        sethb3(heartRate.toFixed(2));
        settemp3(temp.toFixed(2));
        settime3(time);
      } else if (i === 3) {
        sethb4(heartRate.toFixed(2));
        settemp4(temp.toFixed(2));
        settime4(time);
      } else if (i === 4) {
        sethb5(heartRate.toFixed(2));
        settemp5(temp.toFixed(2));
        settime5(time);
      }

      averageHB += heartRate;
      averageTemp += temp;
      i += 1;
      setAvgTemp((averageTemp / i).toFixed(2));
      setAvgHb((averageHB / i).toFixed(2));
      if (i > 5) {
        i = 0;
        averageHB = 0;
        averageTemp = 0;
      }
    } else {
      openModal();
    }
  }, [new Date().getSeconds()]);

  return (
    // <SafeAreaView style={backgroundStyle}>
    <>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={{paddingTop: 20, flex: 1}}>
        <Dashboard navigation={navigation} />
        <View
          style={{
            backgroundColor: theme.secondaryColor,
            borderRadius: 10,
            borderTopLeftRadius: 0,
            borderBottomRightRadius: 0,
            flex: 0.4,
            shadowColor: '#52006A',
            elevation: 10,
            margin: 10,
          }}>
          <View
            style={{
              backgroundColor: theme.primaryColor,
              flex: 0.25,
              alignSelf: 'flex-end',
              borderTopRightRadius: 10,
              shadowColor: '#52006A',
              elevation: 5,
            }}>
            <Text
              style={{
                fontSize: 20,
                color: 'black',
                height: 10,
                flex: 1,
                paddingHorizontal: 10,
              }}>
              {avgHb} Bpm {avgTemp}c
            </Text>
          </View>
          <View
            style={{
              justifyContent: 'space-between',
              flexDirection: 'row',
              alignItems: 'flex-end',
              marginHorizontal: 10,
            }}>
            <Text style={{fontSize: 14, color: 'black'}}>TIME</Text>
            <Text style={{fontSize: 14, color: 'black'}}>TEMPRATURE</Text>
            <Text style={{fontSize: 14, color: 'black'}}>HEART BEAT</Text>
          </View>

          <View
            style={{
              borderTopColor: 'red',
              backgroundColor: 'white',
              flex: 1,
              justifyContent: 'flex-start',
              marginHorizontal: 10,
            }}>
            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopRightRadius: 5,
                borderTopLeftRadius: 5,
                borderTopColor: theme.primaryColor,
                backgroundColor: 'white',
                flex: 0.2,
              }}>
              <Text style={styles.time}>{time1}</Text>
              <Text>{temp1}</Text>
              <Text>{hb1}</Text>
            </View>
            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopRightRadius: 5,
                borderTopLeftRadius: 5,
                borderTopColor: theme.primaryColor,
                backgroundColor: 'white',
                flex: 0.2,
              }}>
              <Text style={styles.time}>{time2}</Text>
              <Text>{temp2}</Text>
              <Text>{hb2}</Text>
            </View>
            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopRightRadius: 5,
                borderTopLeftRadius: 5,
                borderTopColor: theme.primaryColor,
                backgroundColor: 'white',
                flex: 0.2,
              }}>
              <Text style={styles.time}>{time3}</Text>
              <Text>{temp3}</Text>
              <Text>{hb3}</Text>
            </View>
            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopRightRadius: 5,
                borderTopLeftRadius: 5,
                borderTopColor: theme.primaryColor,
                backgroundColor: 'white',
                flex: 0.2,
              }}>
              <Text style={styles.time}>{time4}</Text>
              <Text>{temp4}</Text>
              <Text>{hb4}</Text>
            </View>
            <View
              style={{
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexDirection: 'row',
                borderTopWidth: 1,
                borderTopRightRadius: 5,
                borderTopLeftRadius: 5,
                borderTopColor: theme.primaryColor,
                backgroundColor: 'white',
                flex: 0.2,
              }}>
              <Text style={styles.time}>{time5}</Text>
              <Text>{temp5}</Text>
              <Text>{hb5}</Text>
            </View>
          </View>
        </View>
        <View style={{flexDirection: 'row', justifyContent: 'center'}}>
          <Text style={{color: 'black', alignSelf: 'center', fontSize: 18}}>
            Enable location tracking{' '}
          </Text>
          <Switch
            value={locationDataEnabled}
            onValueChange={toggleLocationDataCollection}
          />
        </View>
      </View>
      <View
        style={{
          backgroundColor: isDarkMode ? Colors.black : Colors.white,
          flexDirection: 'row',
        }}>
        {allDevices.map((device: Device) => (
          <TouchableOpacity
            onPress={() => {
              try {
                connectToDevice(device);
              } catch (e) {
                console.error(e);
              }
            }}
            style={styles.conButton}>
            <Text style={{color: 'white', alignSelf: 'center', fontSize: 12}}>
              connect {device.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </>
    // </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
  },
  highlight: {
    fontWeight: '700',
  },
  conButton: {
    padding: 10,
    backgroundColor: theme.primaryColor,
    margin: 10,
    alignSelf: 'center',
    borderRadius: 8,
  },
  time: {
    fontSize: 10,
  },
});

export default Ble;
