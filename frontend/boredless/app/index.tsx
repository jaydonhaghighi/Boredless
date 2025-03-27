import { Text, View } from "react-native";

export default function Home() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#F5F5F5",
      }}
    >
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Home
      </Text>
      <Text>Welcome to BoredlessConvo</Text>
    </View>
  );
}
