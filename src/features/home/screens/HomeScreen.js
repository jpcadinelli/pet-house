import { Text, View, TouchableOpacity } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { appStyles } from '../../../shared/styles/app.styles'

export function HomeScreen({ biometria, onLogin }) {
  return (
    <View style={appStyles.container}>
      <Text style={appStyles.bodyText}>
        {biometria
          ? 'Faça o login com biometria'
          : 'Dispositivo n"ao cmpativel com biometrias'
        }
      </Text>

      <TouchableOpacity style={appStyles.button} onPress={onLogin} activeOpacity={0.85}>
        <Text style={appStyles.buttonText}>Logar</Text>
      </TouchableOpacity>

      <StatusBar style="auto" />
    </View>
  )
}