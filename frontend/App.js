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
    <View className="Table01"
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        borderTopLeftRadius:0,
        borderBottomRightRadius:0,
        flex:0.4,
        shadowColor: '#52006A',  
        elevation: 10,  
        margin:10,
       


       
      }}>
         <View style={{backgroundColor:'red',flex:0.25, alignSelf:'flex-end',borderTopRightRadius:10, shadowColor: '#52006A',elevation: 5,}}>
        <Text style={{ fontSize: 20, paddingRight: 80, color: 'black' ,height:10 }}>{hb} Bpm</Text>
          <View>
         
          </View>
        </View>
        
        <View style={{justifyContent:'space-between', flexDirection:'row',alignItems:'flex-end',marginHorizontal:10}}>
      <Text style={{ fontSize: 15, color: 'black',alignSelf:'center' }}>TIME</Text>
      <Text style={{ fontSize: 15, color: 'black' }}>TEMPRATURE</Text>
      <Text style={{ fontSize: 15, color: 'black' }}>HEART BEAT</Text>
      </View>
      <View style={{borderTopColor:'red',backgroundColor:'white',flex:1,justifyContent:'flex-start',marginHorizontal:10}}>
        <View style={{justifyContent:'space-between', alignItems:'flex-end', flexDirection:'row', borderTopWidth:1, borderTopRightRadius:5,borderTopLeftRadius:5, borderTopColor:'red',backgroundColor:'white',flex:0.2,}}>
          <Text>time</Text>
          <Text>temprature</Text>
          <Text>heartbeat</Text>

        </View>
        <View style={{justifyContent:'space-between', alignItems:'flex-end', flexDirection:'row', borderTopWidth:1, borderTopRightRadius:5,borderTopLeftRadius:5, borderTopColor:'red',backgroundColor:'white',flex:0.2}}>
          <Text>time</Text>
          <Text>temprature</Text>
          <Text>heartbeat</Text>

        </View>
        <View style={{justifyContent:'space-between', alignItems:'flex-end', flexDirection:'row', borderTopWidth:1, borderTopRightRadius:5,borderTopLeftRadius:5, borderTopColor:'red',backgroundColor:'white',flex:0.2}}>
          <Text>time</Text>
          <Text>temprature</Text>
          <Text>heartbeat</Text>

        </View>
        <View style={{justifyContent:'space-between', alignItems:'flex-end', flexDirection:'row', borderTopWidth:1, borderTopRightRadius:5,borderTopLeftRadius:5, borderTopColor:'red',backgroundColor:'white',flex:0.2}}>
          <Text>time</Text>
          <Text>temprature</Text>
          <Text>heartbeat</Text>

        </View>
        <View style={{justifyContent:'space-between', alignItems:'flex-end', flexDirection:'row', borderTopWidth:1, borderTopRightRadius:5,borderTopLeftRadius:5, borderTopColor:'red',backgroundColor:'white',flex:0.2}}>
          <Text>time</Text>
          <Text>temprature</Text>
          <Text>heartbeat</Text>

        </View>

      </View>
     
    </View>
   
    </> 
  );
};
export default HelloWorldApp;