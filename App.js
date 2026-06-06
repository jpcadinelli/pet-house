import * as LocalAuthentication from 'expo-local-authentication';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { SecureScreen } from './src/features/auth/screens/SecureScreen';
import { HomeScreen } from './src/features/home/screens/HomeScreen';
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from './src/features/auth/storage/authStorage';
import { 
  initDatabase, 
  loginUser,
createUser, 
} from './src/features/database/db';

export default function App() {
  const [biometria, setBiometria] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [savedSession, setSavedSession] = useState(null);

  useEffect(() => {
    (async () => {
      initDatabase();

      const compativel = await LocalAuthentication.hasHardwareAsync();
      const session = await getAuthSession();

      setBiometria(compativel);
      setSavedSession(session);

      if (!session?.isLoggedIn) {
        setSessionLoaded(true);
        return;
      }

      if (session.biometricEnabled) {
        setSessionLoaded(true);
        return;
      }

      setAuthMethod('email_password');
      setAuthenticated(true);
      setSessionLoaded(true);
    })();
  }, []);

  const handleBiometricAccess = async () => {
    if (!biometria) {
      Alert.alert('Erro', 'Seu dispositivo nao suporta biometria.');
      return;
    }

    const authentication = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Autentique-se para continuar',
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar senha',
    });

    if (authentication.success) {
      setAuthMethod('biometria');
      setAuthenticated(true);
    } else {
      Alert.alert('Falha na autenticacao', 'Nao foi possivel realizar o login.');
    }
  };

  useEffect(() => {
    if (!sessionLoaded || !savedSession?.isLoggedIn || !savedSession?.biometricEnabled || authenticated) {
      return;
    }

    handleBiometricAccess();
  }, [authenticated, savedSession, sessionLoaded]);

  const handleRegister = async ({
      nome,
      email,
      password,
  }) => {
    try {
      createUser(
        nome,
        email.trim().toLowerCase(),
        password
      );

      Alert.alert(
        'Sucesso',
        'Conta criada com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao cadastrar:', error);

      Alert.alert(
        'Erro',
        String(error)
      );
    }
  };

  const handleCredentialLogin = async ({ email, password, biometricEnabled }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const usuario = loginUser(normalizedEmail, password);

    if (!usuario) {
      Alert.alert(
        'Credenciais invalidas',
        'Email ou senha incorretos.'
      );
      return;
    }

    const nextSession = {
      isLoggedIn: true,
      nome: usuario.nome,
      email: normalizedEmail,
      biometricEnabled,
      loginMethod: biometricEnabled ? 'biometria' : 'email_password',
    };

    await saveAuthSession(nextSession);
    setSavedSession(nextSession);
    setAuthMethod('email_password');
    setAuthenticated(true);
  };

  const handleLogout = async () => {
    await clearAuthSession();
    setSavedSession(null);
    setAuthMethod(null);
    setAuthenticated(false);
  };

  if (!sessionLoaded) {
    return null;
  }

  if (authenticated) {
    return (
      <SafeAreaProvider>
        <SecureScreen
          authMethod={authMethod}
          userEmail={savedSession?.email}
          userNome={savedSession?.nome}
          onLogout={handleLogout}
        />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <HomeScreen
        biometria={biometria}
        hasSavedBiometricLogin={Boolean(savedSession?.isLoggedIn && savedSession?.biometricEnabled)}
        onBiometricLogin={handleBiometricAccess}
        onCredentialLogin={handleCredentialLogin}
        onRegister={handleRegister}
      />
    </SafeAreaProvider>
  );
}
