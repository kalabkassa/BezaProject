import React, { useState } from 'react';
import axios from 'axios';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import axiosInstance from './axiosInstance.js'

// Theme
const theme = {
  primaryColor: '#2196F3',
  secondaryColor: '#FFF',
  accentColor: '#2197F2',
  textColor: '#333',
  placeholderColor: "#999",
  errortextColor: "#FF3511",
};

const SignupPage = ({navigation}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [relativePhoneNumber, setRelativePhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSignup = () => {
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    if (
      !fullName ||
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber ||
      !dateOfBirth ||
      !gender
    ) {
      // Handle the error, display a message, or prevent form submission
      setErrorMessage('Please fill in all fields');
      return;
    }

    // Send signup data to the backend
    axiosInstance.post('http://192.168.1.9:8000/patientsignup/', {
      fullName,
      email,
      phoneNumber,
      relativePhoneNumber,
      password,
      dateOfBirth,
      gender,
    })
    .then(response => {
      // Handle successful signup
      navigation.navigate('Login')
      console.log('Signup successful');
      console.log(response.data);
    })
    .catch(error => {
      // Handle signup error
      console.error('Signup failed');
      console.error(error);
    });
  };

  const handleGenderSelect = (selectedGender) => {
    setGender(selectedGender);
  };

  const formatBirthDate = (input) => {
    let formattedDate = input.replace(/[^0-9]/g, '');
    if (formattedDate.length > 8) {
      formattedDate = formattedDate.substr(0, 8);
    }
    if (formattedDate.length > 4) {
      formattedDate = formattedDate.replace(/(\d{2})(\d{2})(\d{0,4})/, '$1/$2/$3');
    } else if (formattedDate.length > 2) {
      formattedDate = formattedDate.replace(/(\d{2})(\d{0,2})/, '$1/$2');
    }
    setDateOfBirth(formattedDate);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hospital Patient Signup</Text>
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        placeholderTextColor={theme.placeholderColor}
        value={fullName}
        onChangeText={setFullName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor={theme.placeholderColor}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        placeholderTextColor={theme.placeholderColor}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <TextInput
        style={styles.input}
        placeholder="Relative's Phone Number"
        placeholderTextColor={theme.placeholderColor}
        value={relativePhoneNumber}
        onChangeText={setRelativePhoneNumber}
        keyboardType="phone-pad"
        maxLength={10}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        placeholderTextColor={theme.placeholderColor}
        value={password}
        onChangeText={setPassword}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        placeholderTextColor={theme.placeholderColor}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />
      <View style={styles.dateOfBirthContainer}>
        <Text style={styles.dateOfBirthLabel}>Date of Birth:</Text>
        <TextInput
          style={styles.dateOfBirthInput}
          placeholder="dd/mm/yyyy"
          placeholderTextColor={theme.placeholderColor}
          value={dateOfBirth}
          onChangeText={formatBirthDate}
        />
      </View>
      <View style={styles.genderContainer}>
        <Text style={styles.genderLabel}>Gender:</Text>
        <View style={styles.genderButtonContainer}>
          <TouchableOpacity
            style={gender === 'male' ? [styles.genderButton, styles.selectedGenderButton] : styles.genderButton}
            onPress={() => handleGenderSelect('male')}
          >
            <Text style={styles.genderButtonText}>Male</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={gender === 'female' ? [styles.genderButton, styles.selectedGenderButton] : styles.genderButton}
            onPress={() => handleGenderSelect('female')}
          >
            <Text style={styles.genderButtonText}>Female</Text>
          </TouchableOpacity>
        </View>
      </View>
      {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>Signup</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginButton}>
        <Text style={styles.link}>already have an account?</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: theme.secondaryColor,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.primaryColor,
    marginBottom: 40,
    textAlign: 'center',
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
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.secondaryColor,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 8,
    alignSelf: 'center',
    color: theme.textColor,
  },
  genderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  genderLabel: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  genderButtonContainer: {
    flexDirection: 'row',
  },
  genderButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 25,
    marginRight: 10,
    backgroundColor: theme.secondaryColor,
    borderWidth: 1,
    borderColor: theme.primaryColor,
  },
  selectedGenderButton: {
    backgroundColor: theme.primaryColor,
  },
  genderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  dateOfBirthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateOfBirthLabel: {
    marginRight: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.textColor,
  },
  dateOfBirthInput: {
    flex: 1,
    height: 50,
    backgroundColor: theme.secondaryColor,
    paddingHorizontal: 20,
    borderRadius: 25,
    fontSize: 16,
    color: theme.textColor,
    borderWidth: 1,
    borderColor: theme.primaryColor,
  },
  error: {
    color: theme.errortextColor,
    fontSize: 16,
  }
});

export default SignupPage;
