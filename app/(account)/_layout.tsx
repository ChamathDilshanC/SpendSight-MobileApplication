import { Stack } from "expo-router";

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#ffffff",
        },
        headerTintColor: "#1f2937",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShadowVisible: true,
        headerBackVisible: true,
      }}
    >
      <Stack.Screen
        name="account"
        options={{
          title: "Account Management",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
