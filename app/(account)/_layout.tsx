import { Stack } from "expo-router";

export default function AccountLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f9fafb" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen
        name="account"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
