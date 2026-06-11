const React = require('react');
const { describe, expect, jest, test } = require('@jest/globals');
const TestingLibrary = require('@testing-library/react-native');

const { HomeScreen } = require('../src/features/home/screens/HomeScreen');

async function renderHomeScreen(props = {}) {
  await TestingLibrary.render(
    React.createElement(HomeScreen, {
      biometria: true,
      hasSavedBiometricLogin: false,
      onBiometricLogin: jest.fn(),
      onCredentialLogin: jest.fn(),
      onRegister: jest.fn(),
      ...props,
    })
  );

  return TestingLibrary.screen;
}

describe('HomeScreen', () => {
  test('renderiza o formulário de login com campos e ações principais', async () => {
    const screen = await renderHomeScreen();

    expect(screen.getAllByText('Entrar')).toHaveLength(2);
    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Senha')).toBeTruthy();
    expect(screen.getByText('Habilitar entrada com biometria')).toBeTruthy();
    expect(screen.getByText('Não possui conta? Criar conta')).toBeTruthy();
  });

  test('exibe campos de cadastro ao alternar para criar conta', async () => {
    const screen = await renderHomeScreen();

    await TestingLibrary.fireEvent.press(
      screen.getByText('Não possui conta? Criar conta')
    );

    expect(screen.getAllByText('Criar Conta')).toHaveLength(2);
    expect(screen.getByPlaceholderText('Nome')).toBeTruthy();
    expect(screen.getByPlaceholderText('Confirmar senha')).toBeTruthy();
    expect(screen.getByText('Já possui conta? Entrar')).toBeTruthy();
  });
});