import { View, Text, TouchableOpacity } from "react-native";
import { appStyles } from "../../../shared/styles/app.styles";

export default function Profile({ onLogout }) {
  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center"
    }}>
      <Text>Usuário logado com sucesso!</Text>

      <TouchableOpacity style={appStyles.button} onPress={onLogout} activeOpacity={0.85}>
        <Text style={appStyles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}