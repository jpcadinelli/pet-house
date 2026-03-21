import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { appStyles } from '../../../shared/styles/app.styles';

import TabNavigator from '../../tabs/navigation/TabNavigator';

export function SecureScreen({ authMethod, onLogout, userEmail }) {
  return (
    <View style={appStyles.container}>
      <View style={{ flex: 1, width: '100%' }}>
        <TabNavigator authMethod={authMethod} onLogout={onLogout} userEmail={userEmail} />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}
