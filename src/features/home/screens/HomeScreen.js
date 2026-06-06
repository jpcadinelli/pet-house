import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { appStyles } from '../../../shared/styles/app.styles';

export function HomeScreen({
  biometria,
  hasSavedBiometricLogin,
  onBiometricLogin,
  onCredentialLogin,
  onRegister,
}) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = () => {
    onCredentialLogin({
      email,
      password,
      biometricEnabled,
    });
  };

  const handleRegister = () => {
    if (password !== confirmPassword) {
      Alert.alert(
        'Erro',
        'As senhas não coincidem.'
      );
      return;
    }

    onRegister({
      nome,
      email,
      password,
    });
  };

  return (
    <View style={appStyles.screenLogin}>
      <View style={appStyles.authCard}>
        <Text style={appStyles.title}>
          {isRegistering ? 'Criar Conta' : 'Entrar'}
        </Text>

        {isRegistering && (
          <TextInput
            onChangeText={setNome}
            placeholder="Nome"
            placeholderTextColor="#7d8590"
            style={appStyles.input}
            value={nome}
          />
        )}

        <TextInput
          autoCapitalize="none"
          keyboardType="email-address"
          onChangeText={setEmail}
          placeholder="Email"
          placeholderTextColor="#7d8590"
          style={appStyles.input}
          value={email}
        />

        <TextInput
          onChangeText={setPassword}
          placeholder="Senha"
          placeholderTextColor="#7d8590"
          secureTextEntry
          style={appStyles.input}
          value={password}
        />

        {isRegistering && (
          <TextInput
            onChangeText={setConfirmPassword}
            placeholder="Confirmar senha"
            placeholderTextColor="#7d8590"
            secureTextEntry
            style={appStyles.input}
            value={confirmPassword}
          />
        )}

        {!isRegistering && (
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={!biometria}
            onPress={() =>
              setBiometricEnabled(
                (currentValue) => !currentValue
              )
            }
            style={appStyles.checkboxRow}
          >
            <View
              style={[
                appStyles.checkbox,
                biometricEnabled &&
                  appStyles.checkboxChecked,
              ]}
            >
              {biometricEnabled ? (
                <View
                  style={appStyles.checkboxIndicator}
                />
              ) : null}
            </View>

            <Text style={appStyles.checkboxLabel}>
              {biometria
                ? 'Habilitar entrada com biometria'
                : 'Biometria indisponível neste dispositivo'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={appStyles.button}
          onPress={
            isRegistering
              ? handleRegister
              : handleLogin
          }
          activeOpacity={0.85}
        >
          <Text style={appStyles.buttonText}>
            {isRegistering
              ? 'Criar Conta'
              : 'Entrar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() =>
            setIsRegistering(!isRegistering)
          }
        >
          <Text
            style={appStyles.secondaryButtonText}
          >
            {isRegistering
              ? 'Já possui conta? Entrar'
              : 'Não possui conta? Criar conta'}
          </Text>
        </TouchableOpacity>

        {!isRegistering &&
          hasSavedBiometricLogin && (
            <TouchableOpacity
              style={appStyles.secondaryButton}
              onPress={onBiometricLogin}
              activeOpacity={0.85}
            >
              <Text
                style={
                  appStyles.secondaryButtonText
                }
              >
                Entrar com biometria
              </Text>
            </TouchableOpacity>
          )}
      </View>

      <Text style={appStyles.helperText}>
        {biometria
          ? 'Ao marcar a opção, a próxima abertura poderá autenticar com biometria.'
          : 'Seu dispositivo não é compatível com biometria no momento.'}
      </Text>

      <StatusBar style="auto" />
    </View>
  );
}