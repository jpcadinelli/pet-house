const React = require('react');
const { describe, expect, jest, test } = require('@jest/globals');
const { fireEvent, render } = require('@testing-library/react-native');

const { HomeScreen } = require('../src/features/home/screens/HomeScreen');

async function renderHomeScreen(props = {}) {
  return await render(React.createElement(HomeScreen, {
    biometria: true,
    hasSavedBiometricLogin: false,
    onBiometricLogin: jest.fn(),
    onCredentialLogin: jest.fn(),
    onRegister: jest.fn(),
    ...props,
  }));
}

describe('HomeScreen', () => {
  test('renderiza o formulário de login com campos e ações principais', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = await renderHomeScreen();

    expect(getAllByText('Entrar')).toHaveLength(2);
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Senha')).toBeTruthy();
    expect(getByText('Habilitar entrada com biometria')).toBeTruthy();
    expect(getByText('Não possui conta? Criar conta')).toBeTruthy();
  });

  test('exibe campos de cadastro ao alternar para criar conta', async () => {
    const { getAllByText, getByPlaceholderText, getByText } = await renderHomeScreen();

    await fireEvent.press(getByText('Não possui conta? Criar conta'));

    expect(getAllByText('Criar Conta')).toHaveLength(2);
    expect(getByPlaceholderText('Nome')).toBeTruthy();
    expect(getByPlaceholderText('Confirmar senha')).toBeTruthy();
    expect(getByText('Já possui conta? Entrar')).toBeTruthy();
  });
});
