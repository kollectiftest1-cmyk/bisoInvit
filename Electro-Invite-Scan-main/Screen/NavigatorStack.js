import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import CreateInvitation from './CreateInvitaion';
// import GenerateInvit from './GenerateInvit';
import ResultScan from './ResultScan';
import ScanInvitaion from './ScanInvitaion';

const Stack = createNativeStackNavigator();


const NavigatorStack = () => {
  return (
    <Stack.Navigator>
      {/* <Stack.Screen name="CreateInvitation" component={CreateInvitation} /> */}
      {/* <Stack.Screen name="GenerateInvit" component={GenerateInvit}  options={{headerShown:false}} /> */}
      <Stack.Screen name="ScanInvitaion" component={ScanInvitaion}  options={{headerShown:false}} />
      <Stack.Screen name="ResultScan" component={ResultScan}  options={{headerShown:false}} />
      {/* <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="Settings" component={Settings} /> */}
    </Stack.Navigator>
  );
};

export default NavigatorStack
