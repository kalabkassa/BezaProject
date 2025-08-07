import React, {useState} from 'react';
import {
  View,
  StyleSheet,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
} from 'react-native';
import axiosInstance from './axiosInstance';
import AsyncStorage from '@react-native-async-storage/async-storage';

import messaging from '@react-native-firebase/messaging';
import { api_ip } from './config';
// import {Button, Title } from 'react-native-paper';

const theme = {
  primaryColor: '#2196F3',
  secondaryColor: '#FFF',
  accentColor: '#2197F2',
  textColor: '#333',
  placeholderColor: '#999',
  errortextColor: '#FF3511',
};

const getToken = async () => {
  const token = await messaging().getToken();
  console.log('Device Token:', token);
  // Send the token to your Django backend
  sendTokenToDjango(token);
};

const sendTokenToDjango = async token => {
  try {
    const response = await axiosInstance.post(
      `http://${api_ip}/register-device-token/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Include any additional headers or authentication tokens as needed
        },
        body: JSON.stringify({device_token: token}),
      },
    );

    const data = await response;
    console.log(data);
  } catch (error) {
    console.error('Error sending device token to Django:', error);
  }
};

export default function LoginPage(props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (email.trim() === '' || password === '') {
      setError('Please enter both email and password.');
      return;
    }
    try {
      const response = await axiosInstance.post(
        `http://${api_ip}/patientlogin/`,
        {
          email: email,
          password: password,
        },
      );
      const setCookieHeader = response.headers['set-cookie'];
      let sessionId = null;

      if (Array.isArray(setCookieHeader)) {
        for (const cookieString of setCookieHeader) {
          const sessionIdMatch = cookieString.match(/sessionid=([^;]+)/);
          if (sessionIdMatch) {
            sessionId = sessionIdMatch[1];
            break; // Stop the loop after finding the session ID
          }
        }
      } else {
        const sessionIdMatch = setCookieHeader.match(/sessionid=([^;]+)/);
        sessionId = sessionIdMatch ? sessionIdMatch[1] : null;
      }

      AsyncStorage.setItem('sessionId', sessionId)
        .then(() => {
          console.log('Session ID stored successfully.');
        })
        .catch(error => {
          console.error('Error storing session ID:', error);
        });
      AsyncStorage.setItem('username', response.data.username)
        .then(() => {})
        .catch(error => {});
      // username = response.data.username;
      getToken();
      props.navigation.navigate('ble');
      // Handle the response from the backend
    } catch (error) {
      // Handle any error that occurs during the request
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Patient Login</Text>

      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
        placeholder="Email Address"
        placeholderTextColor={theme.placeholderColor}
      />

      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.placeholderColor}
        secureTextEntry
      />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <TouchableOpacity onPress={handleLogin} style={styles.button}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => props.navigation.navigate('Signup')}
        style={styles.signupButton}>
        <Text style={styles.link}> Create an Account</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.secondaryColor,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: theme.primaryColor,
  },
  link: {
    fontSize: 15,
    marginTop: 10,
    fontWeight: 'bold',
    color: theme.primaryColor,
  },
  input: {
    height: 50,
    backgroundColor: theme.secondaryColor,
    marginBottom: 20,
    paddingHorizontal: 20,
    borderRadius: 25,
    fontSize: 16,
    color: theme.textColor,
    borderWidth: 1,
    borderColor: theme.primaryColor,
  },
  button: {
    backgroundColor: theme.accentColor,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
  },
  signupButton: {
    marginTop: 8,
    alignSelf: 'center',
    color: theme.textColor,
  },
  errorText: {
    color: 'red',
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.secondaryColor,
    textAlign: 'center',
  },
});
