import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { appStyles } from './src/shared/styles/app.styles';
import { SecureScreen } from './src/features/auth/screens/SecureScreen';

export default function App() {
  const [biometria, setBiometria] = useState(false);
  const [render, setRender] = useState(false);

  const changeRender = () => setRender(true)

  useEffect(() => {
    (async () => {
      const compativel = await LocalAuthentication.hasHardwareAsync();
      setBiometria(compativel);
    })();
  }, []);

  if (render) {
    return (
      <SecureScreen />
    )
  } else {
    return (
      <View style={appStyles.container}>
        <Text style={appStyles.bodyText}>
          {biometria
            ? 'Faça o login com biometria'
            : 'Dispositivo n"ao cmpativel com biometrias'
          }
        </Text>
        <TouchableOpacity style={appStyles.button} onPress={changeRender} activeOpacity={0.85}>
          <Text style={appStyles.buttonText}>Logar</Text>
        </TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  }
}
