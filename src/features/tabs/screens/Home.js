import { View, Text } from "react-native";

export default function Home() {
  return (
    <View style={{
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    }}>
      <Text>Essa Tela aqui lista as clinicas e hoteis.</Text>
    </View>
  );
}