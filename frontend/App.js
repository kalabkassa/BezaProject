import React from 'react';
import { Text, View } from 'react-native';
import { ReloadInstructions } from 'react-native/Libraries/NewAppScreen';

var socket = new WebSocket('ws://192.168.43.189:8000/update/temp/');
var con = false;

const HelloWorldApp = () => {
  const [temp, settemp] = React.useState('');
  const [hb, sethb] = React.useState('');

  socket.onopen = e => {
    con = true;
  }

  socket.onmessage = e => {
    data = JSON.parse(e.data);
    settemp(data.temp);
    sethb(data.heart_rate);
  }

  return (
    <View
      style={{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "white",
        width: '60%',
        height: "20%",
        borderRadius: 15,
        shadowColor: 'red',
        shadowRadius: 5,
        shadowOpacity: 10,
        borderColor: 'red',
        borderWidth: 2,
        margin: 20,
        shadowOffset: 10,
        shadowColor: 'black',
        shadowRadius: 5,
        shadowOpacity: 10,
      }}>
      <Text style={{ fontSize: 20, paddingRight: 80, color: 'red' }}>{hb} Bpm</Text>
      <Text style={{ fontSize: 20, paddingRight: 80, color: 'red' }}>{temp} C</Text>
    </View>
  );
};
export default HelloWorldApp;