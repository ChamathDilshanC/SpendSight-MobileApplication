import { Stack, router } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { TransactionForm } from "../../components/TransactionForm";
import { useFinance } from "../../context/FinanceContext";

export default function AddTransactionScreen() {
  const { createTransaction, refreshData } = useFinance();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (transactionData: any) => {
    setIsLoading(true);
    try {
      await createTransaction(transactionData);
      await refreshData();
      Alert.alert("Success", "Transaction added successfully!");
      router.back();
    } catch (error) {
      console.error("Error adding transaction:", error);
      Alert.alert("Error", "Failed to add transaction. Please try again.");
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
          title: "Add Transaction",
          headerShown: true,
        }}
      />
      <TransactionForm
        onSave={handleSave}
        onCancel={handleCancel}
        isEditing={false}
      />
    </View>
  );
}
