const socket = new WebSocket('ws://' + window.location.host + '/update/temp/');

var hb = [];
hb.push(document.getElementById('11'))
hb.push(document.getElementById('12'))
hb.push(document.getElementById('13'))
hb.push(document.getElementById('14'))
hb.push(document.getElementById('15'))
var temp = [];
temp.push(document.getElementById('01'))
temp.push(document.getElementById('02'))
temp.push(document.getElementById('03'))
temp.push(document.getElementById('04'))
temp.push(document.getElementById('05'))
var time = [];
time.push(document.getElementById('31'))
time.push(document.getElementById('32'))
time.push(document.getElementById('33'))
time.push(document.getElementById('34'))
time.push(document.getElementById('35'))
avgHB = document.getElementById('avgHB')
avgTemp = document.getElementById("avgTemp")


var data = [];
var averageHB = 0;
var averageTemp = 0;

socket.onmessage = function (e) {
    data.push(JSON.parse(e.data));

    for (i = 0; i < data.length; i++){
        hb[i].innerHTML = data[data.length - i - 1].heart_rate;
        temp[i].innerHTML = data[data.length - i-1].temp;
        time[i].innerHTML = data[data.length - i-1].time;
    }

    averageHB += data[data.length - 1].heart_rate;
    averageTemp += data[data.length - 1].temp;

    avgHB.innerHTML = Math.floor(averageHB / data.length);
    avgTemp.innerHTML = Math.floor(averageTemp / data.length);  

    if (data.length > 4) {
        data = [];
        averageHB = 0;
        averageTemp = 0;
    }
};

socket.onopen = function (e) {
};