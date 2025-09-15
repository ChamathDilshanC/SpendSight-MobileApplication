import { Stack } from "expo-router";

export default function CategoriesLayout() {
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
        name="categories"
        options={{
          title: "Categories",
          headerBackTitle: "Back",
        }}
      />
    </Stack>
  );
}
