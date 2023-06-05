import React from 'react';
import { Text, View, _View } from 'react-native';
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
      <>
      
      </>
       );
    };
    export default HelloWorldApp;