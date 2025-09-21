import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { FinanceProvider } from "../context/FinanceContext";
import { AuthProvider } from "../context/FirebaseAuthContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FinanceProvider>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#ffffff" },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="(getStarted)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
            <Stack.Screen name="(account)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(categories)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(help)" options={{ headerShown: false }} />
            <Stack.Screen name="(goal)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(transaction)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(history)" options={{ headerShown: false }} />
          </Stack>
        </FinanceProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
