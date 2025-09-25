import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFinance } from "../context/FinanceContext";
import { useAuth } from "../context/FirebaseAuthContext";
import { AccountService, CurrencyType } from "../services/AccountService";
import { TransactionService } from "../services/TransactionService";
import { Transaction } from "../types/finance";

interface TransactionDetailsProps {
  transaction: Transaction;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const useCurrency = () => {
  const { authState } = useAuth();
  const userCurrency: CurrencyType =
    authState?.user?.preferences?.currency || "USD";

  const formatCurrency = (amount: number): string => {
    return AccountService.formatCurrency(amount, userCurrency);
  };

  const getCurrencySymbol = (): string => {
    return AccountService.getCurrencySymbol(userCurrency);
  };

  return {
    currency: userCurrency,
    formatCurrency,
    getCurrencySymbol,
  };
};

export const TransactionDetails: React.FC<TransactionDetailsProps> = ({
  transaction,
  onEdit,
  onDelete,
  onBack,
}) => {
  const { getCategoryById, getAccountById } = useFinance();
  const { formatCurrency, getCurrencySymbol } = useCurrency();

  const [isDeleting, setIsDeleting] = useState(false);

  const getTransactionIcon = (type: Transaction["type"]): string => {
    switch (type) {
      case "expense":
        return "trending-down";
      case "income":
        return "trending-up";
      case "transfer":
        return "swap-horizontal";
      case "goal_payment":
        return "trophy-outline";
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
      case "goal_payment":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  const formatAmount = (amount: number, type: Transaction["type"]): string => {
    const formattedAmount = formatCurrency(amount);
    const prefix =
      type === "expense" || type === "goal_payment"
        ? "-"
        : type === "income"
          ? "+"
          : "";

    if (prefix) {
      const symbol = getCurrencySymbol();
      const numericPart = formattedAmount.replace(symbol, "").trim();
      return `${prefix}${symbol}${numericPart}`;
    }

    return formattedAmount;
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
    <View className="flex-row items-center justify-between py-2 border-b border-gray-100">
      <View className="flex-row items-center flex-1">
        {icon && (
          <Ionicons
            name={icon as any}
            size={16}
            color="#6b7280"
            className="mr-2"
          />
        )}
        <Text className="text-sm font-medium text-gray-500">{label}</Text>
      </View>
      <Text className="flex-1 text-sm font-medium text-right text-gray-900">
        {value}
      </Text>
    </View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-200">
        <TouchableOpacity className="p-2" onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#3b82f6" />
        </TouchableOpacity>
        <Text className="text-lg font-semibold text-gray-900">
          Transaction Details
        </Text>
        <View className="w-10" />
      </View>

      {}
      <View className="items-center p-6 m-4 bg-white shadow-sm rounded-2xl">
        <View
          className="items-center justify-center w-16 h-16 mb-4 rounded-full"
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
        <Text className="mb-2 text-xl font-semibold text-center text-gray-900">
          {transaction.description}
        </Text>
        <Text
          className="mb-1 text-3xl font-extrabold"
          style={{ color: getTransactionColor(transaction.type) }}
        >
          {formatAmount(transaction.amount, transaction.type)}
        </Text>
        <Text className="text-sm tracking-wider text-gray-500 uppercase">
          {transaction.type === "goal_payment"
            ? "Goal Payment"
            : transaction.type.charAt(0).toUpperCase() +
              transaction.type.slice(1)}
        </Text>
      </View>

      {}
      <View className="p-4 mx-4 mb-4 bg-white shadow-sm rounded-xl">
        <Text className="mb-3 text-base font-semibold text-gray-900">
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

        {renderDetailRow("Amount", formatCurrency(transaction.amount), "cash")}

        {renderDetailRow("Currency", transaction.currency, "card")}

        {transaction.type !== "transfer" &&
          transaction.type !== "goal_payment" &&
          category &&
          renderDetailRow("Category", category.name, "pricetag")}

        {(transaction.type === "expense" ||
          transaction.type === "transfer" ||
          (transaction.type === "goal_payment" && transaction.fromAccountId)) &&
          fromAccount &&
          renderDetailRow(
            transaction.type === "transfer"
              ? "From Account"
              : transaction.type === "goal_payment"
                ? "Account (Withdrawal)"
                : "Account",
            fromAccount.name,
            "wallet"
          )}

        {(transaction.type === "income" ||
          transaction.type === "transfer" ||
          (transaction.type === "goal_payment" && transaction.toAccountId)) &&
          toAccount &&
          renderDetailRow(
            transaction.type === "transfer"
              ? "To Account"
              : transaction.type === "goal_payment"
                ? "Account (Deposit)"
                : "Account",
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

      {}
      <View className="p-4 mx-4 mb-4 bg-white shadow-sm rounded-xl">
        <Text className="mb-3 text-base font-semibold text-gray-900">
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

      {}
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

      {}
      {transaction.location && (
        <View className="p-4 mx-4 mb-4 bg-white shadow-sm rounded-xl">
          <Text className="mb-3 text-base font-semibold text-gray-900">
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

      {}
      {transaction.attachments && transaction.attachments.length > 0 && (
        <View className="p-4 mx-4 mb-4 bg-white shadow-sm rounded-xl">
          <Text className="mb-3 text-base font-semibold text-gray-900">
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
