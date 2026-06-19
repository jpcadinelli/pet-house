import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, AppState, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { SecureScreen } from './src/features/auth/screens/SecureScreen';
import { HomeScreen } from './src/features/home/screens/HomeScreen';
import {
  clearAuthSession,
  getAuthSession,
  saveAuthSession,
} from './src/features/auth/storage/authStorage';
import { initDatabase, getDB } from './src/features/database/db';

import {
  atualizarFirebaseUidUsuario,
  createUser,
  getUserByEmail,
} from './src/features/database/consultas/usuario';
import {
  cadastrarUsuarioFirebase,
  loginUsuarioFirebase,
  salvarPerfilUsuarioFirebase,
} from './src/features/firebase/firebaseAuthService';
import {
  sincronizarAoAbrirApp,
  sincronizarAoVoltarParaPrimeiroPlano,
} from './src/features/sync/services/autoSyncService';

export default function App() {
  const [biometria, setBiometria] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [savedSession, setSavedSession] = useState(null);
  const appStateRef = useRef(AppState.currentState);

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
            firebase_uid: usuario.firebase_uid || session.firebase_uid,
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
      sincronizarAoAbrirApp(session.idUsuario);
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
      sincronizarAoAbrirApp(savedSession?.idUsuario);
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
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const usuarioExistente = getUserByEmail(getDB(), normalizedEmail);

      if (usuarioExistente?.firebase_uid) {
        Alert.alert('Erro', 'Já existe uma conta local com este email.');
        return;
      }

      const firebaseUid = await cadastrarUsuarioFirebase(normalizedEmail, password);
      const nomePerfil = usuarioExistente?.nome || nome;

      if (usuarioExistente) {
        atualizarFirebaseUidUsuario(getDB(), usuarioExistente.id, firebaseUid);
      } else {
        createUser(
          getDB(),
          nome,
          normalizedEmail,
          password,
          firebaseUid
        );
      }

      await salvarPerfilUsuarioFirebase(firebaseUid, {
        nome: nomePerfil,
        email: normalizedEmail,
      });

      Alert.alert(
        'Sucesso',
        usuarioExistente
          ? 'Conta local vinculada ao Firebase com sucesso!'
          : 'Conta criada com sucesso!'
      );
    } catch (error) {
      console.error('Erro ao cadastrar:', error);

      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : String(error)
      );
    }
  };

  const handleCredentialLogin = async ({ email, password, biometricEnabled }) => {
    const normalizedEmail = email.trim().toLowerCase();

    try {
      const firebaseUid = await loginUsuarioFirebase(normalizedEmail, password);
      let usuario = getUserByEmail(getDB(), normalizedEmail);

      if (usuario?.firebase_uid && usuario.firebase_uid !== firebaseUid) {
        Alert.alert(
          'Conta divergente',
          'Usuário Firebase diferente do usuário local. Faça logout e login novamente.'
        );
        return;
      }

      if (usuario && !usuario.firebase_uid) {
        atualizarFirebaseUidUsuario(getDB(), usuario.id, firebaseUid);
        usuario = {
          ...usuario,
          firebase_uid: firebaseUid,
        };
      }

      if (!usuario) {
        const nomeBasico = normalizedEmail.split('@')[0] || 'Usuário';
        const resultado = createUser(getDB(), nomeBasico, normalizedEmail, password, firebaseUid);
        usuario = {
          id: resultado.lastInsertRowId,
          nome: nomeBasico,
          email: normalizedEmail,
          firebase_uid: firebaseUid,
        };
      }

      const nextSession = {
        isLoggedIn: true,
        idUsuario: String(usuario.id),
        nome: usuario.nome,
        email: normalizedEmail,
        firebase_uid: firebaseUid,
        biometricEnabled,
        loginMethod: biometricEnabled ? 'biometria' : 'email_password',
      };

      await saveAuthSession(nextSession);
      setSavedSession(nextSession);
      setAuthMethod('email_password');
      setAuthenticated(true);
      sincronizarAoAbrirApp(nextSession.idUsuario);
    } catch (error) {
      Alert.alert(
        'Credenciais invalidas',
        error instanceof Error
          ? error.message
          : 'Email ou senha incorretos. Faça login com internet para validar sua conta no Firebase.'
      );
    }
  };

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const wasInactive = /inactive|background/.test(appStateRef.current);
      const isActiveNow = nextAppState === 'active';

      if (wasInactive && isActiveNow && authenticated && savedSession?.idUsuario) {
        sincronizarAoVoltarParaPrimeiroPlano(savedSession.idUsuario);
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [authenticated, savedSession?.idUsuario]);

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
