import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DebugScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 justify-center items-center">
        <Text className="text-lg font-semibold text-gray-900">Debug Screen</Text>
        <Text className="text-gray-500 mt-2">Coming soon...</Text>
      </View>
    </SafeAreaView>
  );
}