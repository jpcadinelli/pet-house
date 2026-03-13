import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { appStyles } from '../../../shared/styles/app.styles';

export function SecureScreen() {
  const [access, setAccess] = useState(false);

  useEffect(() => {
    (async () => {
      const authentication = await LocalAuthentication.authenticateAsync();
      if (authentication.success) {
        setAccess(true);
      } else {
        setAccess(false);
      }
    })();
  }, []);

  return (
    <View style={appStyles.container}>
      {access && <Text>Usuário logado com sucesso!</Text>}
      <StatusBar style="auto" />
    </View>
  );
}
