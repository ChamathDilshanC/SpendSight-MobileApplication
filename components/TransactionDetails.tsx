import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFinance } from "../context/FinanceContext";
import { TransactionService } from "../services/TransactionService";
import { Transaction } from "../types/finance";

interface TransactionDetailsProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transaction,
  onEdit,
  onDelete,
  onBack,
}) => {
  const { getCategoryById, getAccountById } = useFinance();

  const [isDeleting, setIsDeleting] = useState(false);

  const getTransactionIcon = (type: Transaction["type"]): string => {
    switch (type) {
      case "expense":
        return "trending-down";
      case "income":
        return "trending-up";
      case "transfer":
        return "swap-horizontal";
      default:
        return "help";
    }
  };

  const getTransactionColor = (type: Transaction["type"]): string => {
    switch (type) {
      case "expense":
        return "#ef4444";
      case "income":
        return "#10b981";
      case "transfer":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const formatAmount = (amount: number, type: Transaction["type"]): string => {
    const prefix = type === "expense" ? "-" : type === "income" ? "+" : "";
    return `${prefix}$${amount.toFixed(2)}`;
  };

  const handleDelete = async () => {
    Alert.alert(
      "Delete Transaction",
      "Are you sure you want to delete this transaction? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await TransactionService.deleteTransaction(transaction.id);
              onDelete();
            } catch (error) {
              Alert.alert("Error", "Failed to delete transaction");
              console.error("Error deleting transaction:", error);
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  const category = getCategoryById(transaction.categoryId || "");
  const fromAccount = getAccountById(transaction.fromAccountId || "");
  const toAccount = getAccountById(transaction.toAccountId || "");

  const renderDetailRow = (label: string, value: string, icon?: string) => (
    <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
      <View className="flex-row items-center flex-1">
        {icon && (
          <Ionicons
            name={icon as any}
            size={16}
            color="#6b7280"
            className="mr-2"
          />
        )}
        <Text className="text-sm text-gray-500 font-medium">{label}</Text>
      </View>
      <Text className="text-sm text-gray-900 font-medium text-right flex-1">
        {value}
      </Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity className="p-2" onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          Transaction Details
        </Text>
        <View className="w-10" />
      </View>

      {/* Transaction Summary */}
      <View className="bg-white m-4 rounded-2xl p-6 items-center shadow-sm">
        <View
          className="w-16 h-16 rounded-full justify-center items-center mb-4"
          style={{
            backgroundColor: getTransactionColor(transaction.type) + "20",
          }}
        >
          <Ionicons
            name={getTransactionIcon(transaction.type) as any}
            size={32}
            color={getTransactionColor(transaction.type)}
          />
        </View>
        <Text className="text-xl font-semibold text-gray-900 text-center mb-2">
          {transaction.description}
        </Text>
        <Text
          className="text-3xl font-extrabold mb-1"
          style={{ color: getTransactionColor(transaction.type) }}
        >
          {formatAmount(transaction.amount, transaction.type)}
        </Text>
        <Text className="text-sm text-gray-500 uppercase tracking-wider">
          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
        </Text>
      </View>

      {/* Transaction Details */}
      <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Details
        </Text>

        {renderDetailRow(
          "Date",
          transaction.date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          "calendar"
        )}

        {renderDetailRow("Amount", `$${transaction.amount.toFixed(2)}`, "cash")}

        {renderDetailRow("Currency", transaction.currency, "card")}

        {transaction.type !== "transfer" &&
          category &&
          renderDetailRow("Category", category.name, "pricetag")}

        {(transaction.type === "expense" || transaction.type === "transfer") &&
          fromAccount &&
          renderDetailRow(
            transaction.type === "transfer" ? "From Account" : "Account",
            fromAccount.name,
            "wallet"
          )}

        {(transaction.type === "income" || transaction.type === "transfer") &&
          toAccount &&
          renderDetailRow(
            transaction.type === "transfer" ? "To Account" : "Account",
            toAccount.name,
            "wallet"
          )}

        {transaction.tags &&
          transaction.tags.length > 0 &&
          renderDetailRow("Tags", transaction.tags.join(", "), "pricetags")}

        {transaction.isRecurring &&
          renderDetailRow("Recurring", "Yes", "repeat")}

        {transaction.goalId && renderDetailRow("Goal Payment", "Yes", "flag")}
      </View>

      {/* Metadata */}
      <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm">
        <Text className="text-base font-semibold text-gray-900 mb-3">
          Metadata
        </Text>

        {renderDetailRow(
          "Created",
          transaction.createdAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          "time"
        )}

        {renderDetailRow(
          "Last Updated",
          transaction.updatedAt.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          "time"
        )}

        {renderDetailRow(
          "Transaction ID",
          transaction.id.substring(0, 8) + "...",
          "barcode"
        )}
      </View>

      {/* Action Buttons */}
      <View className="mx-4 mb-4">
        <TouchableOpacity
          className="flex-row items-center justify-center bg-blue-500 py-3.5 rounded-xl mb-3"
          onPress={onEdit}
        >
          <Ionicons name="create" size={20} color="#fff" />
          <Text className="ml-2 text-base font-semibold text-white">
            Edit Transaction
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-row items-center justify-center py-3.5 rounded-xl ${isDeleting ? "bg-gray-400" : "bg-red-500"}`}
          onPress={handleDelete}
          disabled={isDeleting}
        >
          <Ionicons
            name={isDeleting ? "hourglass" : "trash"}
            size={20}
            color="#fff"
          />
          <Text className="ml-2 text-base font-semibold text-white">
            {isDeleting ? "Deleting..." : "Delete Transaction"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Location Information (if available) */}
      {transaction.location && (
        <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Location
          </Text>
          <View className="flex-row items-center mb-2">
            <Ionicons name="location" size={16} color="#6b7280" />
            <Text className="ml-2 text-sm text-gray-900">
              {transaction.location.address}
            </Text>
          </View>
          <Text
            className="text-xs text-gray-500"
            style={{ fontFamily: "monospace" }}
          >
            {transaction.location.latitude.toFixed(6)},{" "}
            {transaction.location.longitude.toFixed(6)}
          </Text>
        </View>
      )}

      {/* Attachments (if available) */}
      {transaction.attachments && transaction.attachments.length > 0 && (
        <View className="bg-white mx-4 mb-4 rounded-xl p-4 shadow-sm">
          <Text className="text-base font-semibold text-gray-900 mb-3">
            Attachments
          </Text>
          {transaction.attachments.map((attachment, index) => (
            <TouchableOpacity
              key={index}
              className="flex-row items-center py-2 border-b border-gray-100"
            >
              <Ionicons name="document-attach" size={16} color="#3b82f6" />
              <Text className="ml-2 text-sm text-blue-500">
                Receipt {index + 1}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};
