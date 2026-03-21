import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity } from 'react-native';
import { appStyles } from '../../../shared/styles/app.styles';

import TabNavigator from '../../tabs/navigation/TabNavigator';

export function SecureScreen({ onLogout }) {
  return (
    <View style={appStyles.container}>

      <View style={{ flex: 1, width: "100%" }}>
        <TabNavigator onLogout={onLogout} />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}
