import { useState } from "react";
import { BleManager, Characteristic, Device } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";
import { atob } from "react-native-quick-base64";

import {PERMISSIONS, requestMultiple} from 'react-native-permissions'; 
import DeviceInfo from "react-native-device-info";
  
type PermissionCallback = (result: boolean) => void;

const bleManager = new BleManager();

const HEART_RATE_UUID = "0000180d-0000-1000-8000-00805f9b34fb";
const HEART_RATE_CHARACTERISTIC = "00002a37-0000-1000-8000-00805f9b34fb";

const TEMP_UUID = "00001809-0000-1000-8000-00805f9b34fb";
const TEMP_CHARACTERISTIC = "00002a1c-0000-1000-8000-00805f9b34fb";

interface BluetoothLowEnergyApi {
    requestPermissions(callback: PermissionCallback): Promise<void>;
    connectToDevice(device: Device): Promise<void>;
    scanForDevices(): void;
    currentDevice: Device | null;
    heartRate: number;
    allDevice: Device[];
}

export default function useBLE(): BluetoothLowEnergyApi {
    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [currentDevice, setConnectedDevice] = useState<Device | null>(null);
    const [heartRate, setHeartRate] = useState<number>(0);
    const [temp, setTemp] = useState<number>(0);

    const requestPermissions = async (callback: PermissionCallback) => {
        if (Platform.OS === 'android') {
            const apiLevel = await DeviceInfo.getApiLevel();
            if(apiLevel < 31){
                const grantedStatus = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    {
                        title: "Location Permission",
                        message: "Bluetooth Low Energy Needs Location Permission",
                        buttonNegative: "Cancel",
                        buttonPositive: "OK",
                        buttonNeutral: "Maybe Later",
                    },

                );
            callback(grantedStatus === PermissionsAndroid.RESULTS.GRANTED)
            }else{
	            const result = await requestMultiple([
		            PERMISSIONS.ANDROID.BLUETOOTH_SCAN,
		            PERMISSIONS.ANDROID.BLUETOOTH_CONNECT,
		            PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION,
                    ]);

                const isAllPermissionGranted = 
                result['android.permission.BLUETOOTH_SCAN'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.BLUETOOTH_CONNECT'] ===
                    PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.ACCESS_FINE_LOCATION'] ===
                    PermissionsAndroid.RESULTS.GRANTED;
                callback(isAllPermissionGranted);
	        }
	}else{
	    callback(true);
	}
    };

    const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex(device => nextDevice.id === device.id) > -1;

    const scanForDevices = () => {
        bleManager.startDeviceScan(null, null, (error, device) => {
            if (error) {
                console.log(error);
            }
            if(device){
                if (device.name?.includes("Polar")||device.name?.includes("CORE")) {
                    setAllDevices(prevState => {
                        if (!isDuplicateDevice(prevState, device)) {
                            return [...prevState, device];
                        }
                        return prevState;
                    })
                }
            }
        })
    };

    const connectToDevice = async (device: Device) => {
        try {
            const deviceConnection = await bleManager.connectToDevice(device.id)
            setConnectedDevice(deviceConnection);
            if(allDevices.length === 2){
                console.log(allDevices.length);
                bleManager.stopDeviceScan();
            }
            await device.discoverAllServicesAndCharacteristics();
            if(device.id === 'D4:FD:32:F8:5C:CB'){
                console.log(device.name);
                startStreamingTempData(device);
            }
            else if(device.id === 'A0:9E:1A:6A:B2:AD'){
                console.log(device.name);
                startStreamingHeartRateData(device);
            }
        } catch (e) {
            console.log("Error when connection: ", e);
        }
    };

    const startStreamingHeartRateData = async (device: Device) => {
        if (device) {
            device.monitorCharacteristicForService(HEART_RATE_UUID, HEART_RATE_CHARACTERISTIC, onHeartRateUpdate)
        } else {
            console.error('NO HEART RATE DEVICE CONNECTED');
        }
    };

    const startStreamingTempData = async (device: Device) => {
        if (device) {
            device.monitorCharacteristicForService(TEMP_UUID, TEMP_CHARACTERISTIC, onTempUpdate)
        } else {
            console.error('NO TEMPRATURE DEVICE CONNECTED');
        }
    };

    const onHeartRateUpdate = (
        error: BleError | null,
        characteristic: Characteristic | null
    ) => {
        if(error) {
            console.error(error)
            return;
        }else if(!characteristic?.value) {
            console.error("No Characteristic Found")
            return;
        }

        const rawData = atob(characteristic.value);
        let innerHeartRate = -1;
        const firstBitValue = Number(rawData) & 0x01;
        if(firstBitValue == 0){
            innerHeartRate = rawData[1].charCodeAt(0);
        }else{
            innerHeartRate = Number(rawData[1].charCodeAt(0)<<8) +
            Number(rawData[2].charCodeAt(0));
        }
        setHeartRate(innerHeartRate);
        console.log(innerHeartRate);
        
    };

    const onTempUpdate = (
        error: BleError | null,
        characteristic: Characteristic | null
    ) => {
        if(error) {
            console.error(error)
            return;
        }else if(!characteristic?.value) {
            console.error("No Characteristic Found")
            return;
        }

        const rawData = atob(characteristic.value);
        let temp = -1;
        const firstValue = rawData[2].charCodeAt(0)<<8;
        temp = firstValue + rawData[1].charCodeAt(0);
        temp = temp * Math.pow(10, rawData[4].charCodeAt(0)-256);
        setTemp(temp);
        console.log(temp);
        
    };

    return {
        requestPermissions,
        connectToDevice,
        scanForDevices,
        allDevices,
        currentDevice,
        heartRate,
        temp,
    };
}

