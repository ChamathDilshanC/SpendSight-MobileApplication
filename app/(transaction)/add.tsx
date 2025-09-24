import { Stack, router } from "expo-router";
import React, { useState } from "react";
import { Alert, View } from "react-native";
import { TransactionForm } from "../../components/TransactionForm";
import { useFinance } from "../../context/FinanceContext";
import { useAuth } from "../../context/FirebaseAuthContext";
import { TransactionService } from "../../services/TransactionService";

export default function AddTransactionScreen() {
  const { refreshData } = useFinance();
  const { authState } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async (transactionData: any) => {
    if (!authState.user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    setIsLoading(true);
    try {
      await TransactionService.createTransaction(
        authState.user.id,
        transactionData
      );
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
