import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
// import CreateInvitation from './Screen/CreateInvitaion';
import Home from './Screen/Home';
import ScanInvitaion from './Screen/ScanInvitaion';
import Login from './Screen/Login';
import { Ionicons } from '@expo/vector-icons'; 
// import { useFonts } from 'expo-font';
import { useFonts,Comfortaa_300Light, Comfortaa_400Regular, Comfortaa_700Bold } from '@expo-google-fonts/comfortaa';
import VoirInvitations from './Screen/VoirInvitations';
import NavigatorStack from './Screen/NavigatorStack';
import { useEffect, useState } from 'react';
import { getToken } from './lib/api';


const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppInner />
    </SafeAreaProvider>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  
    let [fontsLoaded, fontError] = useFonts({
    Comfortaa_300Light, 
    Comfortaa_400Regular, 
    Comfortaa_700Bold
    });

    const [authChecked, setAuthChecked] = useState(false);
    const [authed, setAuthed] = useState(false);

    useEffect(() => {
      getToken().then((t) => { setAuthed(!!t); setAuthChecked(true); });
    }, []);

    if (!fontsLoaded && !fontError) {
      return null;
    }
    if (!authChecked) {
      return <View style={{ flex:1, justifyContent:'center', alignItems:'center' }}><ActivityIndicator/></View>;
    }
    if (!authed) {
      return <Login onLoggedIn={() => setAuthed(true)} />;
    }
 
 
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'NavigatorStack') iconName = focused ? 'qr-code' : 'qr-code-outline';
            else if (route.name === 'VoirInvitations') iconName = focused ? 'time' : 'time-outline';
            return <Ionicons name={iconName} size={focused ? size + 2 : size} color={color} />;
          },
          tabBarActiveTintColor: '#F06292',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarItemStyle: {
            borderRadius: 12,
            paddingVertical: 4,
          },
          tabBarStyle: {
            borderRadius: 20,
            position: 'absolute',
            bottom: Math.max(insets.bottom, 10),
            right: 16,
            left: 16,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
            paddingHorizontal: 6,
            backgroundColor: '#fff',
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 12,
            borderTopWidth: 0,
          },
          tabBarLabelStyle: {
            fontFamily: 'Comfortaa_700Bold',
            fontSize: 11,
            marginTop: 2,
          },
        })}
      >
        <Tab.Screen name="Home" options={{ title: 'Accueil' }}>
          {() => <Home onLogout={() => setAuthed(false)} />}
        </Tab.Screen>
        <Tab.Screen name="NavigatorStack" component={NavigatorStack} options={{ title: 'Scanner' }} />
        <Tab.Screen name="VoirInvitations" component={VoirInvitations} options={{ title: 'Historique' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
