import { Stack } from "expo-router";
import React from "react";

export default function HelpLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#1f2937",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerShadowVisible: true,
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="help"
        options={{
          title: "Help & Support",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
