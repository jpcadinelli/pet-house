const React = require('react');
const { afterEach, beforeEach, describe, expect, jest, test } = require('@jest/globals');
const { Alert } = require('react-native');
const { fireEvent, render, waitFor } = require('@testing-library/react-native');

const mockDb = { name: 'db-fake' };
const mockHasHardwareAsync = jest.fn();
const mockAuthenticateAsync = jest.fn();
const mockInitDatabase = jest.fn();
const mockGetDB = jest.fn(() => mockDb);
const mockGetAuthSession = jest.fn();
const mockSaveAuthSession = jest.fn();
const mockClearAuthSession = jest.fn();
const mockAtualizarFirebaseUidUsuario = jest.fn();
const mockCreateUser = jest.fn();
const mockGetUserByEmail = jest.fn();
const mockCadastrarUsuarioFirebase = jest.fn();
const mockLoginUsuarioFirebase = jest.fn();
const mockSalvarPerfilUsuarioFirebase = jest.fn();
const mockHomeScreen = jest.fn();
const mockSecureScreen = jest.fn();

jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: mockHasHardwareAsync,
  authenticateAsync: mockAuthenticateAsync,
}));

jest.mock('../src/features/database/db', () => ({
  initDatabase: mockInitDatabase,
  getDB: mockGetDB,
}));

jest.mock('../src/features/auth/storage/authStorage', () => ({
  clearAuthSession: mockClearAuthSession,
  getAuthSession: mockGetAuthSession,
  saveAuthSession: mockSaveAuthSession,
}));

jest.mock('../src/features/database/consultas/usuario', () => ({
  atualizarFirebaseUidUsuario: mockAtualizarFirebaseUidUsuario,
  createUser: mockCreateUser,
  getUserByEmail: mockGetUserByEmail,
}));

jest.mock('../src/features/firebase/firebaseAuthService', () => ({
  cadastrarUsuarioFirebase: mockCadastrarUsuarioFirebase,
  loginUsuarioFirebase: mockLoginUsuarioFirebase,
  salvarPerfilUsuarioFirebase: mockSalvarPerfilUsuarioFirebase,
}));

jest.mock('../src/features/home/screens/HomeScreen', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    HomeScreen: (props) => {
      mockHomeScreen(props);

      return React.createElement(View, { testID: 'mock-home-screen' },
      React.createElement(Text, null, `HomeScreen biometria:${props.biometria}`),
      React.createElement(Text, null, `Sessao biometrica:${props.hasSavedBiometricLogin}`),
      React.createElement(Pressable, {
        testID: 'credential-login',
        onPress: () => props.onCredentialLogin({
          email: ' USUARIO@EMAIL.COM ',
          password: 'senha123',
          biometricEnabled: true,
        }),
      }, React.createElement(Text, null, 'Login com credenciais')),
      React.createElement(Pressable, {
        testID: 'register-user',
        onPress: () => props.onRegister({
          nome: 'Ana',
          email: ' ANA@EMAIL.COM ',
          password: 'nova-senha',
        }),
      }, React.createElement(Text, null, 'Cadastrar usuário')),
      React.createElement(Pressable, {
        testID: 'biometric-login',
        onPress: props.onBiometricLogin,
      }, React.createElement(Text, null, 'Login biométrico'))
      );
    },
  };
});

jest.mock('../src/features/auth/screens/SecureScreen', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    SecureScreen: (props) => {
      mockSecureScreen(props);

      return React.createElement(View, { testID: 'mock-secure-screen' },
      React.createElement(Text, null, `SecureScreen:${props.authMethod}:${props.idUsuario}:${props.userEmail}:${props.userNome}`),
      React.createElement(Pressable, {
        testID: 'logout-button',
        onPress: props.onLogout,
      }, React.createElement(Text, null, 'Sair'))
      );
    },
  };
});

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');

  return {
    SafeAreaProvider: ({ children }) => React.createElement(React.Fragment, null, children),
  };
});

const App = require('../App').default;

