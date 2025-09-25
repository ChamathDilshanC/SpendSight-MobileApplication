import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as Haptics from "expo-haptics";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
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
import { GoalService } from "../../services/GoalService";
import { Goal } from "../../types/finance";

const useCurrency = () => {
  const { authState } = useAuth();
  const userCurrency = authState?.user?.preferences?.currency || "USD";

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: userCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCurrencySymbol = (): string => {
    try {
      return (
        new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: userCurrency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
          .formatToParts(1)
          .find((part) => part.type === "currency")?.value || userCurrency
      );
    } catch {
      return userCurrency;
    }
  };

  return {
    currency: userCurrency,
    formatCurrency,
    getCurrencySymbol,
  };
};

const { height: screenHeight } = Dimensions.get("window");

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
  const { currency, formatCurrency } = useCurrency();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  const [transactionForm, setTransactionForm] = useState({
    amount: "",
    accountId: "",
    description: "",
  });

  const [newGoal, setNewGoal] = useState<NewGoal>({
    name: "",
    description: "",
    targetAmount: "",
    targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    category: "savings",
    icon: "star-outline",
    color: "#3B82F6",
  });

  const goalCategories = [
    {
      value: "savings",
      label: "Savings",
      icon: "save-outline",
      color: "#10B981",
    },
    {
      value: "vacation",
      label: "Vacation",
      icon: "airplane-outline",
      color: "#3B82F6",
    },
    { value: "car", label: "Car", icon: "car-outline", color: "#F59E0B" },
    { value: "home", label: "Home", icon: "home-outline", color: "#8B5CF6" },
    {
      value: "education",
      label: "Education",
      icon: "school-outline",
      color: "#EF4444",
    },
    {
      value: "emergency",
      label: "Emergency",
      icon: "shield-outline",
      color: "#6B7280",
    },
    {
      value: "investment",
      label: "Investment",
      icon: "trending-up-outline",
      color: "#059669",
    },
    {
      value: "other",
      label: "Other",
      icon: "ellipsis-horizontal-outline",
      color: "#EC4899",
    },
  ];

  const goalIcons = [
    "star-outline",
    "trophy-outline",
    "gift-outline",
    "heart-outline",
    "diamond-outline",
    "rocket-outline",
    "medal-outline",
    "flag-outline",
    "save-outline",
    "airplane-outline",
    "car-outline",
    "home-outline",
    "school-outline",
    "shield-outline",
  ];

  const goalColors = [
    "#3B82F6",
    "#10B981",
    "#EF4444",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#84CC16",
    "#059669",
    "#0891B2",
    "#1D4ED8",
    "#7C3AED",
    "#DC2626",
    "#16A34A",
  ];

  const onDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate && event.type !== "dismissed") {
      setNewGoal({ ...newGoal, targetDate: selectedDate });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const openDatePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowDatePicker(true);
  };

  const closeDatePicker = () => {
    setShowDatePicker(false);
  };

  const loadGoals = useCallback(async () => {
    if (!authState?.user?.id) {
      setLoading(false);
      return;
    }

    try {
      const userGoals = await GoalService.getUserGoals(authState.user.id);
      setGoals(userGoals);
    } catch (error) {
      console.error("Error loading goals:", error);
      Alert.alert("Error", "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }, [authState?.user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadGoals();
    }, [loadGoals])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadGoals(), refreshData()]);
    setRefreshing(false);
  };

  const openAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingGoal(null);
    setNewGoal({
      name: "",
      description: "",
      targetAmount: "",
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      category: "savings",
      icon: "star-outline",
      color: "#3B82F6",
    });
    setShowAddModal(true);
  };

  const openEditModal = (goal: Goal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingGoal(goal);
    setNewGoal({
      name: goal.name,
      description: goal.description || "",
      targetAmount: goal.targetAmount.toString(),
      targetDate: new Date(goal.targetDate),
      category: goal.category,
      icon: goal.icon,
      color: goal.color,
    });
    setShowAddModal(true);
  };

  const handleCreateGoal = async () => {
    if (!authState?.user?.id) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "User not authenticated");
      return;
    }

    if (!newGoal.name.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Error", "Please enter a goal name");
      return;
    }

    const targetAmount = parseFloat(newGoal.targetAmount);
    if (!targetAmount || targetAmount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Error", "Please enter a valid target amount");
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const goalData = {
        name: newGoal.name.trim(),
        description: newGoal.description.trim(),
        targetAmount,
        targetDate: newGoal.targetDate,
        category: newGoal.category,
        icon: newGoal.icon,
        color: newGoal.color,
        currency: currency,
        currentAmount: 0,
        isCompleted: false,
        autoPayment: {
          enabled: false,
        },
      };

      await GoalService.createGoal(authState.user.id, goalData);

      setNewGoal({
        name: "",
        description: "",
        targetAmount: "",
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        category: "savings",
        icon: "star-outline",
        color: "#3B82F6",
      });

      setShowAddModal(false);
      await loadGoals();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Goal created successfully!");
    } catch (error) {
      console.error("Error creating goal:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to create goal");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateGoal = async () => {
    if (!editingGoal) return;

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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const updateData = {
        name: newGoal.name.trim(),
        description: newGoal.description.trim(),
        targetAmount,
        targetDate: newGoal.targetDate,
        category: newGoal.category,
        icon: newGoal.icon,
        color: newGoal.color,
      };

      await GoalService.updateGoal(editingGoal.id, updateData);

      setEditingGoal(null);
      setShowAddModal(false);
      await loadGoals();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Goal updated successfully!");
    } catch (error) {
      console.error("Error updating goal:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update goal. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDepositToGoal = async () => {
    if (
      !selectedGoal ||
      !transactionForm.amount ||
      !transactionForm.accountId ||
      !authState?.user?.id
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const amount = parseFloat(transactionForm.amount);
    if (amount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await GoalService.payTowardGoal(
        authState.user.id,
        selectedGoal.id,
        transactionForm.accountId,
        amount,
        transactionForm.description.trim() || `Deposit to ${selectedGoal.name}`
      );

      setTransactionForm({ amount: "", accountId: "", description: "" });
      setShowDepositModal(false);
      setSelectedGoal(null);
      await Promise.all([loadGoals(), refreshData()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Deposit added successfully!");
    } catch (error) {
      console.error("Error adding deposit:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to add deposit");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawFromGoal = async () => {
    if (
      !selectedGoal ||
      !transactionForm.amount ||
      !transactionForm.accountId ||
      !authState?.user?.id
    ) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    const amount = parseFloat(transactionForm.amount);
    if (amount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    if (amount > selectedGoal.currentAmount) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Cannot withdraw more than the current goal amount");
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await GoalService.withdrawFromGoal(
        authState.user.id,
        selectedGoal.id,
        transactionForm.accountId,
        amount,
        transactionForm.description.trim() ||
          `Withdrawal from ${selectedGoal.name}`
      );

      setTransactionForm({ amount: "", accountId: "", description: "" });
      setShowWithdrawModal(false);
      setSelectedGoal(null);
      await Promise.all([loadGoals(), refreshData()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Withdrawal processed successfully!");
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = (goal: Goal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Delete Goal",
      `Are you sure you want to delete "${goal.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);

              await GoalService.deleteGoal(goal.id, goal.name);
              await loadGoals();
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Success", "Goal deleted successfully!");
            } catch (error) {
              console.error("Error deleting goal:", error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", "Failed to delete goal. Please try again.");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const calculateTotalGoalAmount = () => {
    return goals.reduce((total, goal) => total + goal.currentAmount, 0);
  };

  const LoadingSpinner = () => (
    <View className="items-center justify-center p-8">
      <ActivityIndicator size="large" color="#10B981" />
      <Text className="mt-2 text-gray-600">Loading goals...</Text>
    </View>
  );

  if (!authState?.user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <AppHeader title="Goals" />
        <View className="items-center justify-center flex-1">
          <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
          <Text className="mt-4 text-lg text-gray-600">
            Please log in to view goals
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading && goals.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <AppHeader title="Goals" backgroundColor="#f9fafb" />
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <AppHeader title="Goals" backgroundColor="#f9fafb" />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        className="flex-1"
        style={{ backgroundColor: "#f9fafb" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        {}
        <View className="mb-6">
          <View
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: "#10B981",
              shadowColor: "#10B981",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <Text className="mb-1 text-base font-medium text-white opacity-90">
              Total Saved
            </Text>
            <Text className="mb-4 text-3xl font-bold text-white">
              {formatCurrency(calculateTotalGoalAmount())}
            </Text>

            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-sm text-white opacity-80">
                  Active Goals
                </Text>
                <Text className="text-xl font-semibold text-white">
                  {goals.length}
                </Text>
              </View>

              <TouchableOpacity
                onPress={openAddModal}
                className="flex-row items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="white" />
                <Text className="ml-1 text-sm font-semibold text-white">
                  Add Goal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text className="mt-6 mb-5 text-xl font-bold text-gray-900">
          Your Goals
        </Text>

        {loading && goals.length === 0 ? (
          <LoadingSpinner />
        ) : goals.length === 0 ? (
          <View
            className="items-center p-6 bg-white rounded-2xl"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <Ionicons name="trophy-outline" size={60} color="#D1D5DB" />
            <Text className="mt-4 mb-2 text-xl font-bold text-gray-900">
              No Goals Yet
            </Text>
            <Text className="mb-6 text-center text-gray-600">
              Create your first financial goal to start saving for what matters
              most
            </Text>
            <TouchableOpacity
              onPress={openAddModal}
              className="flex-row items-center px-6 py-3 rounded-xl"
              style={{
                backgroundColor: "#10B981",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 2,
              }}
              activeOpacity={0.9}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text className="ml-2 text-base font-semibold text-white">
                Create Goal
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          goals.map((goal, index) => {
            const progress = calculateProgress(
              goal.currentAmount,
              goal.targetAmount
            );
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const goalColor = goal.color || "#3B82F6";
            const goalIcon = goal.icon || "star-outline";

            return (
              <View
                key={goal.id}
                className="p-3 mb-3 bg-white shadow-sm rounded-xl"
                style={{
                  shadowColor: goalColor,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View
                      className="items-center justify-center w-10 h-10 mr-3 rounded-xl"
                      style={{
                        backgroundColor: isCompleted
                          ? "#10B98120"
                          : `${goalColor}20`,
                        shadowColor: goalColor,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      }}
                    >
                      <Ionicons
                        name={isCompleted ? "trophy" : (goalIcon as any)}
                        size={20}
                        color={isCompleted ? "#10B981" : goalColor}
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900">
                        {goal.name}
                      </Text>
                      <Text
                        className="text-xs font-medium"
                        style={{ color: goalColor }}
                      >
                        {goal.category.charAt(0).toUpperCase() +
                          goal.category.slice(1)}
                      </Text>
                      {goal.description && (
                        <Text className="mt-0.5 text-xs text-gray-500">
                          {goal.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="items-end">
                    <Text
                      className={`text-lg font-bold ${
                        progress >= 100 ? "text-emerald-500" : "text-gray-900"
                      }`}
                    >
                      {formatCurrency(goal.currentAmount)}
                    </Text>
                    <Text className="text-xs font-medium text-gray-400">
                      of {formatCurrency(goal.targetAmount)}
                    </Text>
                  </View>
                </View>

                <View className="my-3">
                  <View className="h-2 overflow-hidden bg-gray-200 rounded-full">
                    <View
                      className="h-full rounded-full"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: isCompleted ? "#10B981" : goalColor,
                      }}
                    />
                  </View>
                  <View className="flex-row items-center justify-between mt-2">
                    <Text className="text-sm font-semibold text-gray-700">
                      {progress.toFixed(1)}% complete
                    </Text>
                    <Text className="text-sm text-gray-500">
                      Due: {formatDate(goal.targetDate)}
                    </Text>
                  </View>
                </View>

                {isCompleted && (
                  <View className="p-3 mb-3 border border-green-200 rounded-xl bg-green-50">
                    <View className="flex-row items-center justify-center">
                      <Ionicons name="trophy" size={20} color="#10B981" />
                      <Text className="ml-2 text-sm font-bold text-green-800">
                        Goal Completed!
                      </Text>
                    </View>
                  </View>
                )}

                <View className="flex-row justify-between mt-3">
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedGoal(goal);
                        setShowDepositModal(true);
                      }}
                      className="flex-row items-center px-3 py-1.5 rounded-lg bg-green-50"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="add-circle" size={14} color="#10B981" />
                      <Text className="ml-1 text-xs font-semibold text-green-600">
                        Deposit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        if (goal.currentAmount > 0) {
                          setSelectedGoal(goal);
                          setShowWithdrawModal(true);
                        }
                      }}
                      className={`flex-row items-center px-3 py-1.5 rounded-lg ${
                        goal.currentAmount > 0 ? "bg-red-50" : "bg-gray-50"
                      }`}
                      disabled={goal.currentAmount === 0}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="remove-circle"
                        size={14}
                        color={goal.currentAmount > 0 ? "#EF4444" : "#9CA3AF"}
                      />
                      <Text
                        className={`ml-1 text-xs font-semibold ${
                          goal.currentAmount > 0
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      >
                        Withdraw
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      onPress={() => openEditModal(goal)}
                      className="flex-row items-center px-3 py-1.5 rounded-lg bg-blue-50"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="pencil" size={14} color="#3B82F6" />
                      <Text className="ml-1 text-xs font-semibold text-blue-600">
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteGoal(goal)}
                      className="flex-row items-center px-3 py-1.5 rounded-lg bg-rose-50"
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash" size={14} color="#EF4444" />
                      <Text className="ml-1 text-xs font-semibold text-rose-600">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}

        <View className="h-10" />
      </ScrollView>

      {}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowAddModal(false);
          setShowDatePicker(false);
        }}
      >
        <View className="flex-1 bg-black/50">
          <View
            className="mt-16 bg-white rounded-t-3xl"
            style={{
              height: screenHeight - 64,
              flex: 1,
            }}
          >
            {}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">
                {editingGoal ? "Edit Goal" : "Add New Goal"}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setShowAddModal(false);
                  setShowDatePicker(false);
                }}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={20} color="#374151" />
              </TouchableOpacity>
            </View>

            {}
            <ScrollView
              className="flex-1"
              contentContainerStyle={{ padding: 20 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {}
              <View className="mb-5">
                <Text className="mb-3 text-base font-semibold text-gray-700">
                  Goal Name *
                </Text>
                <TextInput
                  value={newGoal.name}
                  onChangeText={(text) =>
                    setNewGoal({ ...newGoal, name: text })
                  }
                  placeholder="Enter goal name"
                  className="p-4 text-base bg-white border border-gray-300 rounded-xl"
                  style={{ minHeight: 50 }}
                />
              </View>

              {}
              <View className="mb-5">
                <Text className="mb-3 text-base font-semibold text-gray-700">
                  Target Amount *
                </Text>
                <TextInput
                  value={newGoal.targetAmount}
                  onChangeText={(text) =>
                    setNewGoal({ ...newGoal, targetAmount: text })
                  }
                  placeholder="0.00"
                  keyboardType="numeric"
                  className="p-4 text-base bg-white border border-gray-300 rounded-xl"
                  style={{ minHeight: 50 }}
                />
              </View>

              {}
              <View className="mb-5">
                <Text className="mb-3 text-base font-semibold text-gray-700">
                  Category
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-3 pb-2">
                    {goalCategories.map((category) => (
                      <TouchableOpacity
                        key={category.value}
                        onPress={() =>
                          setNewGoal({ ...newGoal, category: category.value })
                        }
                        className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                          newGoal.category === category.value
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white"
                        }`}
                        style={{ minWidth: 120 }}
                      >
                        <Ionicons
                          name={category.icon as any}
                          size={18}
                          color={
                            newGoal.category === category.value
                              ? category.color
                              : "#6B7280"
                          }
                        />
                        <Text
                          className={`ml-2 font-medium ${
                            newGoal.category === category.value
                              ? "text-green-700"
                              : "text-gray-700"
                          }`}
                        >
                          {category.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {}
              <View className="mb-5">
                <Text className="mb-3 text-base font-semibold text-black-700">
                  Target Date
                </Text>
                <TouchableOpacity
                  className="p-4 bg-white border border-gray-300 rounded-xl"
                  onPress={openDatePicker}
                  activeOpacity={0.7}
                  style={{ minHeight: 50 }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center">
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#6b7280"
                      />
                      <Text className="ml-3 text-base text-gray-900">
                        {formatDate(newGoal.targetDate)}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#6b7280" />
                  </View>
                </TouchableOpacity>

                {}
                {}
                {showDatePicker && Platform.OS === "ios" && (
                  <View
                    className="mt-4 bg-white border border-gray-200 rounded-xl"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 8,
                      elevation: 3,
                    }}
                  >
                    <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
                      <Text className="text-lg font-semibold text-gray-900">
                        Select Target Date
                      </Text>
                      <TouchableOpacity
                        onPress={closeDatePicker}
                        className="px-4 py-2 bg-blue-500 rounded-lg"
                        style={{
                          shadowColor: "#3B82F6",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.2,
                          shadowRadius: 4,
                        }}
                      >
                        <Text className="font-semibold text-white">Done</Text>
                      </TouchableOpacity>
                    </View>
                    <View className="p-4">
                      <DateTimePicker
                        value={newGoal.targetDate}
                        mode="date"
                        display="spinner"
                        onChange={onDateChange}
                        minimumDate={new Date()}
                        style={{
                          backgroundColor: "white",
                          height: 180,
                        }}
                        textColor="#000000"
                        themeVariant="light"
                      />
                    </View>
                  </View>
                )}
              </View>

              {}
              <View className="mb-5">
                <Text className="mb-3 text-base font-semibold text-gray-700">
                  Description (Optional)
                </Text>
                <TextInput
                  value={newGoal.description}
                  onChangeText={(text) =>
                    setNewGoal({ ...newGoal, description: text })
                  }
                  placeholder="Enter description"
                  className="p-4 text-base bg-white border border-gray-300 rounded-xl"
                  multiline
                  numberOfLines={3}
                  style={{ minHeight: 80, textAlignVertical: "top" }}
                />
              </View>

              {}
              <View className="mb-5">
                <Text className="mb-3 text-base font-semibold text-gray-700">
                  Choose Color
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {goalColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setNewGoal({ ...newGoal, color })}
                      className={`w-12 h-12 rounded-full border-4 ${
                        newGoal.color === color
                          ? "border-gray-800"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </View>
              </View>

              {}
              <View className="mb-8">
                <Text className="mb-3 text-base font-semibold text-gray-700">
                  Choose Icon
                </Text>
                <View className="flex-row flex-wrap gap-3">
                  {goalIcons.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      onPress={() => setNewGoal({ ...newGoal, icon })}
                      className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
                        newGoal.icon === icon
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons
                        name={icon as any}
                        size={22}
                        color={newGoal.icon === icon ? "#10B981" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {}
            <View className="p-4 bg-white border-t border-gray-100">
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => {
                    setShowAddModal(false);
                    setShowDatePicker(false);
                  }}
                  className="flex-1 px-6 py-4 bg-gray-100 rounded-xl"
                >
                  <Text className="text-base font-semibold text-center text-gray-700">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={editingGoal ? handleUpdateGoal : handleCreateGoal}
                  className="flex-1 px-6 py-4 rounded-xl"
                  style={{ backgroundColor: "#10B981" }}
                >
                  <Text className="text-base font-semibold text-center text-white">
                    {editingGoal ? "Update" : "Create"} Goal
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {}
      {showDatePicker && Platform.OS === "android" && (
        <DateTimePicker
          value={newGoal.targetDate}
          mode="date"
          display="default"
          onChange={onDateChange}
          minimumDate={new Date()}
        />
      )}

      {}
      <Modal
        visible={showDepositModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDepositModal(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="p-6 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">
                Deposit Funds
              </Text>
              <TouchableOpacity
                onPress={() => setShowDepositModal(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <View className="p-4 mb-4 border border-green-200 rounded-xl bg-green-50">
                <Text className="mb-1 text-base font-semibold text-gray-900">
                  {selectedGoal.name}
                </Text>
                <Text className="text-sm text-gray-600">
                  {formatCurrency(selectedGoal.currentAmount)} of{" "}
                  {formatCurrency(selectedGoal.targetAmount)}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Deposit Amount
              </Text>
              <TextInput
                value={transactionForm.amount}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, amount: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
                className="p-4 text-base border border-gray-200 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                From Account
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      onPress={() =>
                        setTransactionForm({
                          ...transactionForm,
                          accountId: account.id,
                        })
                      }
                      className={`p-4 rounded-xl border-2 min-w-[140px] ${
                        transactionForm.accountId === account.id
                          ? "border-green-500 bg-green-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text className="font-semibold text-gray-900">
                        {account.name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {formatCurrency(account.balance)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Description (Optional)
              </Text>
              <TextInput
                value={transactionForm.description}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, description: text })
                }
                placeholder="Enter description"
                className="p-4 text-base border border-gray-200 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowDepositModal(false)}
                className="flex-1 px-6 py-4 bg-gray-100 rounded-xl"
              >
                <Text className="text-base font-semibold text-center text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDepositToGoal}
                className="flex-1 px-6 py-4 rounded-xl"
                style={{ backgroundColor: "#10B981" }}
              >
                <Text className="text-base font-semibold text-center text-white">
                  Deposit Funds
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <Modal
        visible={showWithdrawModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWithdrawModal(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <View className="p-6 bg-white rounded-t-3xl">
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">
                Withdraw Funds
              </Text>
              <TouchableOpacity
                onPress={() => setShowWithdrawModal(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {selectedGoal && (
              <View className="p-4 mb-4 border border-red-200 rounded-xl bg-red-50">
                <Text className="mb-1 text-base font-semibold text-gray-900">
                  {selectedGoal.name}
                </Text>
                <Text className="text-sm font-bold text-red-600">
                  Available: {formatCurrency(selectedGoal.currentAmount)}
                </Text>
              </View>
            )}

            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Withdraw Amount
              </Text>
              <TextInput
                value={transactionForm.amount}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, amount: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
                className="p-4 text-base border border-gray-200 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              />
            </View>

            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                To Account
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      onPress={() =>
                        setTransactionForm({
                          ...transactionForm,
                          accountId: account.id,
                        })
                      }
                      className={`p-4 rounded-xl border-2 min-w-[140px] ${
                        transactionForm.accountId === account.id
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Text className="font-semibold text-gray-900">
                        {account.name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        {formatCurrency(account.balance)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Description (Optional)
              </Text>
              <TextInput
                value={transactionForm.description}
                onChangeText={(text) =>
                  setTransactionForm({ ...transactionForm, description: text })
                }
                placeholder="Enter description"
                className="p-4 text-base border border-gray-200 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowWithdrawModal(false)}
                className="flex-1 px-6 py-4 bg-gray-100 rounded-xl"
              >
                <Text className="text-base font-semibold text-center text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleWithdrawFromGoal}
                className="flex-1 px-6 py-4 rounded-xl"
                style={{ backgroundColor: "#EF4444" }}
              >
                <Text className="text-base font-semibold text-center text-white">
                  Withdraw Funds
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {}
      <View className="absolute bottom-10 right-6">
        <TouchableOpacity
          onPress={openAddModal}
          className="items-center justify-center rounded-full shadow-lg w-14 h-14"
          style={{
            backgroundColor: "#10B981",
            shadowColor: "#10B981",
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
    </SafeAreaView>
  );
}
