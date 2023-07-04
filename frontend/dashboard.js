import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList } from 'react-native';
// import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import Icon from 'react-native-vector-icons/FontAwesome'; // Replace with the appropriate icon library
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from './axiosInstance';

const Dashboard = ({ navigation }) => {
    const [showLogout, setShowLogout] = useState(false);
    const [username, setUsername] = React.useState('');

    const handleUsernamePress = () => {
      setShowLogout(!showLogout);
    };
    AsyncStorage.getItem('username').then((user) => {
      setUsername(user);
    })
    const handleLogout = async () => {
      try {
          // Retrieve the session token from AsyncStorage
          const sessionToken = await AsyncStorage.getItem('sessionId');
          console.log(sessionToken);
          // Make API request to Django logout endpoint to invalidate the session
          await axiosInstance.post('http://192.168.1.8:8000/logout/');
  
          // Remove the session token from AsyncStorage
          await AsyncStorage.removeItem('sessionId');
          await AsyncStorage.removeItem('username')
          console.log('logout')
          // Navigate to the login screen or non-authenticated screens
          navigation.navigate('Login');
      } catch (error) {
          // Handle logout error
          console.error(error);
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
        <View style={{justifyContent: 'center' }}>
            <TouchableOpacity onPress={handleUsernamePress}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Icon name="user" size={20} color="black" style={{ marginRight: 8 }} />
                <Text style={{ fontSize: 20 }}>Welcome, <Text style={{ fontWeight: 'bold' }}>{username}</Text></Text>
            </View>
            </TouchableOpacity>
            {renderLogout()}
        </View>
    );
  };
  
  export default Dashboard;