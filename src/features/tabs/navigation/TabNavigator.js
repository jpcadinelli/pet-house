import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Home from '../screens/Home';
import Map from '../screens/Map';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();

export default function TabNavigator({ authMethod, onLogout, userEmail }) {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#007AFF',
        }}
      >
        <Tab.Screen name="Inicio" component={Home} />

        <Tab.Screen name="Mapa" component={Map} />

        <Tab.Screen name="Perfil">
          {() => (
            <Profile authMethod={authMethod} onLogout={onLogout} userEmail={userEmail} />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
