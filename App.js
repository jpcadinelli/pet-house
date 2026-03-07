import { StatusBar } from 'expo-status-bar';
import { Text, View, TouchableOpacity } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import { appStyles } from './src/shared/styles/app.styles';

export function TelaSegura() {
  const [access, setAccess] = useState(false);

  useEffect(() => {
    (async () => {
      const authentication = await LocalAuthentication.authenticateAsync();
      if (authentication.success)
        setAccess(true)
      else
        setAccess(false)
    })();
  }, []);

  return (
    <View style={appStyles.container}>
      {access && (
        <Text>Usuário logado com sucesso!</Text>
      )}
    </View>
  )

}

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
      <TelaSegura />
    )
  } else {
    return (
      <View style={appStyles.container}>
        <Text>
          {biometria
            ? 'Faça o login com biometria'
            : 'Dispositivo n"ao cmpativel com biometrias'
          }
        </Text>
        <TouchableOpacity onPress={changeRender}><Text>Logar</Text></TouchableOpacity>
        <StatusBar style="auto" />
      </View>
    );
  }
}
