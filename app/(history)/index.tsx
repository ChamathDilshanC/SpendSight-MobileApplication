import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";
import { useFinance } from "../../context/FinanceContext";

const { width: screenWidth } = Dimensions.get("window");
const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#3B82F6",
  },
};

type TimeFilter = "week" | "month" | "3months" | "year";

export default function HistoryScreen() {
  const financeContext = useFinance();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Early return for context safety - but keep hooks consistent
  if (!financeContext) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <Stack.Screen options={{ headerShown: false }} />
        <AppHeader title="History & Analytics" />
        <View className="items-center justify-center flex-1">
          <Text className="text-gray-500">Loading finance data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { transactions = [], categories = [], refreshData } = financeContext;

  // Hooks must be called consistently - after context check but before any other logic
  useFocusEffect(
    useCallback(() => {
      const handleRefreshData = async () => {
        try {
          await handleRefresh();
        } catch (error) {
          console.error("Error in useFocusEffect:", error);
        }
      };
      handleRefreshData();
    }, [])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTimeFilterChange = useCallback((newFilter: TimeFilter) => {
    try {
      setTimeFilter(newFilter);
    } catch (error) {
      console.error("Error changing time filter:", error);
    }
  }, []);

  const filteredTransactions = useMemo(() => {
    try {
      if (!transactions || transactions.length === 0) {
        return [];
      }

      const now = new Date();
      const filterDate = new Date();

      switch (timeFilter) {
        case "week":
          filterDate.setDate(now.getDate() - 7);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case "3months":
          filterDate.setMonth(now.getMonth() - 3);
          break;
        case "year":
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      return transactions.filter(
        (transaction) => new Date(transaction.date) >= filterDate
      );
    } catch (error) {
      console.error("Error filtering transactions:", error);
      return [];
    }
  }, [transactions, timeFilter]);

  const expensesByCategory = useMemo(() => {
    try {
      if (!filteredTransactions || filteredTransactions.length === 0) {
        return [];
      }

      const expenses = filteredTransactions.filter((t) => t.type === "expense");
      const categoryTotals: { [key: string]: number } = {};

      expenses.forEach((transaction) => {
        const category = categories.find(
          (cat) => cat.id === transaction.categoryId
        );
        const categoryName = category?.name || "Other";
        categoryTotals[categoryName] =
          (categoryTotals[categoryName] || 0) + Math.abs(transaction.amount);
      });

      return Object.entries(categoryTotals)
        .map(([name, amount]) => ({
          name,
          amount,
          color: categories.find((c) => c.name === name)?.color || "#8B5CF6",
          legendFontColor: "#7F7F7F",
          legendFontSize: 12,
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 8);
    } catch (error) {
      console.error("Error calculating expenses by category:", error);
      return [];
    }
  }, [filteredTransactions, categories]);

  const monthlyTrends = useMemo(() => {
    const monthlyData: {
      [key: string]: { income: number; expenses: number };
    } = {};

    filteredTransactions.forEach((transaction) => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === "income") {
        monthlyData[monthKey].income += transaction.amount;
      } else {
        monthlyData[monthKey].expenses += Math.abs(transaction.amount);
      }
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const last6Months = sortedMonths.slice(-6);

    return {
      labels: last6Months.map((month) => {
        const [year, monthNum] = month.split("-");
        const date = new Date(parseInt(year), parseInt(monthNum) - 1);
        return date.toLocaleDateString("en-US", { month: "short" });
      }),
      datasets: [
        {
          data: last6Months.map((month) => monthlyData[month]?.income || 0),
          color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
          strokeWidth: 2,
        },
        {
          data: last6Months.map((month) => monthlyData[month]?.expenses || 0),
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2,
        },
      ],
    };
  }, [filteredTransactions]);

  const summaryStats = useMemo(() => {
    try {
      if (!filteredTransactions || filteredTransactions.length === 0) {
        return {
          income: 0,
          expenses: 0,
          netAmount: 0,
          transactionCount: 0,
        };
      }

      const income = filteredTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const expenses = filteredTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const netAmount = income - expenses;

      return {
        income,
        expenses,
        netAmount,
        transactionCount: filteredTransactions.length,
      };
    } catch (error) {
      console.error("Error calculating summary stats:", error);
      return {
        income: 0,
        expenses: 0,
        netAmount: 0,
        transactionCount: 0,
      };
    }
  }, [filteredTransactions]);

  const formatCurrency = useCallback((amount: number) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(amount);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `$${amount.toFixed(2)}`;
    }
  }, []);

  const timeFilterOptions = [
    { value: "week" as const, label: "Week" },
    { value: "month" as const, label: "Month" },
    { value: "3months" as const, label: "3 Months" },
    { value: "year" as const, label: "Year" },
  ];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <AppHeader title="History & Analytics" />

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="p-4">
            {/* Time Filter */}
            <View className="flex-row p-1 mb-6 bg-gray-100 rounded-lg">
              {timeFilterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => handleTimeFilterChange(option.value)}
                  className={`flex-1 py-2 rounded-md ${
                    timeFilter === option.value
                      ? "bg-white shadow-sm"
                      : "bg-transparent"
                  }`}
                  activeOpacity={0.7}
                >
                  <Text
                    className={`text-center text-sm font-medium ${
                      timeFilter === option.value
                        ? "text-gray-900"
                        : "text-gray-600"
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Summary Stats Grid */}
            <View className="grid grid-cols-2 gap-4 mb-6">
              <View className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-600">
                    Total Income
                  </Text>
                  <Ionicons name="trending-up" size={16} color="#10B981" />
                </View>
                <Text className="text-lg font-bold text-green-600">
                  {formatCurrency(summaryStats.income)}
                </Text>
              </View>

              <View className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-600">
                    Total Expenses
                  </Text>
                  <Ionicons name="trending-down" size={16} color="#EF4444" />
                </View>
                <Text className="text-lg font-bold text-red-600">
                  {formatCurrency(summaryStats.expenses)}
                </Text>
              </View>

              <View className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-600">
                    Net Amount
                  </Text>
                  <Ionicons
                    name={
                      summaryStats.netAmount >= 0
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={16}
                    color={summaryStats.netAmount >= 0 ? "#10B981" : "#EF4444"}
                  />
                </View>
                <Text
                  className={`text-lg font-bold ${
                    summaryStats.netAmount >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {formatCurrency(summaryStats.netAmount)}
                </Text>
              </View>

              <View className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-sm font-medium text-gray-600">
                    Transactions
                  </Text>
                  <Ionicons name="receipt" size={16} color="#3B82F6" />
                </View>
                <Text className="text-lg font-bold text-blue-600">
                  {summaryStats.transactionCount}
                </Text>
              </View>
            </View>

            {/* Monthly Trends Chart */}
            {monthlyTrends &&
              monthlyTrends.labels &&
              monthlyTrends.labels.length > 0 && (
                <View className="mb-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                  <View className="p-4 border-b border-gray-100">
                    <Text className="text-lg font-semibold text-gray-900">
                      Income vs Expenses Trend
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Last 6 months comparison
                    </Text>
                  </View>
                  <View className="p-4">
                    <LineChart
                      data={monthlyTrends}
                      width={screenWidth - 64}
                      height={220}
                      chartConfig={chartConfig}
                      bezier
                      style={{
                        borderRadius: 8,
                      }}
                      withDots={true}
                      withShadow={false}
                      withInnerLines={false}
                      withOuterLines={false}
                    />
                    <View className="flex-row items-center justify-center mt-4 space-x-6">
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 mr-2 bg-green-500 rounded-full" />
                        <Text className="text-sm text-gray-600">Income</Text>
                      </View>
                      <View className="flex-row items-center">
                        <View className="w-3 h-3 mr-2 bg-red-500 rounded-full" />
                        <Text className="text-sm text-gray-600">Expenses</Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

            {/* Expenses by Category Pie Chart */}
            {expensesByCategory.length > 0 && (
              <View className="mb-6 bg-white border border-gray-100 shadow-sm rounded-xl">
                <View className="p-4 border-b border-gray-100">
                  <Text className="text-lg font-semibold text-gray-900">
                    Expenses by Category
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Top spending categories
                  </Text>
                </View>
                <View className="p-4">
                  <PieChart
                    data={expensesByCategory}
                    width={screenWidth - 64}
                    height={220}
                    chartConfig={chartConfig}
                    accessor="amount"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                    style={{
                      borderRadius: 8,
                    }}
                  />
                </View>
              </View>
            )}

            {/* Top Spending Categories Detailed List */}
            <View className="bg-white border border-gray-100 shadow-sm rounded-xl">
              <View className="p-4 border-b border-gray-100">
                <Text className="text-lg font-semibold text-gray-900">
                  Top Spending Categories
                </Text>
                <Text className="text-sm text-gray-500">
                  Detailed breakdown
                </Text>
              </View>
              <View className="p-4">
                {expensesByCategory.length > 0 ? (
                  <View className="space-y-3">
                    {expensesByCategory.map((category, index) => {
                      const percentage = (
                        (category.amount / summaryStats.expenses) *
                        100
                      ).toFixed(1);

                      return (
                        <View
                          key={category.name}
                          className="flex-row items-center"
                        >
                          <View className="flex-row items-center flex-1">
                            <View
                              className="w-4 h-4 mr-3 rounded-full"
                              style={{ backgroundColor: category.color }}
                            />
                            <Text className="flex-1 text-sm font-medium text-gray-900">
                              {category.name}
                            </Text>
                          </View>
                          <View className="items-end">
                            <Text className="text-sm font-semibold text-gray-900">
                              {formatCurrency(category.amount)}
                            </Text>
                            <Text className="text-xs text-gray-500">
                              {percentage}%
                            </Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : (
                  <View className="py-8 text-center">
                    <Ionicons
                      name="pie-chart-outline"
                      size={48}
                      color="#9CA3AF"
                    />
                    <Text className="mt-2 text-gray-500">
                      No expense data for this period
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Recent Transactions */}
            <View className="mt-6 bg-white border border-gray-100 shadow-sm rounded-xl">
              <View className="p-4 border-b border-gray-100">
                <Text className="text-lg font-semibold text-gray-900">
                  Recent Transactions
                </Text>
                <Text className="text-sm text-gray-500">
                  Last 10 transactions in this period
                </Text>
              </View>
              <View className="divide-y divide-gray-100">
                {filteredTransactions.slice(0, 10).map((transaction) => (
                  <View key={transaction.id} className="p-4">
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900">
                          {transaction.description}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {categories.find(
                            (cat) => cat.id === transaction.categoryId
                          )?.name || "Other"}{" "}
                          • {new Date(transaction.date).toLocaleDateString()}
                        </Text>
                      </View>
                      <Text
                        className={`text-lg font-bold ${
                          transaction.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(Math.abs(transaction.amount))}
                      </Text>
                    </View>
                  </View>
                ))}

                {filteredTransactions.length === 0 && (
                  <View className="py-8 text-center">
                    <Ionicons
                      name="receipt-outline"
                      size={48}
                      color="#9CA3AF"
                    />
                    <Text className="mt-2 text-gray-500">
                      No transactions found for this period
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
