import { Stack } from "expo-router";
import "react-native-reanimated";
import { FinanceProvider } from "../context/FinanceContext";
import { AuthProvider } from "../context/FirebaseAuthContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#ffffff" }, // Updated to white theme
            animation: "slide_from_right", // Smooth slide animation for main sections
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(getStarted)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
          <Stack.Screen name="(account)" options={{ headerShown: false }} />
          <Stack.Screen name="(categories)" options={{ headerShown: false }} />
          <Stack.Screen name="(help)" options={{ headerShown: false }} />
        </Stack>
      </FinanceProvider>
    </AuthProvider>
  );
}
