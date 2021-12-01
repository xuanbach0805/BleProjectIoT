import { StackScreenProps } from '@react-navigation/stack';
import React, { useCallback, useEffect, useState, Component, constructor  } from 'react';
import { Text, ScrollView, Button, View, StyleSheet } from 'react-native';
import { Service, Characteristic} from 'react-native-ble-plx';
import { ServiceCard } from '../components/ServiceCard';
import { ServiceComm } from '../components/ServiceComm';
import { RootStackParamList } from '../navigation/index';
import { Base64 } from '../lib/base64';
import base64 from 'react-native-base64';
import aesjs from 'aes-js';
import {toHex, toBytes} from 'hex-my-bytes'
import md5 from 'react-native-md5'
import crc from 'crc';
import hexToArrayBuffer from 'hex-to-array-buffer';
import { Buffer } from 'buffer';
import { tsConstructorType } from '@babel/types';


const UART_SERVICE_UUID = '6E400001-B5A3-F393-­E0A9-­E50E24DCCA9E'.toLowerCase();
//const SERVICE_UUID = '6E400001-B5A3-F393-­E0A9-­E50E24DCCA9E'.toLowerCase();
const SERVICE_UUID = '76434400-899a-11eb-8dcd-0242ac130003';//'6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const CHAR_MOBILE_TO_DEVICE = '7643ffe1-899a-11eb-8dcd-0242ac130003';//'6e40ffe1-b5a3-f393-e0a9-e50e24dcca9e';
const CHAR_DEVICE_TO_MOBILE_RES = '7643ffe3-899a-11eb-8dcd-0242ac130003';//6e40ffe3-b5a3-f393-e0a9-e50e24dcca9e';
const CHAR_DEVICE_TO_MOBILE = '7643ffe2-899a-11eb-8dcd-0242ac130003';//6e40ffe2-b5a3-f393-e0a9-e50e24dcca9e';

const decodeBleString = (value: string | undefined | null): string => {
  if (!value) {
    return '';
  }
  return Base64.decode(value);
};