describe('App', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasHardwareAsync.mockResolvedValue(true);
    mockAuthenticateAsync.mockResolvedValue({ success: true });
    mockGetAuthSession.mockResolvedValue(null);
    mockSaveAuthSession.mockResolvedValue(undefined);
    mockClearAuthSession.mockResolvedValue(undefined);
    mockCadastrarUsuarioFirebase.mockResolvedValue('firebase-uid-cadastro');
    mockLoginUsuarioFirebase.mockResolvedValue('firebase-uid-login');
    mockSalvarPerfilUsuarioFirebase.mockResolvedValue(undefined);
    mockCreateUser.mockReturnValue({ lastInsertRowId: 99, changes: 1 });
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('inicializa banco, carrega sessão e exibe login quando não há sessão salva', async () => {
    const { getByTestId, getByText } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());

    expect(mockInitDatabase).toHaveBeenCalledTimes(1);
    expect(mockHasHardwareAsync).toHaveBeenCalledTimes(1);
    expect(mockGetAuthSession).toHaveBeenCalledTimes(1);
    expect(getByText('HomeScreen biometria:true')).toBeTruthy();
    expect(getByText('Sessao biometrica:false')).toBeTruthy();
  });

  test('normaliza email, salva sessão e autentica no login por credenciais', async () => {
    mockGetUserByEmail.mockReturnValueOnce({ id: 7, nome: 'Ana', firebase_uid: 'firebase-uid-login' });
    const { getByTestId, getByText } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());
    await fireEvent.press(getByTestId('credential-login'));

    await waitFor(() => expect(getByTestId('mock-secure-screen')).toBeTruthy());

    expect(mockLoginUsuarioFirebase).toHaveBeenCalledWith('usuario@email.com', 'senha123');
    expect(mockGetUserByEmail).toHaveBeenCalledWith(mockDb, 'usuario@email.com');
    expect(mockSaveAuthSession).toHaveBeenCalledWith({
      isLoggedIn: true,
      idUsuario: '7',
      nome: 'Ana',
      email: 'usuario@email.com',
      biometricEnabled: true,
      firebase_uid: 'firebase-uid-login',
      loginMethod: 'biometria',
    });
    expect(getByText('SecureScreen:email_password:7:usuario@email.com:Ana')).toBeTruthy();
  });

  test('alerta e mantém login quando credenciais são inválidas', async () => {
    mockLoginUsuarioFirebase.mockRejectedValueOnce(new Error('Firebase indisponível'));
    const { getByTestId } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());
    await fireEvent.press(getByTestId('credential-login'));

    expect(Alert.alert).toHaveBeenCalledWith('Credenciais invalidas', 'Firebase indisponível');
    expect(mockSaveAuthSession).not.toHaveBeenCalled();
    expect(getByTestId('mock-home-screen')).toBeTruthy();
  });

  test('normaliza email ao cadastrar usuário e informa sucesso', async () => {
    const { getByTestId } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());
    await fireEvent.press(getByTestId('register-user'));

    expect(mockCadastrarUsuarioFirebase).toHaveBeenCalledWith('ana@email.com', 'nova-senha');
    expect(mockCreateUser).toHaveBeenCalledWith(mockDb, 'Ana', 'ana@email.com', 'nova-senha', 'firebase-uid-cadastro');
    expect(mockSalvarPerfilUsuarioFirebase).toHaveBeenCalledWith('firebase-uid-cadastro', {
      nome: 'Ana',
      email: 'ana@email.com',
    });
    expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Conta criada com sucesso!');
  });


  test('vincula conta local antiga ao Firebase durante cadastro sem duplicar usuário local', async () => {
    mockGetUserByEmail.mockReturnValueOnce({ id: 4, nome: 'Ana Local', email: 'ana@email.com', firebase_uid: null });
    const { getByTestId } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());
    await fireEvent.press(getByTestId('register-user'));

    expect(mockCadastrarUsuarioFirebase).toHaveBeenCalledWith('ana@email.com', 'nova-senha');
    expect(mockAtualizarFirebaseUidUsuario).toHaveBeenCalledWith(mockDb, 4, 'firebase-uid-cadastro');
    expect(mockCreateUser).not.toHaveBeenCalled();
    expect(mockSalvarPerfilUsuarioFirebase).toHaveBeenCalledWith('firebase-uid-cadastro', {
      nome: 'Ana Local',
      email: 'ana@email.com',
    });
    expect(Alert.alert).toHaveBeenCalledWith('Sucesso', 'Conta local vinculada ao Firebase com sucesso!');
  });

  test('exibe erro quando cadastro falha no Firebase', async () => {
    mockCadastrarUsuarioFirebase.mockRejectedValueOnce(new Error('email duplicado'));
    const { getByTestId } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());
    await fireEvent.press(getByTestId('register-user'));

    expect(Alert.alert).toHaveBeenCalledWith('Erro', 'email duplicado');
    expect(mockCreateUser).not.toHaveBeenCalled();
  });

  test('migra sessão antiga com userId para idUsuario e entra automaticamente', async () => {
    mockGetAuthSession.mockResolvedValueOnce({
      isLoggedIn: true,
      userId: 12,
      nome: 'Bia',
      email: 'bia@email.com',
      biometricEnabled: false,
    });
    const { getByTestId, getByText } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-secure-screen')).toBeTruthy());

    expect(mockSaveAuthSession).toHaveBeenCalledWith({
      isLoggedIn: true,
      nome: 'Bia',
      email: 'bia@email.com',
      biometricEnabled: false,
      idUsuario: 12,
    });
    expect(getByText('SecureScreen:email_password:12:bia@email.com:Bia')).toBeTruthy();
  });

  test('limpa sessão salva por email quando usuário não existe mais', async () => {
    mockGetAuthSession.mockResolvedValueOnce({
      isLoggedIn: true,
      email: ' sumido@email.com ',
      biometricEnabled: false,
    });
    mockGetUserByEmail.mockReturnValueOnce(null);
    const { getByTestId } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());

    expect(mockGetUserByEmail).toHaveBeenCalledWith(mockDb, 'sumido@email.com');
    expect(mockClearAuthSession).toHaveBeenCalledTimes(1);
  });

  test('autentica automaticamente por biometria quando sessão salva exige biometria', async () => {
    mockGetAuthSession.mockResolvedValueOnce({
      isLoggedIn: true,
      idUsuario: '8',
      nome: 'Caio',
      email: 'caio@email.com',
      biometricEnabled: true,
    });
    mockAuthenticateAsync.mockResolvedValueOnce({ success: true });
    const { getByTestId, getByText } = await render(React.createElement(App));

    await waitFor(() => expect(mockAuthenticateAsync).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(getByTestId('mock-secure-screen')).toBeTruthy());

    expect(getByText('SecureScreen:biometria:8:caio@email.com:Caio')).toBeTruthy();
  });

  test('alerta quando biometria falha e mantém login com sessão biométrica disponível', async () => {
    mockGetAuthSession.mockResolvedValueOnce({
      isLoggedIn: true,
      idUsuario: '9',
      nome: 'Duda',
      email: 'duda@email.com',
      biometricEnabled: true,
    });
    mockAuthenticateAsync.mockResolvedValueOnce({ success: false });
    const { getByTestId, getByText } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());
    await waitFor(() => expect(Alert.alert).toHaveBeenCalledWith(
      'Falha na autenticacao',
      'Nao foi possivel realizar o login.'
    ));
    expect(getByText('Sessao biometrica:true')).toBeTruthy();
  });

  test('faz logout limpando sessão e retornando para login', async () => {
    mockGetAuthSession.mockResolvedValueOnce({
      isLoggedIn: true,
      idUsuario: '10',
      nome: 'Eva',
      email: 'eva@email.com',
      biometricEnabled: false,
    });
    const { getByTestId } = await render(React.createElement(App));

    await waitFor(() => expect(getByTestId('mock-secure-screen')).toBeTruthy());
    await fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => expect(getByTestId('mock-home-screen')).toBeTruthy());
    expect(mockClearAuthSession).toHaveBeenCalledTimes(1);
  });
});
