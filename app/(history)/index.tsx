import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";
import { useFinance } from "../../context/FinanceContext";
import { useDashboardBackButton } from "../../hooks/useBackButton";

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
  // Redirect hardware back button to dashboard
  useDashboardBackButton(true);
  
  const { transactions, categories, refreshData } = useFinance();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
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
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter transactions based on time period
  const filteredTransactions = useMemo(() => {
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

    return transactions.filter((transaction) => transaction.date >= filterDate);
  }, [transactions, timeFilter]);

  // Prepare pie chart data for expense categories
  const pieChartData = useMemo(() => {
    const expenseTransactions = filteredTransactions.filter(
      (t) => t.type === "expense"
    );

    // Group by category
    const categoryTotals: { [key: string]: number } = {};
    expenseTransactions.forEach((transaction) => {
      const category = categories.find((c) => c.id === transaction.categoryId);
      const categoryName = category?.name || "Uncategorized";
      categoryTotals[categoryName] =
        (categoryTotals[categoryName] || 0) + transaction.amount;
    });

    // Convert to chart format and limit to top 6 categories
    const sortedCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6);

    const colors = [
      "#3B82F6", // Blue
      "#EF4444", // Red
      "#10B981", // Green
      "#F59E0B", // Yellow
      "#8B5CF6", // Purple
      "#EC4899", // Pink
    ];

    return sortedCategories.map(([name, amount], index) => ({
      name: name.length > 12 ? name.substring(0, 12) + "..." : name,
      amount: Math.round(amount),
      color: colors[index],
      legendFontColor: "#6B7280",
      legendFontSize: 12,
    }));
  }, [filteredTransactions, categories]);

  // Prepare line chart data for spending trends
  const lineChartData = useMemo(() => {
    const expensesByDate: { [key: string]: number } = {};
    const incomeByDate: { [key: string]: number } = {};

    // Get date range
    const endDate = new Date();
    const startDate = new Date();
    let daysToShow = 7;

    switch (timeFilter) {
      case "week":
        daysToShow = 7;
        startDate.setDate(endDate.getDate() - 6);
        break;
      case "month":
        daysToShow = 30;
        startDate.setDate(endDate.getDate() - 29);
        break;
      case "3months":
        daysToShow = 12; // Show by weeks
        startDate.setDate(endDate.getDate() - 84);
        break;
      case "year":
        daysToShow = 12; // Show by months
        startDate.setMonth(endDate.getMonth() - 11);
        break;
    }

    // Initialize data points
    const labels: string[] = [];
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate);
      if (timeFilter === "year") {
        date.setMonth(startDate.getMonth() + i);
        const monthLabel = date.toLocaleDateString("en-US", { month: "short" });
        labels.push(monthLabel);
        const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
        expensesByDate[monthKey] = 0;
        incomeByDate[monthKey] = 0;
      } else if (timeFilter === "3months") {
        date.setDate(startDate.getDate() + i * 7);
        const weekLabel = `W${Math.floor(i / 7) + 1}`;
        labels.push(weekLabel);
        const weekKey = `${date.getFullYear()}-${Math.floor(date.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
        expensesByDate[weekKey] = 0;
        incomeByDate[weekKey] = 0;
      } else {
        date.setDate(startDate.getDate() + i);
        const dayLabel = date.getDate().toString();
        labels.push(dayLabel);
        const dayKey = date.toDateString();
        expensesByDate[dayKey] = 0;
        incomeByDate[dayKey] = 0;
      }
    }

    // Aggregate transaction data
    filteredTransactions.forEach((transaction) => {
      let key: string;
      if (timeFilter === "year") {
        key = `${transaction.date.getFullYear()}-${transaction.date.getMonth()}`;
      } else if (timeFilter === "3months") {
        key = `${transaction.date.getFullYear()}-${Math.floor(transaction.date.getTime() / (7 * 24 * 60 * 60 * 1000))}`;
      } else {
        key = transaction.date.toDateString();
      }

      if (
        transaction.type === "expense" &&
        expensesByDate.hasOwnProperty(key)
      ) {
        expensesByDate[key] += transaction.amount;
      } else if (
        transaction.type === "income" &&
        incomeByDate.hasOwnProperty(key)
      ) {
        incomeByDate[key] += transaction.amount;
      }
    });

    return {
      labels: labels.slice(0, Math.min(labels.length, 8)), // Limit labels for readability
      datasets: [
        {
          data: Object.values(expensesByDate).slice(
            0,
            Math.min(Object.values(expensesByDate).length, 8)
          ),
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`, // Red for expenses
          strokeWidth: 3,
        },
      ],
    };
  }, [filteredTransactions, timeFilter]);

  const timeFilterOptions = [
    { key: "week", label: "1W" },
    { key: "month", label: "1M" },
    { key: "3months", label: "3M" },
    { key: "year", label: "1Y" },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate totals for the period
  const totalExpenses = filteredTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const netAmount = totalIncome - totalExpenses;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <AppHeader title="Transaction History" />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Time Filter Buttons */}
        <View className="flex-row justify-center px-4 py-4 mx-4 mt-4 bg-white shadow-sm rounded-xl">
          {timeFilterOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => setTimeFilter(option.key as TimeFilter)}
              className={`flex-1 py-3 mx-1 rounded-lg ${
                timeFilter === option.key ? "bg-blue-500" : "bg-gray-100"
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  timeFilter === option.key ? "text-white" : "text-gray-600"
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary Cards */}
        <View className="flex-row gap-3 px-4 py-4">
          <View className="flex-1 p-4 bg-white shadow-sm rounded-xl">
            <View className="flex-row items-center mb-2">
              <Ionicons name="trending-down" size={20} color="#EF4444" />
              <Text className="ml-2 text-sm font-medium text-gray-500">
                Expenses
              </Text>
            </View>
            <Text className="text-xl font-bold text-red-500">
              {formatCurrency(totalExpenses)}
            </Text>
          </View>

          <View className="flex-1 p-4 bg-white shadow-sm rounded-xl">
            <View className="flex-row items-center mb-2">
              <Ionicons name="trending-up" size={20} color="#10B981" />
              <Text className="ml-2 text-sm font-medium text-gray-500">
                Income
              </Text>
            </View>
            <Text className="text-xl font-bold text-green-500">
              {formatCurrency(totalIncome)}
            </Text>
          </View>

          <View className="flex-1 p-4 bg-white shadow-sm rounded-xl">
            <View className="flex-row items-center mb-2">
              <Ionicons
                name="calculator"
                size={20}
                color={netAmount >= 0 ? "#10B981" : "#EF4444"}
              />
              <Text className="ml-2 text-sm font-medium text-gray-500">
                Net
              </Text>
            </View>
            <Text
              className={`text-xl font-bold ${
                netAmount >= 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {formatCurrency(netAmount)}
            </Text>
          </View>
        </View>

        {/* Expense Trends Chart */}
        <View className="mx-4 mb-6 bg-white shadow-sm rounded-xl">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">
              Expense Trends
            </Text>
            <Ionicons name="trending-down" size={20} color="#EF4444" />
          </View>

          <View className="p-4">
            {lineChartData.labels.length > 0 &&
            lineChartData.datasets[0].data.some((val) => val > 0) ? (
              <LineChart
                data={lineChartData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 12,
                }}
                withDots={true}
                withShadow={false}
                withInnerLines={false}
                withOuterLines={false}
              />
            ) : (
              <View className="items-center justify-center py-12">
                <Ionicons name="bar-chart-outline" size={48} color="#D1D5DB" />
                <Text className="mt-2 text-gray-500">
                  No expense data available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Expense Categories Chart */}
        <View className="mx-4 mb-6 bg-white shadow-sm rounded-xl">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">
              Expense Categories
            </Text>
            <Ionicons name="pie-chart" size={20} color="#3B82F6" />
          </View>

          <View className="p-4">
            {pieChartData.length > 0 ? (
              <PieChart
                data={pieChartData}
                width={screenWidth - 64}
                height={200}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="15"
                center={[10, 0]}
                style={{
                  marginVertical: 8,
                  borderRadius: 12,
                }}
              />
            ) : (
              <View className="items-center justify-center py-12">
                <Ionicons name="pie-chart-outline" size={48} color="#D1D5DB" />
                <Text className="mt-2 text-gray-500">
                  No category data available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Transaction Summary */}
        <View className="mx-4 mb-6 bg-white shadow-sm rounded-xl">
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-900">
              Period Summary
            </Text>
            <Ionicons name="list" size={20} color="#6B7280" />
          </View>

          <View className="p-4">
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Total Transactions</Text>
              <Text className="font-semibold text-gray-900">
                {filteredTransactions.length}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Expense Transactions</Text>
              <Text className="font-semibold text-red-500">
                {
                  filteredTransactions.filter((t) => t.type === "expense")
                    .length
                }
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Income Transactions</Text>
              <Text className="font-semibold text-green-500">
                {filteredTransactions.filter((t) => t.type === "income").length}
              </Text>
            </View>
            <View className="flex-row justify-between py-2">
              <Text className="text-gray-600">Transfer Transactions</Text>
              <Text className="font-semibold text-blue-500">
                {
                  filteredTransactions.filter((t) => t.type === "transfer")
                    .length
                }
              </Text>
            </View>
            <View className="h-px my-2 bg-gray-200" />
            <View className="flex-row justify-between py-2">
              <Text className="font-semibold text-gray-900">
                Average per Day
              </Text>
              <Text className="font-semibold text-gray-900">
                {formatCurrency(
                  totalExpenses /
                    Math.max(
                      1,
                      timeFilter === "week"
                        ? 7
                        : timeFilter === "month"
                          ? 30
                          : timeFilter === "3months"
                            ? 90
                            : 365
                    )
                )}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}
