import { StyleSheet } from 'react-native';

export const tabTheme = {
  background: '#F4F8FC',
  tabBarBackground: '#0B3C78',
  activeTint: '#FFFFFF',
  inactiveTint: '#9FC2F1',
  accent: '#84BE12',
  border: '#1A5BAA',
  shadow: '#06264D',
  inactiveItemBackground: 'transparent',
  inactiveIconBackground: 'rgba(255, 255, 255, 0.06)',
};

export const styles = StyleSheet.create({
  scene: {
    backgroundColor: tabTheme.background,
  },
  tabBar: {
    height: 78,
    paddingTop: 8,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderColor: tabTheme.border,
    backgroundColor: tabTheme.tabBarBackground,
    shadowColor: tabTheme.shadow,
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 14,
  },
  tabBarCompact: {
    height: 64,
    paddingTop: 6,
    paddingHorizontal: 8,
  },
  tabBarHidden: {
    display: 'none',
  },
  tabItem: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 4,
    borderRadius: 18,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemCompact: {
    marginHorizontal: 2,
    paddingVertical: 4,
  },
  tabIconStyle: {
    marginBottom: 17,
  },
  tabIconStyleCompact: {
    marginBottom: 0,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 13,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabLabelActive: {
    color: tabTheme.activeTint,
  },
  tabLabelInactive: {
    color: tabTheme.inactiveTint,
  },
  iconBadge: {
    width: 55,
    height: 55,
    borderRadius: '50%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeActive: {
    backgroundColor: tabTheme.accent,
    shadowColor: tabTheme.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  iconBadgeInactive: {
    backgroundColor: tabTheme.inactiveIconBackground,
  },
});
