import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFinance } from "../context/FinanceContext";
import { Transaction } from "../types/finance";

interface TransactionListProps {
  onTransactionPress: (transaction: Transaction) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  onTransactionPress,
  refreshing = false,
  onRefresh,
}) => {
  const {
    transactions,
    categories,
    accounts,
    getCategoryById,
    getAccountById,
  } = useFinance();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "expense" | "income" | "transfer"
  >("all");

  // Filter and search transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== "all") {
      filtered = filtered.filter((t) => t.type === filterType);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((t) => {
        const category = getCategoryById(t.categoryId || "");
        const fromAccount = getAccountById(t.fromAccountId || "");
        const toAccount = getAccountById(t.toAccountId || "");

        return (
          t.description.toLowerCase().includes(query) ||
          category?.name.toLowerCase().includes(query) ||
          fromAccount?.name.toLowerCase().includes(query) ||
          toAccount?.name.toLowerCase().includes(query) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      });
    }

    return filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions, filterType, searchQuery, getCategoryById, getAccountById]);

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

  const getTransactionSubtitle = (transaction: Transaction): string => {
    const { type, categoryId, fromAccountId, toAccountId } = transaction;

    if (type === "transfer") {
      const fromAccount = getAccountById(fromAccountId || "");
      const toAccount = getAccountById(toAccountId || "");
      return `${fromAccount?.name || "Unknown"} → ${toAccount?.name || "Unknown"}`;
    }

    const category = getCategoryById(categoryId || "");
    const account = getAccountById(
      type === "expense" ? fromAccountId || "" : toAccountId || ""
    );

    return `${category?.name || "Uncategorized"} • ${account?.name || "Unknown Account"}`;
  };

  const renderFilterButton = (
    type: typeof filterType,
    label: string,
    icon: string
  ) => (
    <TouchableOpacity
      className={`flex-row items-center px-3 py-2 rounded-lg shadow-sm ${
        filterType === type ? "bg-blue-600" : "bg-white"
      }`}
      onPress={() => setFilterType(type)}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={filterType === type ? "#fff" : "#6b7280"}
      />
      <Text
        className={`ml-1 text-xs font-medium ${
          filterType === type ? "text-white" : "text-gray-500"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      className="bg-white rounded-xl mb-2 shadow-sm"
      onPress={() => onTransactionPress(item)}
    >
      <View className="flex-row justify-between items-center p-4">
        <View className="flex-1 flex-row items-center">
          <View
            className="w-10 h-10 rounded-full justify-center items-center mr-3"
            style={{ backgroundColor: getTransactionColor(item.type) + "20" }}
          >
            <Ionicons
              name={getTransactionIcon(item.type) as any}
              size={20}
              color={getTransactionColor(item.type)}
            />
          </View>
          <View className="flex-1">
            <Text
              className="text-base font-semibold text-gray-800 mb-0.5"
              numberOfLines={1}
            >
              {item.description}
            </Text>
            <Text className="text-sm text-gray-500 mb-0.5" numberOfLines={1}>
              {getTransactionSubtitle(item)}
            </Text>
            <Text className="text-xs text-gray-400">
              {item.date.toLocaleDateString()}
            </Text>
          </View>
        </View>
        <View className="items-end">
          <Text
            className="text-base font-bold mb-1"
            style={{ color: getTransactionColor(item.type) }}
          >
            {formatAmount(item.amount, item.type)}
          </Text>
          {item.isRecurring && (
            <View className="bg-gray-100 rounded-xl px-1.5 py-0.5">
              <Ionicons name="repeat" size={12} color="#6b7280" />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View className="flex-1 justify-center items-center py-16">
      <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
      <Text className="text-xl font-semibold text-gray-800 mt-4 mb-2">
        No Transactions Found
      </Text>
      <Text className="text-sm text-gray-500 text-center leading-5">
        {searchQuery.trim()
          ? "Try adjusting your search or filters"
          : "Start by adding your first transaction"}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View className="mb-4">
      {/* Search Bar */}
      <View className="flex-row items-center bg-white rounded-xl px-4 py-3 mb-4 shadow-sm">
        <Ionicons name="search" size={20} color="#9ca3af" />
        <TextInput
          className="flex-1 ml-3 text-base text-gray-800"
          placeholder="Search transactions..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close" size={20} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Buttons */}
      <View className="flex-row justify-between mb-4">
        {renderFilterButton("all", "All", "list")}
        {renderFilterButton("expense", "Expenses", "trending-down")}
        {renderFilterButton("income", "Income", "trending-up")}
        {renderFilterButton("transfer", "Transfers", "swap-horizontal")}
      </View>

      {/* Results Count */}
      <View className="mb-2">
        <Text className="text-sm text-gray-500 font-medium">
          {filteredTransactions.length} transaction
          {filteredTransactions.length !== 1 ? "s" : ""}
        </Text>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: 16,
          paddingBottom: 16,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      />
    </View>
  );
};
