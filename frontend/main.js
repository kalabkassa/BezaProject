import React, { useState } from 'react';
import axios from 'axios';
import axiosInstance from './axiosInstance';
import { Text, View, TouchableOpacity, FlatList, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome'; // Replace with the appropriate icon library

import { ReloadInstructions } from 'react-native/Libraries/NewAppScreen';
import LocationComponent from './location';

var server = 'ws://192.168.8.7:8000/update/temp/';
var socket = new WebSocket(server);
var con = false;
var temp_data = [];

// Theme
const theme = {
    primaryColor: '#2196F3',
    secondaryColor: '#FFF',
    accentColor: '#2197F2',
    textColor: '#333',
    placeholderColor: "#999",
    errortextColor: "#FF3511",
};

const MainPage = ({ navigation }) => {
    const [avgTemp, setAvgTemp] = React.useState();
    const [temp1, settemp1] = React.useState('');
    const [temp2, settemp2] = React.useState('');
    const [temp3, settemp3] = React.useState('');
    const [temp4, settemp4] = React.useState('');
    const [temp5, settemp5] = React.useState('');
    const [avgHb, setAvgHb] = React.useState();
    const [hb1, sethb1] = React.useState('');
    const [hb2, sethb2] = React.useState('');
    const [hb3, sethb3] = React.useState('');
    const [hb4, sethb4] = React.useState('');
    const [hb5, sethb5] = React.useState('');
    const [time1, settime1] = React.useState('');
    const [time2, settime2] = React.useState('');
    const [time3, settime3] = React.useState('');
    const [time4, settime4] = React.useState('');
    const [time5, settime5] = React.useState('');
    const [username, setUsername] = React.useState('');
    const [locationDataEnabled, setLocationDataEnabled] = useState(false);
 
    // Function to toggle location data collection
    const toggleLocationDataCollection = async () => {
      setLocationDataEnabled(!locationDataEnabled);
      AsyncStorage.setItem('locationDataEnabled', JSON.stringify(!locationDataEnabled)); 
    };
     
    console.log(LocationComponent());


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
    AsyncStorage.getItem('sessionId')
        .then((sessionId) => {
            if (sessionId !== null) {
                console.log('Session ID retrieved:', sessionId);
            } else {
                navigation.navigate('Login');
                console.log('No session ID found.');
            }
        })
        .catch((error) => {
            navigation.navigate('Login');
            console.error('Error retrieving session ID:', error);
        });
    AsyncStorage.getItem('username').then((user) => {
        setUsername(user);
    })
    console.log(username);

    socket.onopen = e => {
        con = true;
    }

    socket.onmessage = e => {
        data = JSON.parse(e.data);

        for (i = 0; i < data.length; i++) {
            if (i = 0) {
                sethb1(data[data.length - i - 1].heart_rate);
                settemp1(data[data.length - i - 1].temp);
                settime1(data[data.length - i - 1].time);
            }
            else if (i = 1) {
                sethb2(data[data.length - i - 1].heart_rate);
                settemp2(data[data.length - i - 1].temp);
                settime2(data[data.length - i - 1].time);
            }
            else if (i = 2) {
                sethb3(data[data.length - i - 1].heart_rate);
                settemp3(data[data.length - i - 1].temp);
                settime3(data[data.length - i - 1].time);
            }
            else if (i = 3) {
                sethb4(data[data.length - i - 1].heart_rate);
                settemp4(data[data.length - i - 1].temp);
                settime4(data[data.length - i - 1].time);
            }
            else if (i = 4) {
                sethb5(data[data.length - i - 1].heart_rate);
                settemp5(data[data.length - i - 1].temp);
                settime5(data[data.length - i - 1].time);
            }
        }
        averageHB += data[data.length - 1].heart_rate;
        averageTemp += data[data.length - 1].temp;
        settemp(averageTemp / data.length);
        sethb(data.averageHB / data.length);

        if (data.length > 5) {
            data = [];
            averageHB = 0;
            averageTemp = 0;
        }
    }

    const [showLogout, setShowLogout] = useState(false);

    const handleUsernamePress = () => {
        setShowLogout(!showLogout);
    };

    const handleLogout = async () => {
        try {
            // Retrieve the session token from AsyncStorage
            const sessionToken = await AsyncStorage.getItem('sessionId');
            console.log(sessionToken);
            // Make API request to Django logout endpoint to invalidate the session
            await axiosInstance.post('http://192.168.8.7:8000/logout/');
            console.log(await AsyncStorage.getItem('address'));

            // Remove the session token from AsyncStorage
            await AsyncStorage.removeItem('sessionId');
            console.log('logout')
            // Navigate to the login screen or non-authenticated screens
            navigation.navigate('Login');
        } catch (error) {
            // Handle logout error
        }
    }

    const renderLogout = () => {
        if (showLogout) {
            return (
                <FlatList
                    data={[{ key: 'logout' }]}
                    renderItem={() => (
                        <TouchableOpacity onPress={handleLogout}>
                            <Text style={{ fontSize: 20 }}>Logout</Text>
                        </TouchableOpacity>
                    )}
                />
            );
        }
        return null;
    };

    return (
        <View style={{ paddingTop: 70, flex: 1 }}>
            <View style={{ position: 'absolute', paddingTop: 20, paddingLeft: 20 }}>
                <TouchableOpacity onPress={handleUsernamePress}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontWeight: 'bold', marginRight: 20, marginTop: 10 }}>{username}</Text>
                        <Icon name="user" size={20} color="black" />
                    </View>
                </TouchableOpacity>
                {renderLogout()}
            </View>
            <View className="Table01"
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
                <View style={{ backgroundColor: theme.primaryColor, flex: 0.25, alignSelf: 'flex-end', borderTopRightRadius: 10, shadowColor: '#52006A', elevation: 5 }}>
                    <Text style={{ fontSize: 20, color: 'black', height: 10, flex: 1, paddingHorizontal: 10 }}>{avgHb} Bpm    {avgTemp}c</Text>
                </View>
                <View style={{ justifyContent: 'space-between', flexDirection: 'row', alignItems: 'flex-end', marginHorizontal: 10 }}>
                    <Text style={{ fontSize: 15, color: 'black', alignSelf: 'center' }}>TIME</Text>
                    <Text style={{ fontSize: 15, color: 'black' }}>TEMPRATURE</Text>
                    <Text style={{ fontSize: 15, color: 'black' }}>HEART BEAT</Text>
                </View>

                <View style={{ borderTopColor: 'red', backgroundColor: 'white', flex: 1, justifyContent: 'flex-start', marginHorizontal: 10 }}>
                    <View style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row', borderTopWidth: 1, borderTopRightRadius: 5, borderTopLeftRadius: 5, borderTopColor: theme.primaryColor, backgroundColor: 'white', flex: 0.2, }}>
                        <Text>{time1}</Text>
                        <Text>{temp1}</Text>
                        <Text>{hb1}</Text>

                    </View>
                    <View style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row', borderTopWidth: 1, borderTopRightRadius: 5, borderTopLeftRadius: 5, borderTopColor: theme.primaryColor, backgroundColor: 'white', flex: 0.2 }}>
                        <Text>{time2}</Text>
                        <Text>{temp2}</Text>
                        <Text>{hb2}</Text>

                    </View>
                    <View style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row', borderTopWidth: 1, borderTopRightRadius: 5, borderTopLeftRadius: 5, borderTopColor: theme.primaryColor, backgroundColor: 'white', flex: 0.2 }}>
                        <Text>{time3}</Text>
                        <Text>{temp3}</Text>
                        <Text>{hb3}</Text>

                    </View>
                    <View style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row', borderTopWidth: 1, borderTopRightRadius: 5, borderTopLeftRadius: 5, borderTopColor: theme.primaryColor, backgroundColor: 'white', flex: 0.2 }}>
                        <Text>{time4}</Text>
                        <Text>{temp4}</Text>
                        <Text>{hb4}</Text>

                    </View>
                    <View style={{ justifyContent: 'space-between', alignItems: 'flex-end', flexDirection: 'row', borderTopWidth: 1, borderTopRightRadius: 5, borderTopLeftRadius: 5, borderTopColor: theme.primaryColor, backgroundColor: 'white', flex: 0.2 }}>
                        <Text>{time5}</Text>
                        <Text>{temp5}</Text>
                        <Text>{hb5}</Text>

                    </View> 
                </View>

            </View>
<Switch value={locationDataEnabled} onValueChange={toggleLocationDataCollection}/>
        </View>
    );
};

export default MainPage;
