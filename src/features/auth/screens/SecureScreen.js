import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity } from 'react-native';
import { appStyles } from '../../../shared/styles/app.styles';

import TabNavigator from '../../tabs/navigation/TabNavigator';

export function SecureScreen({ onLogout }) {
  return (
    <View style={appStyles.container}>
      <Text>Usuário logado com sucesso!</Text>
      
      <TouchableOpacity style={appStyles.button} onPress={onLogout} activeOpacity={0.85}>
        <Text style={appStyles.buttonText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ flex: 1, width: "100%" }}>
        <TabNavigator />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}
