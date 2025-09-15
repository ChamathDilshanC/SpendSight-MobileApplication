import { Stack, router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { TransactionForm } from "../../../components/TransactionForm";
import { useFinance } from "../../../context/FinanceContext";
import { TransactionService } from "../../../services/TransactionService";

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { transactions, refreshData } = useFinance();
  const [isLoading, setIsLoading] = useState(false);

  // Find the transaction to edit
  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    return null; // Could show an error screen
  }

  const handleSave = async (transactionData: any) => {
    setIsLoading(true);
    try {
      await TransactionService.updateTransaction(id!, transactionData);
      await refreshData();
      Alert.alert("Success", "Transaction updated successfully!");
      router.back();
    } catch (error) {
      console.error("Error updating transaction:", error);
      Alert.alert("Error", "Failed to update transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: "Edit Transaction",
          headerShown: true,
        }}
      />
      <TransactionForm
        transaction={transaction}
        onSave={handleSave}
        onCancel={handleCancel}
        isEditing={true}
      />
    </View>
  );
}
