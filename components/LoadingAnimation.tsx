import React from "react";
import { View, StyleSheet } from "react-native";
import LottieView from "lottie-react-native";

interface LoadingAnimationProps {
  size?: number;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  size = 80,
}) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <LottieView
        source={require("../assets/animations/loading_blue.json")}
        autoPlay
        loop
        style={styles.animation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
  animation: {
    width: "100%",
    height: "100%",
  },
});
