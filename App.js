import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { SecureScreen } from './src/features/auth/screens/SecureScreen';
import { HomeScreen } from './src/features/home/screens/HomeScreen';

export default function App() {
  const [biometria, setBiometria] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    (async () => {
      const compativel = await LocalAuthentication.hasHardwareAsync();
      const tipos = await LocalAuthentication.supportedAuthenticationTypesAsync();
      console.log('Tipos de biometria suportados:', tipos);
      setBiometria(compativel);
    })();
  }, []);

  const handleLogin = async () => {
    if (!biometria) {
      Alert.alert('Erro', 'Seu dispositivo não suporta biometria.');
      return;
    }

    const authentication = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique-se para continuar',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar senha',
    });

    if (authentication.success) {
      setAuthenticated(true);
    } else {
      Alert.alert('Falha na autenticação', 'Não foi possível realizar o login.');
    }
  };

  const handleLogout = () => {
    setAuthenticated(false);
  };

  if (authenticated) {
    return <SecureScreen onLogout={handleLogout} />;
  } else {
    return <HomeScreen biometria={biometria} onLogin={handleLogin} />;
  }
}
