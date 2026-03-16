import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import Home from "../screens/Home";
import Map from "../screens/Map";
import Profile from "../screens/Profile";

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#007AFF",
        }}>
        
        <Tab.Screen 
          name="Início" 
          component={Home} 
        />

        <Tab.Screen 
          name="Mapa" 
          component={Map} 
        />

        <Tab.Screen 
          name="Perfil" 
          component={Profile} 
        />

      </Tab.Navigator>
    </NavigationContainer>
  );
}