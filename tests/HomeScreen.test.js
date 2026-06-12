const React = require('react');
const { afterEach, beforeEach, describe, expect, jest, test } = require('@jest/globals');
const { Alert } = require('react-native');
const { fireEvent, render } = require('@testing-library/react-native');

const { HomeScreen } = require('../src/features/home/screens/HomeScreen');

function criarProps(overrides = {}) {
  return {
    biometria: true,
    hasSavedBiometricLogin: false,
    onBiometricLogin: jest.fn(),
    onCredentialLogin: jest.fn(),
    onRegister: jest.fn(),
    ...overrides,
  };
}

async function renderHomeScreen(props = {}) {
  return await render(React.createElement(HomeScreen, criarProps(props)));
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renderiza o formulário de login com campos e ações principais', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = await renderHomeScreen();

    expect(getAllByText('Entrar')).toHaveLength(2);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
    expect(getByText('Habilitar entrada com biometria')).toBeTruthy();
    expect(getByText('Não possui conta? Criar conta')).toBeTruthy();
  });

  test('envia credenciais preenchidas ao fazer login', async () => {
    const onCredentialLogin = jest.fn();
    const { getByPlaceholderText, getByTestId } = await renderHomeScreen({ onCredentialLogin });

    await fireEvent.changeText(getByPlaceholderText('Email'), 'ana@email.com');
    await fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
    await fireEvent.press(getByTestId('login-button'));

    expect(onCredentialLogin).toHaveBeenCalledWith({
      email: 'ana@email.com',
      password: 'senha123',
      biometricEnabled: false,
    });
  });

  test('inclui preferência biométrica ao marcar a opção de login', async () => {
    const onCredentialLogin = jest.fn();
    const { getByPlaceholderText, getByTestId, getByText } = await renderHomeScreen({ onCredentialLogin });

    await fireEvent.changeText(getByPlaceholderText('Email'), 'bio@email.com');
    await fireEvent.changeText(getByPlaceholderText('Senha'), 'senha-bio');
    await fireEvent.press(getByText('Habilitar entrada com biometria'));
    await fireEvent.press(getByTestId('login-button'));

    expect(onCredentialLogin).toHaveBeenCalledWith({
      email: 'bio@email.com',
      password: 'senha-bio',
      biometricEnabled: true,
    });
  });

  test('exibe campos de cadastro ao alternar para criar conta', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = await renderHomeScreen();

    await fireEvent.press(getByText('Não possui conta? Criar conta'));

    expect(getAllByText('Criar Conta')).toHaveLength(2);
    expect(getByPlaceholderText('Nome')).toBeTruthy();
    expect(getByPlaceholderText('Confirmar senha')).toBeTruthy();
    expect(getByText('Já possui conta? Entrar')).toBeTruthy();
  });

  test('envia dados do cadastro quando as senhas coincidem', async () => {
    const onRegister = jest.fn();
    const { getByPlaceholderText, getByTestId, getByText } = await renderHomeScreen({ onRegister });

    await fireEvent.press(getByText('Não possui conta? Criar conta'));
    await fireEvent.changeText(getByPlaceholderText('Nome'), 'Ana');
    await fireEvent.changeText(getByPlaceholderText('Email'), 'ana@email.com');
    await fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
    await fireEvent.changeText(getByPlaceholderText('Confirmar senha'), 'senha123');
    await fireEvent.press(getByTestId('login-button'));

    expect(onRegister).toHaveBeenCalledWith({
      nome: 'Ana',
      email: 'ana@email.com',
      password: 'senha123',
    });
  });

  test('alerta e não cadastra quando as senhas não coincidem', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const onRegister = jest.fn();
    const { getByPlaceholderText, getByTestId, getByText } = await renderHomeScreen({ onRegister });

    await fireEvent.press(getByText('Não possui conta? Criar conta'));
    await fireEvent.changeText(getByPlaceholderText('Senha'), 'senha123');
    await fireEvent.changeText(getByPlaceholderText('Confirmar senha'), 'outra-senha');
    await fireEvent.press(getByTestId('login-button'));

    expect(onRegister).not.toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('Erro', 'As senhas não coincidem.');
  });

  test('exibe e aciona login biométrico quando há sessão biométrica salva', async () => {
    const onBiometricLogin = jest.fn();
    const { getByText } = await renderHomeScreen({ hasSavedBiometricLogin: true, onBiometricLogin });

    await fireEvent.press(getByText('Entrar com biometria'));

    expect(onBiometricLogin).toHaveBeenCalledTimes(1);
  });
});
