import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import Home from '../screens/Home';
import Map from '../screens/Map';
import Profile from '../screens/Profile';

const Tab = createBottomTabNavigator();

const tabTheme = {
  background: '#F4F8FC',
  tabBarBackground: '#0B3C78',
  activeTint: '#FFFFFF',
  inactiveTint: '#9FC2F1',
  accent: '#84BE12',
  border: '#1A5BAA',
  shadow: '#06264D',
};

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
          sceneStyle: {
            backgroundColor: tabTheme.background,
          },
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: tabTheme.activeTint,
          tabBarInactiveTintColor: tabTheme.inactiveTint,
          tabBarStyle: {
            position: 'absolute',
            left: 18,
            right: 18,
            bottom: 18,
            height: 72,
            paddingTop: 10,
            paddingBottom: 10,
            borderTopWidth: 0,
            borderWidth: 1,
            borderColor: tabTheme.border,
            borderRadius: 28,
            backgroundColor: tabTheme.tabBarBackground,
            shadowColor: tabTheme.shadow,
            shadowOffset: { width: 0, height: 14 },
            shadowOpacity: 0.22,
            shadowRadius: 20,
            elevation: 10,
          },
          tabBarItemStyle: {
            marginHorizontal: 6,
            borderRadius: 20,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '700',
            marginTop: 2,
          },
          tabBarIconStyle: {
            marginTop: 2,
          },
          tabBarIcon: ({ color, focused, size }) => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: focused ? tabTheme.accent : 'transparent',
              }}
            >
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
