import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';
import { SecureScreen } from './src/features/auth/screens/SecureScreen';
import { HomeScreen } from './src/features/home/screens/HomeScreen';
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from './src/features/auth/storage/authStorage';
import { initDatabase, getDB } from './src/features/database/db';

import {
  createUser,
  getUserByEmail,
  loginUser,
} from './src/features/database/consultas/usuario';

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
      let session = await getAuthSession();

      if (session?.isLoggedIn && session.userId && !session.idUsuario) {
        session = {
          ...session,
          idUsuario: session.userId,
        };
        delete session.userId;
        await saveAuthSession(session);
      }

      if (session?.isLoggedIn && session.email && !session.idUsuario) {
        const usuario = getUserByEmail(getDB(), session.email.trim().toLowerCase());

        if (usuario) {
          session = {
            ...session,
            idUsuario: String(usuario.id),
            nome: usuario.nome,
          };
          await saveAuthSession(session);
        } else {
          await clearAuthSession();
          session = null;
        }
      }

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

  const handleRegister = async ({ nome, email, password }) => {
    try {
      createUser(
        getDB(),
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
    const usuario = loginUser(getDB(), normalizedEmail, password);

    if (!usuario) {
      Alert.alert(
        'Credenciais invalidas',
        'Email ou senha incorretos.'
      );
      return;
    }

    const nextSession = {
      isLoggedIn: true,
      idUsuario: String(usuario.id),
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
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SafeAreaProvider>
          <SecureScreen
            authMethod={authMethod}
            userEmail={savedSession?.email}
            idUsuario={savedSession?.idUsuario}
            userNome={savedSession?.nome}
            onLogout={handleLogout}
          />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <HomeScreen
          biometria={biometria}
          hasSavedBiometricLogin={Boolean(savedSession?.isLoggedIn && savedSession?.biometricEnabled)}
          onBiometricLogin={handleBiometricAccess}
          onCredentialLogin={handleCredentialLogin}
          onRegister={handleRegister}
        />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
});
