import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { appStyles } from '../../../shared/styles/app.styles';

export function HomeScreen({
  biometria,
  hasSavedBiometricLogin,
  onBiometricLogin,
  onCredentialLogin,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  const handleSubmit = () => {
    onCredentialLogin({
      email,
      password,
      biometricEnabled,
    });
  };

  return (
    <View style={appStyles.screenLogin}>
      <View style={appStyles.authCard}>
        <Text style={appStyles.title}>Entrar</Text>
        <Text style={appStyles.bodyText}>
          Use o email `email@email.com` e a senha `1234`.
        </Text>

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

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!biometria}
          onPress={() => setBiometricEnabled((currentValue) => !currentValue)}
          style={appStyles.checkboxRow}
        >
          <View style={[appStyles.checkbox, biometricEnabled && appStyles.checkboxChecked]}>
            {biometricEnabled ? <View style={appStyles.checkboxIndicator} /> : null}
          </View>

          <Text style={appStyles.checkboxLabel}>
            {biometria
              ? 'Habilitar entrada com biometria'
              : 'Biometria indisponível neste dispositivo'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={appStyles.button} onPress={handleSubmit} activeOpacity={0.85}>
          <Text style={appStyles.buttonText}>Entrar com email e senha</Text>
        </TouchableOpacity>

        {hasSavedBiometricLogin ? (
          <TouchableOpacity
            style={appStyles.secondaryButton}
            onPress={onBiometricLogin}
            activeOpacity={0.85}
          >
            <Text style={appStyles.secondaryButtonText}>Entrar com biometria</Text>
          </TouchableOpacity>
        ) : null}
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
