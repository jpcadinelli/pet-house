import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import Home from '../screens/Home';
import Map from '../screens/Map';
import Profile from '../screens/Profile';

import { styles, tabTheme } from '../../../shared/styles/tabNav.styles';

const Tab = createBottomTabNavigator();

function getTabIcon(routeName, focused) {
  const iconMap = {
    Inicio: focused ? 'paw' : 'paw-outline',
    Mapa: focused ? 'location' : 'location-outline',
    Perfil: focused ? 'person-circle' : 'person-circle-outline',
  };

  return iconMap[routeName] ?? 'ellipse';
}

export default function TabNavigator({ authMethod, onLogout, userEmail }) {
  return (
    <NavigationContainer> 
      <Tab.Navigator
        initialRouteName="Mapa"
        screenOptions={({ route }) => ({
          headerShown: false,
          sceneStyle: styles.scene,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: tabTheme.activeTint,
          tabBarInactiveTintColor: tabTheme.inactiveTint,
          tabBarStyle: styles.tabBar,
          tabBarItemStyle: styles.tabItem,
          tabBarLabelStyle: styles.tabLabel,
          tabBarIconStyle: styles.tabIconStyle,
          
          tabBarIcon: ({ color, focused, size }) => (
            <View style={styles.iconContainer}>
              {focused && <View style={styles.activeBackground} />}
                
              <Ionicons
                name={getTabIcon(route.name, focused)}
                size={focused ? size + 2 : size}
                color={color}
              />
            </View>
          ),
        })}
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
