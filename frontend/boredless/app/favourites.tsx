import React from 'react';
import { Text, View } from "react-native";

const Favourites = () => {
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
        Favourites
      </Text>
      <Text>Your favourite conversation topics will appear here</Text>
    </View>
  );
};

export default Favourites;