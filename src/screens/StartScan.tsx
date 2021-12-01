import React, { useEffect, useReducer, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  FlatList,
  StyleSheet,
  Text,
  View,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { DeviceCard } from '../components/DeviceCard';
import { BleManager, Device } from 'react-native-ble-plx';
import { theme } from '../theme';
import md5 from 'react-native-md5'
import {toHex, toBytes} from 'hex-my-bytes'
import aesjs from 'aes-js';
import crc from 'crc';

const manager = new BleManager();
// constructor() {
//   super();
//   this.manager = new BleManager();
//   ...
// }
// Reducer to add only the devices which have not been added yet
// When the bleManager search for devices, each time it detect a ble device, it returns the ble device even if this one has already been returned
const reducer = (
  state: Device[],
  action: { type: 'ADD_DEVICE'; payload: Device } | { type: 'CLEAR' },
): Device[] => {
  switch (action.type) {
    case 'ADD_DEVICE':
      const { payload: device } = action;

      // check if the detected device is not already added to the list
      if (device && !state.find((dev) => dev.id === device.id)) {
        return [...state, device];
      }
      return state;
    case 'CLEAR':
      return [];
    default:
      return state;
  }
};

const StartScreen = () => {
  const [inputUUID, setText] = useState('');

  var uuid_input = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';//inputUUID; //'6e400001-b5a3-f393-e0a9-e50e24dcca9e';// 6e400001-b5a3-f393-e0a9-e50e24dcca9e //00001523-1212-efde-1523-785feabcd123//76434400-899a-11eb-8dcd-0242ac130003
  // reducer to store and display detected ble devices
  const [scannedDevices, dispatch] = useReducer(reducer, []);

  // state to give the user a feedback about the manager scanning devices
  const [isLoading, setIsLoading] = useState(false);

  const scanDevices = () => {
    //dispatch({ type: 'CLEAR' });

    // display the Activityindicator
    setIsLoading(true);
    var i = 0;
    var j = 0;
    // stop scanning devices after 5 seconds
    setTimeout(() => {
      try{
        manager.stopDeviceScan();
      }
      catch(e){
        console.log("stop error:"+e);
      }
      setIsLoading(false);
    }, 10000);
    // scan devices
    manager.startDeviceScan(null, null, (error, scannedDevice) => {
      if (error) {
        console.warn(error);
      }

      //if a device is detected add the device to the list by dispatching the action into the reducer
      if (scannedDevice) {
        dispatch({ type: 'ADD_DEVICE', payload: scannedDevice });        
      }
     
      if(scannedDevice.name == 'Combros_BLE'){
        try{
          manager.stopDeviceScan();
        }
        catch(e){
          console.log("stop error:"+e);
        }
        
        
        setIsLoading(false);
      }
      else{
        dispatch({ type: 'CLEAR' });
      }      
      
      // try{
      //   i++;
      //   if(i>50){
      //     i = 0;
      //      manager.stopDeviceScan();
      //      setIsLoading(false);
      //   }
      //   if(scannedDevice.serviceUUIDs[i] !== null){
      //     if(scannedDevice.serviceUUIDs[i] === uuid_input){

      //       console.log("Got it");            
      //       manager.stopDeviceScan();
      //       setIsLoading(false);
      //     }      
      //     else{
      //       console.log('Diff uuid:' + scannedDevice.serviceUUIDs[i]);
      //       dispatch({ type: 'CLEAR' });
      //     }
      //   }
      //   else{
      //     console.log('Null');
      //     dispatch({ type: 'CLEAR' });
      //   }   

      // }
      // catch(e){
      //   console.log('Error');
      //   dispatch({ type: 'CLEAR' });
      // }
      
      
    });

    
  };


  const ListHeaderComponent = () => (
    <View style={styles.body}>
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>BLE IoT AES</Text>
      </View>
      <View style={styles.sectionContainer}>
        <Button
          title="Clear devices"
          onPress={() => dispatch({ type: 'CLEAR' })}
        />
        <TextInput style={styles.input}                    
                     placeholder="iBeacon UUID"
                     onChangeText={inputUUID =>setText(inputUUID)}
                     defaultValue={'6e400001-b5a3-f393-e0a9-e50e24dcca9e'}
                     />
        <TextInput style={styles.input}                    
                     placeholder="iBeacon major + minor"/>
        <TextInput style={styles.input}                    
                     placeholder="Booking UUID"/>
        <TextInput style={styles.input}                   
                     placeholder="User ID"/>  

        
        {isLoading ? (
          <View style={styles.activityIndicatorContainer}>
            <ActivityIndicator color={'teal'} size={25} />
          </View>
        ) : (
          <Button title="Scan devices" onPress={scanDevices} />
        )}
      </View>
    </View>
  );

  useEffect(() => {
    return () => {
      manager.destroy();
    };
  }, []);
  return (
    <SafeAreaView style={styles.body}>
      <FlatList
        keyExtractor={(item) => item.id}
        data={scannedDevices}
        renderItem={({ item }) => <DeviceCard device={item} />}
        ListHeaderComponent={ListHeaderComponent}
        contentContainerStyle={styles.content}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  body: {
    backgroundColor: Colors.red,
  },
  sectionContainer: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.black,
  },
  sectionDescription: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: '400',
    color: Colors.dark,
  },
  content: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing * 2,
  },
  activityIndicatorContainer: { marginVertical: 6 },
  input: {
    height: 40,
    width: 300,
    margin: 12,
    borderWidth: 1,
    padding: 10,
  },
});

export { StartScreen };