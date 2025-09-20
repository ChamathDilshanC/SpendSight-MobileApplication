import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useFinance } from "../context/FinanceContext";
import { Account, Category, Transaction } from "../types/finance";

interface TransactionFormProps {
  transaction?: Transaction;
  onSave: (transactionData: any) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  transaction,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  const {
    accounts,
    categories,
    goals,
    getExpenseCategories,
    getIncomeCategories,
  } = useFinance();

  // Form state
  const [type, setType] = useState<
    "expense" | "income" | "transfer" | "goal_payment"
  >(transaction?.type || "expense");
  const [amount, setAmount] = useState(transaction?.amount?.toString() || "");
  const [description, setDescription] = useState(
    transaction?.description || ""
  );
  const [selectedCategory, setSelectedCategory] = useState(
    transaction?.categoryId || ""
  );
  const [fromAccount, setFromAccount] = useState(
    transaction?.fromAccountId || ""
  );
  const [toAccount, setToAccount] = useState(transaction?.toAccountId || "");
  const [selectedGoal, setSelectedGoal] = useState(transaction?.goalId || "");
  const [date, setDate] = useState(transaction?.date || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tags, setTags] = useState(transaction?.tags?.join(", ") || "");
  const [isRecurring, setIsRecurring] = useState(
    transaction?.isRecurring || false
  );
  const [isLoading, setIsLoading] = useState(false);

