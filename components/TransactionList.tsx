import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
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
    "all" | "expense" | "income" | "transfer" | "goal_payment"
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
        return "#8b5cf6"; // Purple color for goals
      default:
        return "#6b7280";
    }
  };

  const formatAmount = (amount: number, type: Transaction["type"]): string => {
    const prefix =
      type === "expense" || type === "goal_payment"
        ? "-"
        : type === "income"
          ? "+"
          : "";
    return `${prefix}$${amount.toFixed(2)}`;
  };

  const getTransactionSubtitle = (transaction: Transaction): string => {
    const { type, categoryId, fromAccountId, toAccountId } = transaction;

    if (type === "transfer") {
      const fromAccount = getAccountById(fromAccountId || "");
      const toAccount = getAccountById(toAccountId || "");
      return `${fromAccount?.name || "Unknown"} → ${toAccount?.name || "Unknown"}`;
    }

    if (type === "goal_payment") {
      const account = getAccountById(fromAccountId || "");
      return `Goal Payment • ${account?.name || "Unknown Account"}`;
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
      className={`flex-row items-center px-4 py-3 rounded-xl shadow-sm ${
        filterType === type ? "bg-blue-600" : "bg-white"
      }`}
      style={{ minWidth: 80 }}
      onPress={() => setFilterType(type)}
    >
      <Ionicons
        name={icon as any}
        size={16}
        color={filterType === type ? "#fff" : "#6b7280"}
      />
      <Text
        className={`ml-2 text-sm font-medium ${
          filterType === type ? "text-white" : "text-gray-500"
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderTransaction = ({ item }: { item: Transaction }) => (
    <TouchableOpacity
      className="mb-2 bg-white shadow-sm rounded-xl"
      onPress={() => onTransactionPress(item)}
    >
      <View className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center flex-1">
          <View
            className="items-center justify-center w-10 h-10 mr-3 rounded-full"
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
            className="mb-1 text-base font-bold"
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
    <View className="items-center justify-center flex-1 py-16">
      <Ionicons name="receipt-outline" size={64} color="#d1d5db" />
      <Text className="mt-4 mb-2 text-xl font-semibold text-gray-800">
        No Transactions Found
      </Text>
      <Text className="text-sm leading-5 text-center text-gray-500">
        {searchQuery.trim()
          ? "Try adjusting your search or filters"
          : "Start by adding your first transaction"}
      </Text>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search and Filters - Moved outside FlatList */}
      <View className="px-4 mb-4">
        {/* Search Bar */}
        <View className="flex-row items-center px-4 py-3 mt-5 mb-4 bg-white shadow-sm rounded-xl">
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
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 16, paddingVertical: 8 }}
          className="mb-4"
        >
          <View className="flex-row gap-3">
            {renderFilterButton("all", "All", "list")}
            {renderFilterButton("expense", "Expenses", "trending-down")}
            {renderFilterButton("income", "Income", "trending-up")}
            {renderFilterButton("transfer", "Transfers", "swap-horizontal")}
            {renderFilterButton("goal_payment", "Goals", "trophy-outline")}
          </View>
        </ScrollView>

        {/* Results Count */}
        <View className="mb-2">
          <Text className="text-sm font-medium text-gray-500">
            {filteredTransactions.length} transaction
            {filteredTransactions.length !== 1 ? "s" : ""}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
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
