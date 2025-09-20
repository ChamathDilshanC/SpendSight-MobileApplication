import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { Alert, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  const handleCancelEdit = () => {
    setViewMode("list");
    setSelectedTransaction(null);
  };

  const handleBackFromDetails = () => {
    setViewMode("list");
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;

    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { TransactionService } = await import(
                "../../services/TransactionService"
              );
              await TransactionService.deleteTransaction(
                selectedTransaction.id
              );
              await refreshData();
              setViewMode("list");
              setSelectedTransaction(null);
              Alert.alert("Success", "Transaction deleted successfully!");
            } catch (error) {
              console.error("Error deleting transaction:", error);
              Alert.alert("Error", "Failed to delete transaction");
            }
          },
        },
      ]
    );
  };

  const getHeaderTitle = () => {
    switch (viewMode) {
      case "add":
        return "Add Transaction";
      case "edit":
        return "Edit Transaction";
      case "details":
        return "Transaction Details";
      default:
        return "Transactions";
    }
  };

  const getHeaderRightComponent = () => {
    if (viewMode === "details") {
      return (
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={handleEditTransaction}
            className="p-2 bg-blue-50 rounded-xl active:bg-blue-100 active:scale-95"
            style={{
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="pencil" size={20} color="#3B82F6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleDeleteTransaction}
            className="p-2 bg-red-50 rounded-xl active:bg-red-100 active:scale-95"
            style={{
              shadowColor: "#EF4444",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
            }}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  const shouldShowBackButton = viewMode !== "list";

  const handleBackPress = () => {
    if (viewMode === "details") {
      handleBackFromDetails();
    } else if (viewMode === "add" || viewMode === "edit") {
      handleCancelEdit();
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: "#f9fafb" }}
        edges={["top"]}
      >
        <AppHeader
          title={getHeaderTitle()}
          showBackButton={shouldShowBackButton}
          onBackPress={handleBackPress}
          rightComponent={getHeaderRightComponent()}
          backgroundColor="#f9fafb"
        />

        <View className="flex-1" style={{ backgroundColor: "#f9fafb" }}>
          {viewMode === "list" && (
            <TransactionList
              onTransactionPress={handleTransactionPress}
              onRefresh={handleRefresh}
              refreshing={isRefreshing}
            />
          )}

          {(viewMode === "add" || viewMode === "edit") && (
            <View className="flex-1" style={{ backgroundColor: "#f9fafb" }}>
              <TransactionForm
                transaction={selectedTransaction || undefined}
                onSave={handleSaveTransaction}
                onCancel={handleCancelEdit}
                isEditing={viewMode === "edit"}
              />
            </View>
          )}

          {viewMode === "details" && selectedTransaction && (
            <View className="flex-1" style={{ backgroundColor: "#f9fafb" }}>
              <TransactionDetails
                transaction={selectedTransaction}
                onEdit={handleEditTransaction}
                onDelete={handleDeleteTransaction}
                onBack={handleBackFromDetails}
              />
            </View>
          )}
        </View>
      </SafeAreaView>

      {/* Floating Action Button - Only show in list and details view */}
      {(viewMode === "list" || viewMode === "details") && (
        <View className="absolute bottom-10 right-6">
          <TouchableOpacity
            onPress={handleAddTransaction}
            className="items-center justify-center rounded-full shadow-lg w-14 h-14 active:scale-95"
            style={{
              backgroundColor: "#6366F1",
              shadowColor: "#6366F1",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </>
  );
}
