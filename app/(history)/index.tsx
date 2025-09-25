import { Ionicons } from "@expo/vector-icons";
import { Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";
import { useFinance } from "../../context/FinanceContext";
import { useAuth } from "../../context/FirebaseAuthContext";
import { AccountService, CurrencyType } from "../../services/AccountService";

const { width: screenWidth } = Dimensions.get("window");

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(75, 85, 99, ${opacity})`,
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
  const { transactions, categories, refreshData } = useFinance();
  const { authState } = useAuth();

  const userCurrency: CurrencyType =
    authState?.user?.preferences?.currency || "USD";

  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
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
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    switch (timeFilter) {
      case "week":
        startDate.setDate(now.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "3months":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      return transactionDate >= startDate && transactionDate <= now;
    });
  }, [transactions, timeFilter]);

  const analytics = useMemo(() => {
    const totalIncome = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const netAmount = totalIncome - totalExpense;

    const categoryExpenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce(
        (acc, transaction) => {
          const categoryName =
            categories.find((cat) => cat.id === transaction.categoryId)?.name ||
            "Other";
          acc[categoryName] = (acc[categoryName] || 0) + transaction.amount;
          return acc;
        },
        {} as Record<string, number>
      );

    const periods = [];
    const periodIncome = [];
    const periodExpense = [];

    for (let i = 5; i >= 0; i--) {
      const periodStart = new Date();
      const periodEnd = new Date();

      if (timeFilter === "week") {
        periodStart.setDate(periodStart.getDate() - (i + 1) * 7);
        periodEnd.setDate(periodEnd.getDate() - i * 7);
        periods.push(`W${6 - i}`);
      } else {
        periodStart.setMonth(periodStart.getMonth() - (i + 1));
        periodEnd.setMonth(periodEnd.getMonth() - i);
        periods.push(periodStart.toLocaleDateString("en", { month: "short" }));
      }

      const periodTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return tDate >= periodStart && tDate < periodEnd;
      });

      periodIncome.push(
        periodTransactions
          .filter((t) => t.type === "income")
          .reduce((sum, t) => sum + t.amount, 0)
      );

      periodExpense.push(
        periodTransactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0)
      );
    }

    return {
      totalIncome,
      totalExpense,
      netAmount,
      categoryExpenses,
      periods,
      periodIncome,
      periodExpense,
    };
  }, [filteredTransactions, categories, transactions, timeFilter]);

  const formatCurrency = (amount: number): string => {
    return AccountService.formatCurrency(amount, userCurrency);
  };

  const pieChartData = Object.entries(analytics.categoryExpenses)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, amount], index) => ({
      name,
      amount,
      color: ["#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"][
        index
      ],
      legendFontColor: "#374151",
      legendFontSize: 12,
    }));

  const barChartData = {
    labels: analytics.periods,
    datasets: [
      {
        data: analytics.periodIncome.length > 0 ? analytics.periodIncome : [0],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
      },
      {
        data:
          analytics.periodExpense.length > 0 ? analytics.periodExpense : [0],
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
      },
    ],
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: "#f9fafb" }}
        edges={["top"]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <AppHeader title="Analytics & Insights" backgroundColor="#f9fafb" />

        <ScrollView
          className="flex-1"
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16 }}
        >
          {}
          <View className="mb-6">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 4 }}
            >
              <View className="flex-row gap-3">
                {(["week", "month", "3months", "year"] as TimeFilter[]).map(
                  (filter) => (
                    <TouchableOpacity
                      key={filter}
                      onPress={() => setTimeFilter(filter)}
                      className={`px-4 py-2 rounded-xl ${
                        timeFilter === filter
                          ? "bg-blue-600"
                          : "bg-white border border-gray-200"
                      }`}
                      style={{
                        shadowColor: timeFilter === filter ? "#3B82F6" : "#000",
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: timeFilter === filter ? 0.2 : 0.05,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          timeFilter === filter ? "text-white" : "text-gray-700"
                        }`}
                      >
                        {filter === "3months"
                          ? "3 Months"
                          : filter === "year"
                            ? "Year"
                            : filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </ScrollView>
          </View>

          {}
          <View className="mb-8">
            <Text className="mb-4 text-xl font-bold text-gray-900">
              Financial Overview
            </Text>
            <View className="gap-4">
              {}
              <View
                className="p-4 bg-white rounded-2xl"
                style={{
                  shadowColor: "#10B981",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="p-2 mr-3 rounded-xl"
                        style={{ backgroundColor: "#10B98120" }}
                      >
                        <Ionicons
                          name="trending-up"
                          size={20}
                          color="#10B981"
                        />
                      </View>
                      <Text className="text-base font-medium text-gray-600">
                        Total Income
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.totalIncome)}
                    </Text>
                  </View>
                </View>
              </View>

              {}
              <View
                className="p-4 bg-white rounded-2xl"
                style={{
                  shadowColor: "#EF4444",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="p-2 mr-3 rounded-xl"
                        style={{ backgroundColor: "#EF444420" }}
                      >
                        <Ionicons
                          name="trending-down"
                          size={20}
                          color="#EF4444"
                        />
                      </View>
                      <Text className="text-base font-medium text-gray-600">
                        Total Expenses
                      </Text>
                    </View>
                    <Text className="text-2xl font-bold text-gray-900">
                      {formatCurrency(analytics.totalExpense)}
                    </Text>
                  </View>
                </View>
              </View>

              {}
              <View
                className="p-4 bg-white rounded-2xl"
                style={{
                  shadowColor: analytics.netAmount >= 0 ? "#3B82F6" : "#F59E0B",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 12,
                  elevation: 4,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View
                        className="p-2 mr-3 rounded-xl"
                        style={{
                          backgroundColor:
                            analytics.netAmount >= 0
                              ? "#3B82F620"
                              : "#F59E0B20",
                        }}
                      >
                        <Ionicons
                          name={analytics.netAmount >= 0 ? "wallet" : "warning"}
                          size={20}
                          color={
                            analytics.netAmount >= 0 ? "#3B82F6" : "#F59E0B"
                          }
                        />
                      </View>
                      <Text className="text-base font-medium text-gray-600">
                        Net Amount
                      </Text>
                    </View>
                    <Text
                      className={`text-2xl font-bold ${
                        analytics.netAmount >= 0
                          ? "text-green-600"
                          : "text-orange-600"
                      }`}
                    >
                      {formatCurrency(analytics.netAmount)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {}
          {barChartData.datasets[0].data.some((val) => val > 0) ||
          barChartData.datasets[1].data.some((val) => val > 0) ? (
            <View className="mb-8">
              <Text className="mb-4 text-xl font-bold text-gray-900">
                Income vs Expenses Trend
              </Text>
              <View
                className="p-4 bg-white rounded-2xl"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <BarChart
                  data={barChartData}
                  width={screenWidth - 64}
                  height={220}
                  yAxisLabel=""
                  yAxisSuffix=""
                  chartConfig={{
                    ...chartConfig,
                    barPercentage: 0.7,
                    fillShadowGradient: "#3B82F6",
                    fillShadowGradientOpacity: 1,
                  }}
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  showValuesOnTopOfBars
                  fromZero
                  withHorizontalLabels={true}
                  withInnerLines={true}
                />
                <View className="flex-row justify-center gap-6 mt-4">
                  <View className="flex-row items-center">
                    <View
                      className="w-3 h-3 mr-2 rounded-full"
                      style={{ backgroundColor: "#10B981" }}
                    />
                    <Text className="text-sm font-medium text-gray-600">
                      Income
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <View
                      className="w-3 h-3 mr-2 rounded-full"
                      style={{ backgroundColor: "#EF4444" }}
                    />
                    <Text className="text-sm font-medium text-gray-600">
                      Expenses
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {}
          {pieChartData.length > 0 ? (
            <View className="mb-8">
              <Text className="mb-4 text-xl font-bold text-gray-900">
                Expense Categories
              </Text>
              <View
                className="p-4 bg-white rounded-2xl"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                <PieChart
                  data={pieChartData}
                  width={screenWidth - 64}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="15"
                  style={{
                    marginVertical: 8,
                    borderRadius: 16,
                  }}
                  absolute
                />
              </View>
            </View>
          ) : null}

          {}
          {filteredTransactions.length === 0 && (
            <View className="items-center py-12">
              <View className="items-center justify-center w-20 h-20 mb-4 bg-gray-100 rounded-full">
                <Ionicons name="analytics-outline" size={40} color="#9CA3AF" />
              </View>
              <Text className="mb-2 text-xl font-semibold text-gray-900">
                No Data Available
              </Text>
              <Text className="text-center text-gray-500">
                No transactions found for the selected time period.{"\n"}
                Add some transactions to see your analytics.
              </Text>
            </View>
          )}

          <View className="h-6" />
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