  // Filtered categories based on transaction type
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );

  useEffect(() => {
    if (type === "expense") {
      setAvailableCategories(getExpenseCategories());
    } else if (type === "income") {
      setAvailableCategories(getIncomeCategories());
    } else {
      setAvailableCategories([]);
      setSelectedCategory(""); // Clear category for transfers and goal payments
    }
  }, [type, categories]);

  // Reset form fields when transaction type changes
  useEffect(() => {
    if (!isEditing) {
      setSelectedCategory("");
      setFromAccount("");
      setToAccount("");
      setSelectedGoal("");
    }
  }, [type]);

  const validateForm = (): boolean => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return false;
    }

    if (!description.trim()) {
      Alert.alert("Error", "Please enter a description");
      return false;
    }

    if (type === "expense") {
      if (!selectedCategory) {
        Alert.alert("Error", "Please select a category");
        return false;
      }
      if (!fromAccount) {
        Alert.alert("Error", "Please select an account");
        return false;
      }
    } else if (type === "income") {
      if (!selectedCategory) {
        Alert.alert("Error", "Please select a category");
        return false;
      }
      if (!toAccount) {
        Alert.alert("Error", "Please select an account");
        return false;
      }
    } else if (type === "transfer") {
      if (!fromAccount || !toAccount) {
        Alert.alert("Error", "Please select both accounts");
        return false;
      }
      if (fromAccount === toAccount) {
        Alert.alert(
          "Error",
          "Source and destination accounts must be different"
        );
        return false;
      }
    } else if (type === "goal_payment") {
      // Goal payments require either fromAccount (withdrawal) or toAccount (deposit)
      if (!fromAccount && !toAccount) {
        Alert.alert("Error", "Please select an account");
        return false;
      }
      // Goal payments can't have both accounts selected
      if (fromAccount && toAccount) {
        Alert.alert("Error", "Goal payments can only use one account");
        return false;
      }
      // Goal payments require a goal to be selected
      if (!selectedGoal) {
        Alert.alert("Error", "Please select a goal");
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const transactionData: any = {
        type,
        amount: parseFloat(amount),
        currency: "USD", // You might want to make this configurable
        description: description.trim(),
        date,
        tags: tags
          .split(",")
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag),
        isRecurring,
      };

      // Only add fields that have values to avoid undefined values in Firebase
      if (type !== "transfer" && type !== "goal_payment" && selectedCategory) {
        transactionData.categoryId = selectedCategory;
      }

      if (
        (type === "expense" ||
          type === "transfer" ||
          (type === "goal_payment" && fromAccount)) &&
        fromAccount
      ) {
        transactionData.fromAccountId = fromAccount;
      }

      if (
        (type === "income" ||
          type === "transfer" ||
          (type === "goal_payment" && toAccount)) &&
        toAccount
      ) {
        transactionData.toAccountId = toAccount;
      }

      // Add goal ID for goal payments
      if (type === "goal_payment" && selectedGoal) {
        transactionData.goalId = selectedGoal;
      }

      await onSave(transactionData);
    } catch (error) {
      Alert.alert("Error", "Failed to save transaction");
      console.error("Error saving transaction:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: string): string => {
    const numericValue = value.replace(/[^0-9.]/g, "");
    const parts = numericValue.split(".");
    if (parts.length > 2) {
      return parts[0] + "." + parts[1];
    }
    return numericValue;
  };

  const getAccountName = (accountId: string): string => {
    const account = accounts.find((acc: Account) => acc.id === accountId);
    return account ? account.name : "Select Account";
  };

  const getCategoryName = (categoryId: string): string => {
    const category = availableCategories.find((cat) => cat.id === categoryId);
    return category ? category.name : "Select Category";
  };

  const getGoalName = (goalId: string): string => {
    const goal = goals.find((g) => g.id === goalId);
    return goal ? goal.name : "Select Goal";
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        {/* Transaction Type Selector */}
        <View className="mb-6">
          <Text className="mb-2 text-base font-semibold text-gray-800">
            Transaction Type
          </Text>
          <View className="p-1 bg-white shadow-sm rounded-xl">
            <View className="flex-row justify-between">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 px-1 rounded-lg ${
                  type === "expense" ? "bg-blue-600" : ""
                }`}
                onPress={() => setType("expense")}
              >
                <Ionicons
                  name="trending-down"
                  size={18}
                  color={type === "expense" ? "#fff" : "#ef4444"}
                />
                <Text
                  className={`ml-1 text-xs font-medium ${
                    type === "expense" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 px-1 rounded-lg ${
                  type === "income" ? "bg-blue-600" : ""
                }`}
                onPress={() => setType("income")}
              >
                <Ionicons
                  name="trending-up"
                  size={18}
                  color={type === "income" ? "#fff" : "#10b981"}
                />
                <Text
                  className={`ml-1 text-xs font-medium ${
                    type === "income" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Income
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 px-1 rounded-lg ${
                  type === "transfer" ? "bg-blue-600" : ""
                }`}
                onPress={() => setType("transfer")}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={18}
                  color={type === "transfer" ? "#fff" : "#3b82f6"}
                />
                <Text
                  className={`ml-1 text-xs font-medium ${
                    type === "transfer" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Transfer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 px-1 rounded-lg ${
                  type === "goal_payment" ? "bg-blue-600" : ""
                }`}
                onPress={() => setType("goal_payment")}
              >
                <Ionicons
                  name="trophy-outline"
                  size={18}
                  color={type === "goal_payment" ? "#fff" : "#8b5cf6"}
                />
                <Text
                  className={`ml-1 text-xs font-medium ${
                    type === "goal_payment" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Goal
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Amount Input */}
        <View className="mb-6">
          <Text className="mb-2 text-base font-semibold text-gray-800">
            Amount
          </Text>
          <View className="flex-row items-center px-4 bg-white shadow-sm rounded-xl">
            <Text className="mr-2 text-2xl font-semibold text-blue-600">$</Text>
            <TextInput
              className="flex-1 py-4 text-2xl font-semibold text-gray-800"
              value={amount}
              onChangeText={(text) => setAmount(formatCurrency(text))}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor="#9ca3af"
            />
          </View>
        </View>

        {/* Description Input */}
        <View className="mb-6">
          <Text className="mb-2 text-base font-semibold text-gray-800">
            Description
          </Text>
          <TextInput
            className="px-4 py-3 text-base text-gray-800 bg-white shadow-sm rounded-xl"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Category Picker (for income/expense only) */}
        {type !== "transfer" && type !== "goal_payment" && (
          <View className="mb-6">
            <Text className="mb-2 text-base font-semibold text-gray-800">
              Category
            </Text>
            <View className="bg-white shadow-sm rounded-xl max-h-48">
              <Text className="px-4 py-3 text-base text-gray-800 border-b border-gray-200">
                {selectedCategory
                  ? getCategoryName(selectedCategory)
                  : "Select Category"}
              </Text>
              <ScrollView
                className="max-h-36"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    className={`px-4 py-3 border-b border-gray-100 ${
                      selectedCategory === category.id ? "bg-blue-50" : ""
                    }`}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    <Text
                      className={`text-base ${
                        selectedCategory === category.id
                          ? "text-blue-600 font-medium"
                          : "text-gray-800"
                      }`}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Goal Picker (for goal_payment only) */}
        {type === "goal_payment" && (
          <View className="mb-6">
            <Text className="mb-2 text-base font-semibold text-gray-800">
              Select Goal
            </Text>
            <View className="bg-white shadow-sm rounded-xl max-h-48">
              <TouchableOpacity className="px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base text-gray-800">
                    {selectedGoal ? getGoalName(selectedGoal) : "Select Goal"}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#9ca3af" />
                </View>
              </TouchableOpacity>
              <ScrollView
                className="max-h-36"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {goals
                  .filter((goal) => !goal.isCompleted)
                  .map((goal) => (
                    <TouchableOpacity
                      key={goal.id}
                      className={`px-4 py-3 border-b border-gray-100 ${
                        selectedGoal === goal.id ? "bg-purple-50" : ""
                      }`}
                      onPress={() => setSelectedGoal(goal.id)}
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1">
                          <Text
                            className={`text-base font-medium ${
                              selectedGoal === goal.id
                                ? "text-purple-600"
                                : "text-gray-800"
                            }`}
                          >
                            {goal.name}
                          </Text>
                          <Text className="mt-1 text-sm text-gray-500">
                            ${goal.currentAmount.toFixed(2)} / $
                            {goal.targetAmount.toFixed(2)}
                          </Text>
                          <View className="h-2 mt-2 bg-gray-200 rounded-full">
                            <View
                              className="h-2 bg-purple-600 rounded-full"
                              style={{
                                width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                              }}
                            />
                          </View>
                        </View>
                        <View className="items-center ml-3">
                          <View
                            className="items-center justify-center w-8 h-8 rounded-full"
                            style={{ backgroundColor: goal.color + "20" }}
                          >
                            <Ionicons
                              name={goal.icon as any}
                              size={16}
                              color={goal.color}
                            />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                {goals.filter((goal) => !goal.isCompleted).length === 0 && (
                  <View className="items-center px-4 py-8">
                    <Ionicons name="flag-outline" size={48} color="#d1d5db" />
                    <Text className="mt-2 text-center text-gray-500">
                      No active goals found
                    </Text>
                    <Text className="mt-1 text-sm text-center text-gray-400">
                      Create a goal to track your progress
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Account Selectors */}
        {(type === "expense" ||
          type === "transfer" ||
          (type === "goal_payment" && !toAccount)) && (
          <View className="mb-6">
            <Text className="mb-2 text-base font-semibold text-gray-800">
              {type === "transfer"
                ? "From Account"
                : type === "goal_payment"
                  ? selectedGoal
                    ? `Withdraw from ${getGoalName(selectedGoal)}`
                    : "Account (Withdrawal)"
                  : "Account"}
            </Text>
            <View className="bg-white shadow-sm rounded-xl max-h-48">
              <Text className="px-4 py-3 text-base text-gray-800 border-b border-gray-200">
                {fromAccount ? getAccountName(fromAccount) : "Select Account"}
              </Text>
              <ScrollView
                className="max-h-36"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {accounts.map((account: Account) => (
                  <TouchableOpacity
                    key={account.id}
                    className={`px-4 py-3 border-b border-gray-100 ${
                      fromAccount === account.id ? "bg-blue-50" : ""
                    }`}
                    onPress={() => setFromAccount(account.id)}
                  >
                    <Text
                      className={`text-base ${
                        fromAccount === account.id
                          ? "text-blue-600 font-medium"
                          : "text-gray-800"
                      }`}
                    >
                      {account.name} (${account.balance.toFixed(2)})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {(type === "income" ||
          type === "transfer" ||
          (type === "goal_payment" && !fromAccount)) && (
          <View className="mb-6">
            <Text className="mb-2 text-base font-semibold text-gray-800">
              {type === "transfer"
                ? "To Account"
                : type === "goal_payment"
                  ? selectedGoal
                    ? `Deposit to ${getGoalName(selectedGoal)}`
                    : "Account (Deposit)"
                  : "Account"}
            </Text>
            <View className="bg-white shadow-sm rounded-xl max-h-48">
              <Text className="px-4 py-3 text-base text-gray-800 border-b border-gray-200">
                {toAccount ? getAccountName(toAccount) : "Select Account"}
              </Text>
              <ScrollView
                className="max-h-36"
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                {accounts.map((account: Account) => (
                  <TouchableOpacity
                    key={account.id}
                    className={`px-4 py-3 border-b border-gray-100 ${
                      toAccount === account.id ? "bg-blue-50" : ""
                    }`}
                    onPress={() => setToAccount(account.id)}
                  >
                    <Text
                      className={`text-base ${
                        toAccount === account.id
                          ? "text-blue-600 font-medium"
                          : "text-gray-800"
                      }`}
                    >
                      {account.name} (${account.balance.toFixed(2)})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}

        {/* Date Picker */}
        <View className="mb-6">
          <Text className="mb-2 text-base font-semibold text-gray-800">
            Date
          </Text>
          <TouchableOpacity
            className="flex-row items-center px-4 py-3 bg-white shadow-sm rounded-xl"
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar" size={20} color="#3b82f6" />
            <Text className="ml-2.5 text-base text-gray-800">
              {date.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tags Input */}
        <View className="mb-6">
          <Text className="mb-2 text-base font-semibold text-gray-800">
            Tags (optional)
          </Text>
          <TextInput
            className="px-4 py-3 text-base text-gray-800 bg-white shadow-sm rounded-xl"
            value={tags}
            onChangeText={setTags}
            placeholder="Enter tags separated by commas"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Recurring Toggle */}
        <View className="mb-6">
          <TouchableOpacity
            className="px-4 py-4 bg-white shadow-sm rounded-xl"
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-base font-semibold text-gray-800">
                Recurring Transaction
              </Text>
              <View
                className={`w-12 h-7 rounded-full p-0.5 justify-center ${
                  isRecurring ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <View
                  className={`w-6 h-6 bg-white rounded-full shadow-sm ${
                    isRecurring ? "translate-x-5" : ""
                  }`}
                />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row justify-between mt-8 mb-4">
          <TouchableOpacity
            className="items-center flex-1 py-4 mr-2 bg-gray-100 rounded-xl"
            onPress={onCancel}
            disabled={isLoading}
          >
            <Text className="text-base font-semibold text-gray-500">
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 ml-2 py-4 rounded-xl items-center ${
              isLoading ? "bg-gray-400" : "bg-blue-600"
            }`}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text className="text-base font-semibold text-white">
              {isLoading ? "Saving..." : isEditing ? "Update" : "Save"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Date Picker Modal removed - using simple date display for now */}
    </KeyboardAvoidingView>
  );
};
