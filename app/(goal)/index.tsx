import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";
import { useFinance } from "../../context/FinanceContext";
import { useAuth } from "../../context/FirebaseAuthContext";
import { useTabBackButton, useDashboardBackButton } from "../../hooks/useBackButton";
import { GoalService } from "../../services/GoalService";
import { Goal } from "../../types/finance";

interface NewGoal {
  name: string;
  description: string;
  targetAmount: string;
  targetDate: Date;
  category: string;
  icon: string;
  color: string;
}

export default function GoalsScreen() {
  const { authState } = useAuth();
  const { accounts, refreshData } = useFinance();


  // Redirect hardware back button to dashboard
  useDashboardBackButton(true);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Transaction modals state
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showAutoTransferModal, setShowAutoTransferModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Transaction form state
  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    accountId: "",
    description: "",
  });

  // Auto-transfer form state
  const [autoTransferForm, setAutoTransferForm] = useState({
    enabled: false,
    fromAccountId: "",
    amount: "",
    frequency: "monthly" as "daily" | "weekly" | "biweekly" | "monthly",
  });

  const [newGoal, setNewGoal] = useState<NewGoal>({
    name: "",
    description: "",
    targetAmount: "",
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
    category: "Savings",
    icon: "star",
    color: "#3B82F6",
  });

  // Goal categories with icons and colors
  const goalCategories = [
    { value: "Savings", icon: "save", color: "#10B981" },
    { value: "Travel", icon: "airplane", color: "#3B82F6" },
    { value: "Electronics", icon: "laptop", color: "#8B5CF6" },
    { value: "Emergency", icon: "shield", color: "#EF4444" },
    { value: "Home", icon: "home", color: "#F59E0B" },
    { value: "Education", icon: "school", color: "#06B6D4" },
  ];

  // Load goals on component mount
  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [authState?.user?.id])
  );

  const loadGoals = async () => {
    if (!authState?.user?.id) return;

    try {
      setLoading(true);
      const userGoals = await GoalService.getUserGoals(authState.user.id);
      setGoals(userGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
      Alert.alert("Error", "Failed to load goals. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async () => {
    if (!authState?.user?.id) return;

    if (!newGoal.name.trim()) {
      Alert.alert("Error", "Please enter a goal name");
      return;
    }

    const targetAmount = parseFloat(newGoal.targetAmount);
    if (!targetAmount || targetAmount <= 0) {
      Alert.alert("Error", "Please enter a valid target amount");
      return;
    }

    try {
      setLoading(true);

      const goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt"> =
        {
          name: newGoal.name.trim(),
          description: newGoal.description.trim(),
          targetAmount,
          currentAmount: 0,
          currency: "USD",
          targetDate: newGoal.targetDate,
          isCompleted: false,
          category: newGoal.category,
          icon: newGoal.icon,
          color: newGoal.color,
          autoPayment: {
            enabled: false,
          },
        };

      await GoalService.createGoal(authState.user.id, goalData);

      // Reset form
      setNewGoal({
        name: "",
        description: "",
        targetAmount: "",
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        category: "Savings",
        icon: "star",
        color: "#3B82F6",
      });

      setShowAddModal(false);
      await loadGoals();
      Alert.alert("Success", "Goal created successfully!");
    } catch (error) {
      console.error("Error creating goal:", error);
      Alert.alert("Error", "Failed to create goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const calculateProgress = (goal: Goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  };

  const getCategoryInfo = (category: string) => {
    return (
      goalCategories.find((cat) => cat.value === category) || goalCategories[0]
    );
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadGoals();
    await refreshData();
    setRefreshing(false);
  }, []);

  // Handler functions for goal actions
  const handleDepositPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setTransactionForm({
      amount: "",
      accountId: accounts.length > 0 ? accounts[0].id : "",
      description: `Deposit to ${goal.name}`,
    });
    setShowDepositModal(true);
  };

  const handleWithdrawPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setTransactionForm({
      amount: "",
      accountId: accounts.length > 0 ? accounts[0].id : "",
      description: `Withdrawal from ${goal.name}`,
    });
    setShowWithdrawModal(true);
  };

  const handleAutoTransferPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setAutoTransferForm({
      enabled: goal.autoPayment.enabled,
      fromAccountId:
        goal.autoPayment.fromAccountId ||
        (accounts.length > 0 ? accounts[0].id : ""),
      amount: goal.autoPayment.amount?.toString() || "",
      frequency: goal.autoPayment.frequency || "monthly",
    });
    setShowAutoTransferModal(true);
  };

  // Transaction handlers
  const handleDeposit = async () => {
    if (!selectedGoal || !authState?.user?.id) return;

    if (!transactionForm.amount || !transactionForm.accountId) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const amount = parseFloat(transactionForm.amount);
    if (amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      await GoalService.payTowardGoal(
        authState.user.id,
        selectedGoal.id,
        transactionForm.accountId,
        amount,
        transactionForm.description
      );

      setShowDepositModal(false);
      setTransactionForm({ amount: "", accountId: "", description: "" });
      await loadGoals();
      await refreshData();
      Alert.alert(
        "Success",
        `$${amount.toFixed(2)} deposited to ${selectedGoal.name}`
      );
    } catch (error) {
      console.error("Error depositing to goal:", error);
      Alert.alert("Error", "Failed to deposit to goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedGoal || !authState?.user?.id) return;

    if (!transactionForm.amount || !transactionForm.accountId) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const amount = parseFloat(transactionForm.amount);
    if (amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (amount > selectedGoal.currentAmount) {
      Alert.alert(
        "Error",
        `Insufficient balance. Available: $${selectedGoal.currentAmount.toFixed(2)}`
      );
      return;
    }

    try {
      setLoading(true);
      await GoalService.withdrawFromGoal(
        authState.user.id,
        selectedGoal.id,
        transactionForm.accountId,
        amount,
        transactionForm.description
      );

      setShowWithdrawModal(false);
      setTransactionForm({ amount: "", accountId: "", description: "" });
      await loadGoals();
      await refreshData();
      Alert.alert(
        "Success",
        `$${amount.toFixed(2)} withdrawn from ${selectedGoal.name}`
      );
    } catch (error) {
      console.error("Error withdrawing from goal:", error);
      Alert.alert(
        "Error",
        error instanceof Error
          ? error.message
          : "Failed to withdraw from goal. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAutoTransfer = async () => {
    if (!selectedGoal) return;

    if (
      autoTransferForm.enabled &&
      (!autoTransferForm.fromAccountId || !autoTransferForm.amount)
    ) {
      Alert.alert(
        "Error",
        "Please fill in all required fields for auto-transfer"
      );
      return;
    }

    try {
      setLoading(true);
      await GoalService.setupAutoTransfer(selectedGoal.id, {
        enabled: autoTransferForm.enabled,
        fromAccountId: autoTransferForm.enabled
          ? autoTransferForm.fromAccountId
          : undefined,
        amount: autoTransferForm.enabled
          ? parseFloat(autoTransferForm.amount)
          : undefined,
        frequency: autoTransferForm.enabled
          ? autoTransferForm.frequency
          : undefined,
      });

      setShowAutoTransferModal(false);
      await loadGoals();
      Alert.alert(
        "Success",
        `Auto-transfer ${autoTransferForm.enabled ? "enabled" : "disabled"} for ${selectedGoal.name}`
      );
    } catch (error) {
      console.error("Error setting up auto-transfer:", error);
      Alert.alert("Error", "Failed to setup auto-transfer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!authState?.user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <AppHeader title="Goals" />
        <View className="items-center justify-center flex-1">
          <Text className="text-gray-600">Please log in to view goals</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader
        title="Goals"
        rightComponent={
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            className="items-center justify-center w-10 h-10 bg-blue-500 rounded-full"
          >
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        }
      />

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <View className="mx-4 mt-4 mb-6">
          <View
            className="p-6 bg-blue-500 rounded-2xl"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text className="mb-2 text-lg font-medium text-white">
              Your Goals
            </Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-3xl font-bold text-white">
                  {goals.length}
                </Text>
                <Text className="text-sm text-white" style={{ opacity: 0.9 }}>
                  Total Goals
                </Text>
              </View>
              <View>
                <Text className="text-3xl font-bold text-white">
                  {goals.filter((g) => g.isCompleted).length}
                </Text>
                <Text className="text-sm text-white" style={{ opacity: 0.9 }}>
                  Completed
                </Text>
              </View>
              <View>
                <Text className="text-3xl font-bold text-white">
                  {goals.filter((g) => g.autoPayment.enabled).length}
                </Text>
                <Text className="text-sm text-white" style={{ opacity: 0.9 }}>
                  Auto-saving
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Goals List */}
        <View className="px-4">
          {loading && goals.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-gray-500">Loading goals...</Text>
            </View>
          ) : goals.length === 0 ? (
            <View
              className="items-center p-8 bg-white rounded-2xl"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons name="flag-outline" size={64} color="#9CA3AF" />
              <Text className="mt-4 mb-2 text-lg font-semibold text-gray-900">
                No Goals Yet
              </Text>
              <Text className="mb-6 text-center text-gray-500">
                Set your first financial goal and start saving automatically
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(true)}
                className="flex-row items-center px-6 py-3 bg-blue-500 rounded-xl"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="ml-2 font-semibold text-white">
                  Create Goal
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            goals.map((goal) => {
              const categoryInfo = getCategoryInfo(goal.category);
              const progress = calculateProgress(goal);

              return (
                <View
                  key={goal.id}
                  className="p-4 mb-4 bg-white shadow-sm rounded-2xl"
                >
                  {/* Goal Header */}
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="items-center justify-center w-12 h-12 mr-3 rounded-full"
                        style={{ backgroundColor: `${categoryInfo.color}20` }}
                      >
                        <Ionicons
                          name={categoryInfo.icon as any}
                          size={24}
                          color={categoryInfo.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">
                          {goal.name}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {goal.category}
                        </Text>
                      </View>
                    </View>

                    {goal.isCompleted && (
                      <View className="flex-row items-center px-3 py-1 bg-green-100 rounded-full">
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10B981"
                        />
                        <Text className="ml-1 text-xs font-medium text-green-700">
                          Completed
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Progress */}
                  <View className="mb-3">
                    <View className="flex-row justify-between mb-2">
                      <Text className="text-2xl font-bold text-gray-900">
                        {formatCurrency(goal.currentAmount)}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        of {formatCurrency(goal.targetAmount)}
                      </Text>
                    </View>

                    <View className="w-full h-3 bg-gray-200 rounded-full">
                      <View
                        className="h-3 rounded-full"
                        style={{
                          width: `${progress}%`,
                          backgroundColor:
                            progress >= 100 ? "#10B981" : categoryInfo.color,
                        }}
                      />
                    </View>

                    <Text className="mt-1 text-sm text-right text-gray-500">
                      {progress.toFixed(1)}% complete
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row justify-between mt-4 space-x-2">
                    <TouchableOpacity
                      onPress={() => handleDepositPress(goal)}
                      className="flex-row items-center justify-center flex-1 px-4 py-3 mr-2 bg-green-500 rounded-xl"
                    >
                      <Ionicons name="arrow-down" size={16} color="white" />
                      <Text className="ml-2 font-medium text-white">
                        Deposit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleWithdrawPress(goal)}
                      className="flex-row items-center justify-center flex-1 px-4 py-3 mr-2 bg-orange-500 rounded-xl"
                      disabled={goal.currentAmount <= 0}
                      style={{ opacity: goal.currentAmount <= 0 ? 0.5 : 1 }}
                    >
                      <Ionicons name="arrow-up" size={16} color="white" />
                      <Text className="ml-2 font-medium text-white">
                        Withdraw
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAutoTransferPress(goal)}
                      className="flex-row items-center justify-center flex-1 px-4 py-3 bg-blue-500 rounded-xl"
                    >
                      <Ionicons
                        name={goal.autoPayment.enabled ? "sync" : "time"}
                        size={16}
                        color="white"
                      />
                      <Text className="ml-2 font-medium text-white">Auto</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Bottom Spacing */}
        <View className="h-8" />
      </ScrollView>

      {/* Add Goal Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text className="text-lg font-medium text-red-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">New Goal</Text>
            <TouchableOpacity
              onPress={handleCreateGoal}
              disabled={!newGoal.name.trim()}
            >
              <Text
                className={`text-lg font-medium ${newGoal.name.trim() ? "text-blue-500" : "text-gray-400"}`}
              >
                Create
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {/* Goal Name */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Goal Name *
              </Text>
              <TextInput
                value={newGoal.name}
                onChangeText={(text) => setNewGoal({ ...newGoal, name: text })}
                placeholder="e.g., New MacBook, Vacation Fund"
                className="px-4 py-4 text-lg text-gray-900 bg-gray-50 rounded-xl"
                autoFocus
              />
            </View>

            {/* Category Selection */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {goalCategories.map((category) => (
                  <Pressable
                    key={category.value}
                    onPress={() =>
                      setNewGoal({
                        ...newGoal,
                        category: category.value,
                        icon: category.icon,
                        color: category.color,
                      })
                    }
                    className={`flex-row items-center px-4 py-2 rounded-xl ${
                      newGoal.category === category.value
                        ? "bg-blue-500"
                        : "bg-gray-100"
                    }`}
                  >
                    <Ionicons
                      name={category.icon as any}
                      size={16}
                      color={
                        newGoal.category === category.value
                          ? "white"
                          : category.color
                      }
                    />
                    <Text
                      className={`ml-2 font-medium ${
                        newGoal.category === category.value
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {category.value}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Target Amount */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Target Amount *
              </Text>
              <TextInput
                value={newGoal.targetAmount}
                onChangeText={(text) =>
                  setNewGoal({ ...newGoal, targetAmount: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
                className="px-4 py-4 text-lg text-gray-900 bg-gray-50 rounded-xl"
              />
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Description (Optional)
              </Text>
              <TextInput
                value={newGoal.description}
                onChangeText={(text) =>
                  setNewGoal({ ...newGoal, description: text })
                }
                placeholder="Add notes about your goal..."
                multiline
                numberOfLines={3}
                className="px-4 py-4 text-gray-900 bg-gray-50 rounded-xl"
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        visible={showDepositModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
              <Text className="text-lg font-medium text-red-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              Deposit to Goal
            </Text>
            <TouchableOpacity
              onPress={handleDeposit}
              disabled={!transactionForm.amount || !transactionForm.accountId}
            >
              <Text
                className={`text-lg font-medium ${transactionForm.amount && transactionForm.accountId ? "text-blue-500" : "text-gray-400"}`}
              >
                Deposit
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {selectedGoal && (
              <View className="p-4 mb-6 bg-blue-50 rounded-xl">
                <Text className="text-lg font-semibold text-gray-900">
                  {selectedGoal.name}
                </Text>
                <Text className="text-gray-600">
                  Current: {formatCurrency(selectedGoal.currentAmount)} /{" "}
                  {formatCurrency(selectedGoal.targetAmount)}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-3 font-medium text-gray-700">
                From Account
              </Text>
              <View className="p-4 bg-gray-50 rounded-xl">
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() =>
                      setTransactionForm({
                        ...transactionForm,
                        accountId: account.id,
                      })
                    }
                    className={`flex-row items-center justify-between p-3 rounded-lg ${transactionForm.accountId === account.id ? "bg-blue-500" : "bg-white"} mb-2`}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg ${transactionForm.accountId === account.id ? "text-white" : "text-gray-900"}`}
                      >
                        {account.name}
                      </Text>
                    </View>
                    <Text
                      className={`font-semibold ${transactionForm.accountId === account.id ? "text-white" : "text-gray-600"}`}
                    >
                      {formatCurrency(account.balance)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-3 font-medium text-gray-700">Amount</Text>
              <TextInput
                value={transactionForm.amount}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, amount: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
                className="px-4 py-4 text-lg text-gray-900 bg-gray-50 rounded-xl"
              />
            </View>

            <View className="mb-4">
              <Text className="mb-3 font-medium text-gray-700">
                Description
              </Text>
              <TextInput
                value={transactionForm.description}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, description: text })
                }
                placeholder="Enter description..."
                className="px-4 py-4 text-gray-900 bg-gray-50 rounded-xl"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
              <Text className="text-lg font-medium text-red-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              Withdraw from Goal
            </Text>
            <TouchableOpacity
              onPress={handleWithdraw}
              disabled={!transactionForm.amount || !transactionForm.accountId}
            >
              <Text
                className={`text-lg font-medium ${transactionForm.amount && transactionForm.accountId ? "text-orange-500" : "text-gray-400"}`}
              >
                Withdraw
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {selectedGoal && (
              <View className="p-4 mb-6 bg-orange-50 rounded-xl">
                <Text className="text-lg font-semibold text-gray-900">
                  {selectedGoal.name}
                </Text>
                <Text className="text-gray-600">
                  Available: {formatCurrency(selectedGoal.currentAmount)}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-3 font-medium text-gray-700">To Account</Text>
              <View className="p-4 bg-gray-50 rounded-xl">
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() =>
                      setTransactionForm({
                        ...transactionForm,
                        accountId: account.id,
                      })
                    }
                    className={`flex-row items-center justify-between p-3 rounded-lg ${transactionForm.accountId === account.id ? "bg-orange-500" : "bg-white"} mb-2`}
                  >
                    <View className="flex-row items-center">
                      <Text
                        className={`text-lg ${transactionForm.accountId === account.id ? "text-white" : "text-gray-900"}`}
                      >
                        {account.name}
                      </Text>
                    </View>
                    <Text
                      className={`font-semibold ${transactionForm.accountId === account.id ? "text-white" : "text-gray-600"}`}
                    >
                      {formatCurrency(account.balance)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View className="mb-4">
              <Text className="mb-3 font-medium text-gray-700">Amount</Text>
              <TextInput
                value={transactionForm.amount}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, amount: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
                className="px-4 py-4 text-lg text-gray-900 bg-gray-50 rounded-xl"
              />
              {selectedGoal && (
                <Text className="mt-2 text-sm text-gray-500">
                  Maximum: {formatCurrency(selectedGoal.currentAmount)}
                </Text>
              )}
            </View>

            <View className="mb-4">
              <Text className="mb-3 font-medium text-gray-700">
                Description
              </Text>
              <TextInput
                value={transactionForm.description}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, description: text })
                }
                placeholder="Enter description..."
                className="px-4 py-4 text-gray-900 bg-gray-50 rounded-xl"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Auto-Transfer Modal */}
      <Modal
        visible={showAutoTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowAutoTransferModal(false)}>
              <Text className="text-lg font-medium text-red-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              Auto-Transfer
            </Text>
            <TouchableOpacity onPress={handleSetupAutoTransfer}>
              <Text className="text-lg font-medium text-blue-500">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {selectedGoal && (
              <View className="p-4 mb-6 bg-blue-50 rounded-xl">
                <Text className="text-lg font-semibold text-gray-900">
                  {selectedGoal.name}
                </Text>
                <Text className="text-gray-600">
                  {selectedGoal.autoPayment.enabled
                    ? "Auto-saving enabled"
                    : "Auto-saving disabled"}
                </Text>
              </View>
            )}

            <View className="mb-6">
              <View className="flex-row items-center justify-between">
                <Text className="text-lg font-medium text-gray-700">
                  Enable Auto-Transfer
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setAutoTransferForm({
                      ...autoTransferForm,
                      enabled: !autoTransferForm.enabled,
                    })
                  }
                  className={`w-12 h-6 rounded-full ${autoTransferForm.enabled ? "bg-blue-500" : "bg-gray-300"}`}
                >
                  <View
                    className={`w-5 h-5 bg-white rounded-full mt-0.5 ${autoTransferForm.enabled ? "ml-6" : "ml-0.5"}`}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {autoTransferForm.enabled && (
              <>
                <View className="mb-4">
                  <Text className="mb-3 font-medium text-gray-700">
                    From Account
                  </Text>
                  <View className="p-4 bg-gray-50 rounded-xl">
                    {accounts.map((account) => (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() =>
                          setAutoTransferForm({
                            ...autoTransferForm,
                            fromAccountId: account.id,
                          })
                        }
                        className={`flex-row items-center justify-between p-3 rounded-lg ${autoTransferForm.fromAccountId === account.id ? "bg-blue-500" : "bg-white"} mb-2`}
                      >
                        <Text
                          className={`text-lg ${autoTransferForm.fromAccountId === account.id ? "text-white" : "text-gray-900"}`}
                        >
                          {account.name}
                        </Text>
                        <Text
                          className={`font-semibold ${autoTransferForm.fromAccountId === account.id ? "text-white" : "text-gray-600"}`}
                        >
                          {formatCurrency(account.balance)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-4">
                  <Text className="mb-3 font-medium text-gray-700">
                    Amount per Transfer
                  </Text>
                  <TextInput
                    value={autoTransferForm.amount}
                    onChangeText={(text) =>
                      setAutoTransferForm({ ...autoTransferForm, amount: text })
                    }
                    placeholder="0.00"
                    keyboardType="numeric"
                    className="px-4 py-4 text-lg text-gray-900 bg-gray-50 rounded-xl"
                  />
                </View>

                <View className="mb-4">
                  <Text className="mb-3 font-medium text-gray-700">
                    Frequency
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(["daily", "weekly", "biweekly", "monthly"] as const).map(
                      (freq) => (
                        <TouchableOpacity
                          key={freq}
                          onPress={() =>
                            setAutoTransferForm({
                              ...autoTransferForm,
                              frequency: freq,
                            })
                          }
                          className={`px-4 py-2 rounded-xl ${autoTransferForm.frequency === freq ? "bg-blue-500" : "bg-gray-100"}`}
                        >
                          <Text
                            className={`font-medium ${autoTransferForm.frequency === freq ? "text-white" : "text-gray-700"}`}
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        visible={showDepositModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowDepositModal(false)}>
              <Text className="text-lg font-medium text-red-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              Deposit to Goal
            </Text>
            <TouchableOpacity
              onPress={handleDeposit}
              disabled={!transactionForm.amount || !transactionForm.accountId}
            >
              <Text
                className={`text-lg font-medium ${transactionForm.amount && transactionForm.accountId ? "text-green-500" : "text-gray-400"}`}
              >
                Deposit
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {selectedGoal && (
              <View className="p-4 mb-6 bg-blue-50 rounded-xl">
                <Text className="text-lg font-semibold text-blue-900">
                  {selectedGoal.name}
                </Text>
                <Text className="text-blue-700">
                  Current: {formatCurrency(selectedGoal.currentAmount)} of{" "}
                  {formatCurrency(selectedGoal.targetAmount)}
                </Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                From Account *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row space-x-2"
              >
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() =>
                      setTransactionForm({
                        ...transactionForm,
                        accountId: account.id,
                      })
                    }
                    className={`px-4 py-3 rounded-xl ${transactionForm.accountId === account.id ? "bg-green-500" : "bg-gray-100"}`}
                  >
                    <Text
                      className={`font-medium ${transactionForm.accountId === account.id ? "text-white" : "text-gray-700"}`}
                    >
                      {account.name}
                    </Text>
                    <Text
                      className={`text-sm ${transactionForm.accountId === account.id ? "text-white" : "text-gray-500"}`}
                    >
                      {formatCurrency(account.balance)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">Amount *</Text>
              <TextInput
                value={transactionForm.amount}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, amount: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
                className="px-4 py-4 text-lg text-gray-900 bg-gray-50 rounded-xl"
              />
            </View>

            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Description
              </Text>
              <TextInput
                value={transactionForm.description}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, description: text })
                }
                placeholder="Deposit note..."
                className="px-4 py-4 text-gray-900 bg-gray-50 rounded-xl"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Withdraw Modal */}
      <Modal
        visible={showWithdrawModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowWithdrawModal(false)}>
              <Text className="text-lg font-medium text-red-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              Withdraw from Goal
            </Text>
            <TouchableOpacity
              onPress={handleWithdraw}
              disabled={!transactionForm.amount || !transactionForm.accountId}
            >
              <Text
                className={`text-lg font-medium ${transactionForm.amount && transactionForm.accountId ? "text-orange-500" : "text-gray-400"}`}
              >
                Withdraw
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {selectedGoal && (
              <View className="p-4 mb-6 bg-orange-50 rounded-xl">
                <Text className="text-lg font-semibold text-orange-900">
                  {selectedGoal.name}
                </Text>
                <Text className="text-orange-700">
                  Available: {formatCurrency(selectedGoal.currentAmount)}
                </Text>
              </View>
            )}

            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                To Account *
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row space-x-2"
              >
                {accounts.map((account) => (
                  <TouchableOpacity
                    key={account.id}
                    onPress={() =>
                      setTransactionForm({
                        ...transactionForm,
                        accountId: account.id,
                      })
                    }
                    className={`px-4 py-3 rounded-xl ${transactionForm.accountId === account.id ? "bg-orange-500" : "bg-gray-100"}`}
                  >
                    <Text
                      className={`font-medium ${transactionForm.accountId === account.id ? "text-white" : "text-gray-700"}`}
                    >
                      {account.name}
                    </Text>
                    <Text
                      className={`text-sm ${transactionForm.accountId === account.id ? "text-white" : "text-gray-500"}`}
                    >
                      {formatCurrency(account.balance)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">Amount *</Text>
              <TextInput
                value={transactionForm.amount}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, amount: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
                className="px-4 py-4 text-lg text-gray-900 bg-gray-50 rounded-xl"
              />
              {selectedGoal && (
                <Text className="mt-2 text-sm text-gray-500">
                  Maximum: {formatCurrency(selectedGoal.currentAmount)}
                </Text>
              )}
            </View>

            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Description
              </Text>
              <TextInput
                value={transactionForm.description}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, description: text })
                }
                placeholder="Withdrawal note..."
                className="px-4 py-4 text-gray-900 bg-gray-50 rounded-xl"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Auto-Transfer Modal */}
      <Modal
        visible={showAutoTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowAutoTransferModal(false)}>
              <Text className="text-lg font-medium text-red-500">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900">
              Auto-Transfer Setup
            </Text>
            <TouchableOpacity onPress={handleSetupAutoTransfer}>
              <Text className="text-lg font-medium text-blue-500">Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {selectedGoal && (
              <View className="p-4 mb-6 bg-blue-50 rounded-xl">
                <Text className="text-lg font-semibold text-blue-900">
                  {selectedGoal.name}
                </Text>
                <Text className="text-blue-700">
                  Target: {formatCurrency(selectedGoal.targetAmount)}
                </Text>
              </View>
            )}

            <View className="mb-6">
              <View className="flex-row items-center justify-between p-4 bg-gray-50 rounded-xl">
                <Text className="font-medium text-gray-700">
                  Enable Auto-Transfer
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setAutoTransferForm({
                      ...autoTransferForm,
                      enabled: !autoTransferForm.enabled,
                    })
                  }
                  className={`w-12 h-6 rounded-full ${autoTransferForm.enabled ? "bg-blue-500" : "bg-gray-300"}`}
                >
                  <View
                    className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform ${autoTransferForm.enabled ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {autoTransferForm.enabled && (
              <>
                <View className="mb-6">
                  <Text className="mb-3 font-medium text-gray-700">
                    From Account *
                  </Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    className="flex-row space-x-2"
                  >
                    {accounts.map((account) => (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() =>
                          setAutoTransferForm({
                            ...autoTransferForm,
                            fromAccountId: account.id,
                          })
                        }
                        className={`px-4 py-3 rounded-xl ${autoTransferForm.fromAccountId === account.id ? "bg-blue-500" : "bg-gray-100"}`}
                      >
                        <Text
                          className={`font-medium ${autoTransferForm.fromAccountId === account.id ? "text-white" : "text-gray-700"}`}
                        >
                          {account.name}
                        </Text>
                        <Text
                          className={`text-sm ${autoTransferForm.fromAccountId === account.id ? "text-white" : "text-gray-500"}`}
                        >
                          {formatCurrency(account.balance)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                <View className="mb-6">
                  <Text className="mb-3 font-medium text-gray-700">
                    Transfer Amount *
                  </Text>
                  <TextInput
                    value={autoTransferForm.amount}
                    onChangeText={(text) =>
                      setAutoTransferForm({ ...autoTransferForm, amount: text })
                    }
                    placeholder="0.00"
                    keyboardType="numeric"
                    className="px-4 py-4 text-lg text-gray-900 bg-gray-50 rounded-xl"
                  />
                </View>

                <View className="mb-6">
                  <Text className="mb-3 font-medium text-gray-700">
                    Frequency *
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(["daily", "weekly", "biweekly", "monthly"] as const).map(
                      (freq) => (
                        <TouchableOpacity
                          key={freq}
                          onPress={() =>
                            setAutoTransferForm({
                              ...autoTransferForm,
                              frequency: freq,
                            })
                          }
                          className={`px-4 py-2 rounded-xl ${autoTransferForm.frequency === freq ? "bg-blue-500" : "bg-gray-100"}`}
                        >
                          <Text
                            className={`font-medium ${autoTransferForm.frequency === freq ? "text-white" : "text-gray-700"}`}
                          >
                            {freq.charAt(0).toUpperCase() + freq.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      )
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
