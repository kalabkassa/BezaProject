const socket = new WebSocket('ws://' + window.location.host + '/update/temp/');

spo2 = document.getElementById('spo2')
hb = document.getElementById('hb')

socket.onmessage = function (e) {
    const data = JSON.parse(e.data);
    spo2.innerHTML = "Heart Rate: " + data.heart_rate;
    hb.innerHTML = "Temprature: " + data.temp;
};

socket.onopen = function (e) {
};