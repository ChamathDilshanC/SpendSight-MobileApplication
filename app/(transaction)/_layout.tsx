import { Stack } from "expo-router";
import React from "react";

export default function TransactionLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: "#2563eb",
        },
        headerTintColor: "#fff",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Transactions",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="add"
        options={{
          title: "Add Transaction",
          presentation: "modal",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: "Transaction Details",
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="edit/[id]"
        options={{
          title: "Edit Transaction",
          presentation: "modal",
          headerShown: true,
        }}
      />
    </Stack>
  );
}
