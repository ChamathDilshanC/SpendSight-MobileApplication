import { Stack } from "expo-router";
import React, { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="signup" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
    </Stack>
  );
}
