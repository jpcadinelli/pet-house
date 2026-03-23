import { StyleSheet } from 'react-native';

export const tabTheme = {
  background: '#F4F8FC',
  tabBarBackground: '#0B3C78',
  activeTint: '#FFFFFF',
  inactiveTint: '#9FC2F1',
  accent: '#84BE12',
  border: '#1A5BAA',
  shadow: '#06264D',
};

export const styles = StyleSheet.create({
  scene: {
    backgroundColor: tabTheme.background,
  },
  tabBar: {
    position: 'absolute',
    marginHorizontal: 24,
    bottom: 18,
    height: 62,
    marginHorizontal: 24,

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
  tabItem: {
    marginHorizontal: 6,
    borderRadius: 20,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: -4,
  },
  tabIconStyle: {
    marginTop: -4,
  },
  iconContainer: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBackground: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 30,
    backgroundColor: tabTheme.accent,
    transform: [{ translateY: 6 }],
  },
});