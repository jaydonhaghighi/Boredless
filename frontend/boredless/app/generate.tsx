import React from 'react';
import { Text, View } from "react-native";

const Generate = () => {
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
        Generate
      </Text>
      <Text>Generate new conversation topics here</Text>
    </View>
  );
};

export default Generate;