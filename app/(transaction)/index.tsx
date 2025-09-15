import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AppHeader from "../../components/AppHeader";
import { TransactionDetails } from "../../components/TransactionDetails";
import { TransactionForm } from "../../components/TransactionForm";
import { TransactionList } from "../../components/TransactionList";
import { useFinance } from "../../context/FinanceContext";
import { Transaction } from "../../types/finance";

type ViewMode = "list" | "add" | "edit" | "details";

export default function TransactionsScreen() {
  const { createTransaction, transactions, refreshData } = useFinance();

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      handleRefresh();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error("Error refreshing transactions:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddTransaction = () => {
    setSelectedTransaction(null);
    setViewMode("add");
  };

  const handleTransactionPress = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewMode("details");
  };

  const handleEditTransaction = () => {
    if (selectedTransaction) {
      setViewMode("edit");
    }
  };

  const handleSaveTransaction = async (transactionData: any) => {
    setIsLoading(true);
    try {
      if (viewMode === "add") {
        await createTransaction(transactionData);
        Alert.alert("Success", "Transaction added successfully!");
      } else if (viewMode === "edit" && selectedTransaction) {
        // Import TransactionService for update functionality
        const { TransactionService } = await import(
          "../../services/TransactionService"
        );
        await TransactionService.updateTransaction(
          selectedTransaction.id,
          transactionData
        );
        Alert.alert("Success", "Transaction updated successfully!");
      }

      await refreshData();
      setViewMode("list");
      setSelectedTransaction(null);
    } catch (error) {
      console.error("Error saving transaction:", error);
      Alert.alert("Error", "Failed to save transaction. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTransaction = async () => {
    await refreshData();
    setViewMode("list");
    setSelectedTransaction(null);
  };

  const handleCancel = () => {
    setViewMode("list");
    setSelectedTransaction(null);
  };

  const handleBack = () => {
    setViewMode("list");
    setSelectedTransaction(null);
  };

  const renderHeader = () => {
    switch (viewMode) {
      case "add":
        return (
          <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
            <TouchableOpacity
              onPress={handleCancel}
              className="items-center justify-center w-10 h-10"
            >
              <Ionicons name="close" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">
              Add Transaction
            </Text>
            <View className="w-10 h-10" />
          </View>
        );
      case "edit":
        return (
          <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200 shadow-sm">
            <TouchableOpacity
              onPress={handleCancel}
              className="items-center justify-center w-10 h-10"
            >
              <Ionicons name="close" size={24} color="#3b82f6" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-gray-900">
              Edit Transaction
            </Text>
            <View className="w-10 h-10" />
          </View>
        );
      case "details":
        return null;
      default:
        return (
          <AppHeader
            title="Transactions"
          />
        );
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case "add":
        return (
          <TransactionForm
            onSave={handleSaveTransaction}
            onCancel={handleCancel}
            isEditing={false}
          />
        );
      case "edit":
        return selectedTransaction ? (
          <TransactionForm
            transaction={selectedTransaction}
            onSave={handleSaveTransaction}
            onCancel={handleCancel}
            isEditing={true}
          />
        ) : null;
      case "details":
        return selectedTransaction ? (
          <TransactionDetails
            transaction={selectedTransaction}
            onEdit={handleEditTransaction}
            onDelete={handleDeleteTransaction}
            onBack={handleBack}
          />
        ) : null;
      default:
        return (
          <>
            {transactions.length === 0 ? (
              <View className="items-center justify-center flex-1 px-8">
                <Ionicons name="receipt-outline" size={80} color="#d1d5db" />
                <Text className="mt-6 mb-3 text-2xl font-bold text-center text-gray-900">
                  No Transactions Yet
                </Text>
                <Text className="mb-8 text-base leading-6 text-center text-gray-500">
                  Start tracking your expenses, income, and transfers by adding
                  your first transaction.
                </Text>
                <TouchableOpacity
                  className="flex-row items-center px-6 py-4 bg-blue-500 rounded-xl"
                  onPress={handleAddTransaction}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text className="ml-2 text-base font-semibold text-white">
                    Add Your First Transaction
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Summary Cards */}
                <View className="flex-row gap-3 px-4 py-4">
                  <View className="items-center flex-1 p-4 bg-white shadow-sm rounded-xl">
                    <Text className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">
                      Total Transactions
                    </Text>
                    <Text className="text-2xl font-bold text-blue-500">
                      {transactions.length}
                    </Text>
                  </View>
                  <View className="items-center flex-1 p-4 bg-white shadow-sm rounded-xl">
                    <Text className="mb-1 text-xs font-medium tracking-wider text-gray-500 uppercase">
                      This Month
                    </Text>
                    <Text className="text-2xl font-bold text-blue-500">
                      {
                        transactions.filter((t) => {
                          const now = new Date();
                          return (
                            t.date.getMonth() === now.getMonth() &&
                            t.date.getFullYear() === now.getFullYear()
                          );
                        }).length
                      }
                    </Text>
                  </View>
                </View>

                {/* Transaction List */}
                <TransactionList
                  onTransactionPress={handleTransactionPress}
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                />
              </>
            )}
          </>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {renderHeader()}

      <View className="flex-1">{renderContent()}</View>

      {/* Floating Action Button for List View */}
      {viewMode === "list" && transactions.length > 0 && (
        <TouchableOpacity
          className="absolute items-center justify-center w-16 h-16 bg-blue-500 rounded-full shadow-lg bottom-20 right-6"
          onPress={handleAddTransaction}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}
