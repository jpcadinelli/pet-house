import { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Home from '../screens/Home';
import Map from '../screens/Map';
import Profile from '../screens/Profile';

import { styles, tabTheme } from '../../../shared/styles/tabNav.styles';

const Tab = createBottomTabNavigator();
const COMPACT_TAB_BREAKPOINT = 360;

function getTabIcon(routeName, focused) {
  const iconMap = {
    Inicio: focused ? 'paw' : 'paw-outline',
    Mapa: focused ? 'location' : 'location-outline',
    Perfil: focused ? 'person-circle' : 'person-circle-outline',
  };

  return iconMap[routeName] ?? 'ellipse';
}

function renderTabIcon(routeName, focused, color, size) {
  return (
    <View
      style={[
        styles.iconBadge,
        focused ? styles.iconBadgeActive : styles.iconBadgeInactive,
      ]}
    >
      <Ionicons
        name={getTabIcon(routeName, focused)}
        size={focused ? 37 : 35}
        color={color}
      />
    </View>
  );
}

export default function TabNavigator({ authMethod, idUsuario, onLogout, userEmail, userNome }) {
  const [isProfileCameraOpen, setIsProfileCameraOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isCompactTab = width < COMPACT_TAB_BREAKPOINT;
  const tabBarHeight = (isCompactTab ? styles.tabBarCompact.height : styles.tabBar.height) + insets.bottom;
  const tabBarPaddingBottom = Math.max(insets.bottom, isCompactTab ? 8 : 12);

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Inicio"
        screenOptions={({ route }) => ({
          headerShown: false,
          sceneStyle: styles.scene,
          tabBarShowLabel: !isCompactTab,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: tabTheme.activeTint,
          tabBarInactiveTintColor: tabTheme.inactiveTint,
          tabBarInactiveBackgroundColor: tabTheme.inactiveItemBackground,
          tabBarStyle: [
            styles.tabBar,
            isCompactTab && styles.tabBarCompact,
            {
              height: tabBarHeight,
              paddingBottom: tabBarPaddingBottom,
            },
            route.name === 'Perfil' && isProfileCameraOpen && styles.tabBarHidden,
          ],
          tabBarItemStyle: [
            styles.tabItem,
            isCompactTab && styles.tabItemCompact,
          ],
          tabBarIconStyle: isCompactTab ? styles.tabIconStyleCompact : styles.tabIconStyle,
          tabBarLabelStyle: styles.tabLabel,
          tabBarLabel: ({ focused, color }) => (
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.9}
              allowFontScaling={false}
              style={[
                styles.tabLabel,
                focused ? styles.tabLabelActive : styles.tabLabelInactive,
                { color },
              ]}
            >
              {route.name}
            </Text>
          ),
          tabBarIcon: ({ color, focused, size }) =>
            renderTabIcon(route.name, focused, color, size),
        })}
      >
        <Tab.Screen name="Mapa" component={Map} />

        <Tab.Screen name="Inicio" component={Home} />

        <Tab.Screen name="Perfil">
          {() => (
            <Profile
              authMethod={authMethod}
              onLogout={onLogout}
              onCameraVisibilityChange={setIsProfileCameraOpen}
              userEmail={userEmail}
              idUsuario={idUsuario}
              userNome={userNome}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}
