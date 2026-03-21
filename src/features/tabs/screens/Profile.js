import { View, Text, TouchableOpacity } from 'react-native';
import { appStyles } from '../../../shared/styles/app.styles';

export default function Profile({ authMethod, onLogout, userEmail }) {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
      }}
    >
      <Text style={appStyles.title}>Usuario logado com sucesso!</Text>
      <Text style={appStyles.bodyText}>Email: {userEmail}</Text>
      <Text style={appStyles.helperText}>
        Metodo de entrada: {authMethod === 'biometria' ? 'Biometria' : 'Email e senha'}
      </Text>

      <TouchableOpacity style={appStyles.button} onPress={onLogout} activeOpacity={0.85}>
        <Text style={appStyles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}
