import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { View } from "react-native";
import { TransactionDetails } from "../../components/TransactionDetails";
import { useFinance } from "../../context/FinanceContext";

export default function TransactionDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, refreshData } = useFinance();
  const [isLoading, setIsLoading] = useState(false);

  // Find the transaction to show
  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    return null; // Could show an error screen
  }

  const handleEdit = () => {
    // Navigate to edit screen using router.push with string interpolation
    router.navigate(`/edit/${id}` as any);
  };

  const handleDelete = async () => {
    await refreshData();
    router.back();
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: "Transaction Details",
          headerShown: false,
        }}
      />
      <TransactionDetails
        transaction={transaction}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onBack={handleBack}
      />
    </View>
  );
}
