import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeScreen } from '../screens/Home';
import { DeviceScreen } from '../screens/Device';
import {StartScreen} from '../screens/StartScan';
import {CommDeviceScreen} from '../screens/CommDevice';
import { Device } from 'react-native-ble-plx';

export type RootStackParamList = {
  StartScan: undefined;
  CommDevice: { device: Device};
  Home: undefined;
  Device: { device: Device };
};

const Stack = createStackNavigator<RootStackParamList>();

export const RootNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="StartScan" component={StartScreen}/>
      <Stack.Screen name="CommDevice" component={CommDeviceScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Device" component={DeviceScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);