const CommDeviceScreen = ({
  route,
  navigation,
}: StackScreenProps<RootStackParamList, 'CommDevice'>) => {
  // get the device object which was given through navigation params
  const { device } = route.params;

  const [isConnected, setIsConnected] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [myText, setMyText] = useState("Here show log");
  const [dataPhase] = useState();
  // handle the device disconnection
  const disconnectDevice = useCallback(async () => {
    navigation.goBack();
    const isDeviceConnected = await device.isConnected();
    if (isDeviceConnected) {
      await device.cancelConnection();
    }
  }, [device, navigation]);
  var state = 0;
  var data = '';
  var data1 = 0x01020304;
  var data2 = '0';
  
  
  var encryptedArrayHex = [0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00,0x00];
  var key = md5.hex_md5('104729'+ SERVICE_UUID);
  console.log("booking infor:" + key);
  var RandomA = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var RandomB = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var RandomAB = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var RandomBA = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
  var encryptedRBRABytes;
  //generate RandomA
  RandomA[0] = Math.floor( Math.random() * 256);
  RandomA[1] = Math.floor( Math.random() * 256);

  RandomA[2] = Math.floor( Math.random() * 256);
  RandomA[3] = Math.floor( Math.random() * 256);
  
  RandomA[14] = Math.floor(((RandomA[0] + RandomA[1] + RandomA[2] +RandomA[3])) / 256);
  RandomA[15] = (RandomA[0] + RandomA[1] + RandomA[2] +RandomA[3]) % 256;
  
  console.log("crc16 0:" + RandomA[14]);
  console.log("crc16 1:" + RandomA[15]);
  console.log("RandomA CRC:" + RandomA);

  //hard-core to test, comment when real test
  RandomA[0] = 0x12; RandomA[1] = 0x34; RandomA[2] = 0x56; RandomA[3] = 0x78; RandomA[14] = 0x01; RandomA[15] = 0x14;

  var aes_key = new aesjs.ModeOfOperation.ecb(toBytes(key));
  var encryptedRABytes = aes_key.encrypt(RandomA);
  console.log("encrypt RA bytes:" + encryptedRABytes);  
  
  // To print or store the binary data, you may convert it to hex
  var encryptedRAHex = aesjs.utils.hex.fromBytes(encryptedRABytes);
  console.log("encrypt RA Hex:" + encryptedRAHex); 
  
  

  //receive randomA+randomB first from Char 0xFFE2  
  device.monitorCharacteristicForService(SERVICE_UUID , CHAR_DEVICE_TO_MOBILE, (error, characteristic) =>{
    if (error) {
      console.log('Error in monitorCharacteristicForService');
      console.log(error.message);
      return;
    }
    console.log("Receive data FFE3:");
    //console.log(characteristic.uuid, Base64.decode(characteristic.value));
    var dataReceived = Buffer.from(characteristic.value,'base64');
    console.log(characteristic.uuid,dataReceived);
    RandomAB = aes_key.decrypt(dataReceived);
    console.log("RandomAB decrypt bytes:" + RandomAB);
    console.log("RandomAB decrypt hex:" + aesjs.utils.hex.fromBytes(RandomAB));
    if(RandomAB[0] === RandomA[0] && RandomAB[1] === RandomA[1] && RandomAB[2] === RandomA[2] && RandomAB[3] === RandomA[3])
    {
      console.log("Key is matched");
      RandomBA[0] = RandomAB[4];
      RandomBA[1] = RandomAB[5];
      RandomBA[2] = RandomAB[6];
      RandomBA[3] = RandomAB[7];
      RandomBA[4] = RandomAB[0];
      RandomBA[5] = RandomAB[1];
      RandomBA[6] = RandomAB[2];
      RandomBA[7] = RandomAB[3];
      RandomBA[14] = RandomAB[14];
      RandomBA[15] = RandomAB[15];
      console.log(" RBRA bytes:" + RandomBA); 
      encryptedRBRABytes = aes_key.encrypt(RandomBA);
      console.log("encrypt RBRA bytes:" + encryptedRBRABytes);     
      state = 1;
      console.log("state:" + state);   
      //session Key = toHexArray(MD5(RandomA & RandomB))  
    }   
  });

  //receive notification from Char 0xFFE3
  device.monitorCharacteristicForService(SERVICE_UUID , CHAR_DEVICE_TO_MOBILE_RES, (error, characteristic) =>{
    if (error) {
      console.log('Error in monitorCharacteristicForService');
      console.log(error.message);
      return;
    }
    console.log("Receive data Response on FFE2:");    
    var dataReceived = Buffer.from(characteristic.value,'base64');
    console.log(characteristic.uuid,dataReceived);
  });

  //send RandomA on Char 0xFFE1  
  device.writeCharacteristicWithoutResponseForService(SERVICE_UUID,CHAR_MOBILE_TO_DEVICE,base64.encodeFromByteArray(encryptedRABytes));  
  //send RandomB & RandomA on Char 0xFFE1
  //send RandomB & RandomA after encrypted
  
    
  
  var index = 0;
  const unLock = useCallback(async () => {
    
    // for(index = 0; index < 16; index++){
    //   data = data +' '  + code[index];       
    // }    
    // device.writeCharacteristicWithoutResponseForService(SERVICE_UUID,CHAR_MOBILE_TO_DEVICE,base64.encodeFromByteArray(code))      
    // data = data + '\r\n';
    // setMyText(data)
    // console.log(data);
    
  },[]);

  const lock = useCallback(async () => {
    data = data +  '\n' + data2;
    device.writeCharacteristicWithoutResponseForService(SERVICE_UUID,CHAR_MOBILE_TO_DEVICE,Base64.encode(data2));
    setMyText(data)
    console.log(data);
    const readCharacteristic = await device.readCharacteristicForService(SERVICE_UUID, CHAR_DEVICE_TO_MOBILE_RES); // assuming the device is already connected
    const readValueInBase64 = readCharacteristic.value;
    const readValueInRawBytes = decodeBleString(readValueInBase64);    
    data = data +  '\n' + readValueInRawBytes;
    setMyText(data)
    console.log(readValueInRawBytes);
  },[]);

  const checkStatus = useCallback(async () => {
    const readCharacteristic = await device.readCharacteristicForService(SERVICE_UUID, CHAR_DEVICE_TO_MOBILE_RES); // assuming the device is already connected
    const readValueInBase64 = readCharacteristic.value;
    const readValueInRawBytes = decodeBleString(readValueInBase64);    
    data = data +  '\n' + readValueInRawBytes;
    setMyText(data)
    console.log(readValueInRawBytes);
  },[]);
  
  const testEncrypt = useCallback(async () => {
  },[]);
  
  const testDecrypt = useCallback(async () => {    
  },[]);

  useEffect(() => {
    var oneSecInterval = setInterval(() => {
      if(state === 1){
        state = 2;
        console.log("state:" + state); 
        device.writeCharacteristicWithoutResponseForService(SERVICE_UUID,CHAR_MOBILE_TO_DEVICE,base64.encodeFromByteArray(encryptedRBRABytes));
      }
      if (state == 2) {
          clearInterval(oneSecInterval);
      }
    }, 500);

    const getDeviceInformations = async () => {
      // connect to the device
      const connectedDevice = await device.connect();
      setIsConnected(true);

      // discover all device services and characteristics
      const allServicesAndCharacteristics = await connectedDevice.discoverAllServicesAndCharacteristics();
      // get the services only
      const discoveredServices = await allServicesAndCharacteristics.services();
      setServices(discoveredServices);
    };   
   
    getDeviceInformations();
    device.onDisconnected(() => {
      navigation.navigate('StartScan');
    });     

    
    // give a callback to the useEffect to disconnect the device when we will leave the device screen
    return () => {
      disconnectDevice();
    };
  }, [device, disconnectDevice, navigation]);
  var textStr = "My Changed Text";
  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <Button title="Unlock" onPress={() => setMyText(textStr)} /> */}
      <Button title="Unlock" onPress={unLock} />
      <Button title="Lock" onPress={lock} />
      <Button title="Check Status" onPress={checkStatus} />
      <Button title="disconnect" onPress={disconnectDevice} />
      <Button title="Encrypt" onPress={testEncrypt} />
      <Button title="Decrypt" onPress={testDecrypt} />
      <View>
        <View style={styles.header}>
          <Text>{`MAC : ${device.id}`}</Text>
          <Text>{`Name : ${device.name}`}</Text>
          <Text>{`RSSI : ${device.rssi}`}</Text>
          <Text>{`UUIDS : ${device.serviceUUIDs}`}</Text>
          
          {/* <Text>{`Is connected : ${isConnected}`}</Text>          
          <Text>{`Manufacturer : ${device.manufacturerData}`}</Text>
          <Text>{`ServiceData : ${device.serviceData}`}</Text> */}
          
        </View>
        {/* Display a list of all services */}
        {/* {services &&
          services.map((service) => <ServiceComm service={service} />)} */}
        <Text>Data Log: </Text>
        <Text >{myText} </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },

  header: {
    backgroundColor: 'teal',
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: 'rgba(60,64,67,0.3)',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
    padding: 12,
  },
});

export { CommDeviceScreen };