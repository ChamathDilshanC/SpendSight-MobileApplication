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
  const { accounts, categories, getExpenseCategories, getIncomeCategories } =
    useFinance();

  // Form state
  const [type, setType] = useState<"expense" | "income" | "transfer">(
    transaction?.type || "expense"
  );
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
      setSelectedCategory(""); // Clear category for transfers
    }
  }, [type, categories]);

  // Reset form fields when transaction type changes
  useEffect(() => {
    if (!isEditing) {
      setSelectedCategory("");
      setFromAccount("");
      setToAccount("");
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
      if (type !== "transfer" && selectedCategory) {
        transactionData.categoryId = selectedCategory;
      }

      if ((type === "expense" || type === "transfer") && fromAccount) {
        transactionData.fromAccountId = fromAccount;
      }

      if ((type === "income" || type === "transfer") && toAccount) {
        transactionData.toAccountId = toAccount;
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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-gray-50"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
        {/* Transaction Type Selector */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-800 mb-2">
            Transaction Type
          </Text>
          <View className="bg-white rounded-xl p-1 shadow-sm">
            <View className="flex-row justify-between">
              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-lg ${
                  type === "expense" ? "bg-blue-600" : ""
                }`}
                onPress={() => setType("expense")}
              >
                <Ionicons
                  name="trending-down"
                  size={20}
                  color={type === "expense" ? "#fff" : "#ef4444"}
                />
                <Text
                  className={`ml-1.5 text-sm font-medium ${
                    type === "expense" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Expense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-lg ${
                  type === "income" ? "bg-blue-600" : ""
                }`}
                onPress={() => setType("income")}
              >
                <Ionicons
                  name="trending-up"
                  size={20}
                  color={type === "income" ? "#fff" : "#10b981"}
                />
                <Text
                  className={`ml-1.5 text-sm font-medium ${
                    type === "income" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Income
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 flex-row items-center justify-center py-3 px-2 rounded-lg ${
                  type === "transfer" ? "bg-blue-600" : ""
                }`}
                onPress={() => setType("transfer")}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={20}
                  color={type === "transfer" ? "#fff" : "#3b82f6"}
                />
                <Text
                  className={`ml-1.5 text-sm font-medium ${
                    type === "transfer" ? "text-white" : "text-gray-500"
                  }`}
                >
                  Transfer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Amount Input */}
        <View className="mb-6">
          <Text className="text-base font-semibold text-gray-800 mb-2">
            Amount
          </Text>
          <View className="bg-white rounded-xl px-4 shadow-sm flex-row items-center">
            <Text className="text-2xl font-semibold text-blue-600 mr-2">$</Text>
            <TextInput
              className="flex-1 text-2xl font-semibold text-gray-800 py-4"
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
          <Text className="text-base font-semibold text-gray-800 mb-2">
            Description
          </Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-base text-gray-800 shadow-sm"
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={2}
            textAlignVertical="top"
          />
        </View>

        {/* Category Picker (for income/expense) */}
        {type !== "transfer" && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              Category
            </Text>
            <View className="bg-white rounded-xl shadow-sm max-h-48">
              <Text className="text-base text-gray-800 px-4 py-3 border-b border-gray-200">
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

        {/* Account Selectors */}
        {(type === "expense" || type === "transfer") && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              {type === "transfer" ? "From Account" : "Account"}
            </Text>
            <View className="bg-white rounded-xl shadow-sm max-h-48">
              <Text className="text-base text-gray-800 px-4 py-3 border-b border-gray-200">
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

        {(type === "income" || type === "transfer") && (
          <View className="mb-6">
            <Text className="text-base font-semibold text-gray-800 mb-2">
              {type === "transfer" ? "To Account" : "Account"}
            </Text>
            <View className="bg-white rounded-xl shadow-sm max-h-48">
              <Text className="text-base text-gray-800 px-4 py-3 border-b border-gray-200">
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
          <Text className="text-base font-semibold text-gray-800 mb-2">
            Date
          </Text>
          <TouchableOpacity
            className="bg-white rounded-xl px-4 py-3 shadow-sm flex-row items-center"
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
          <Text className="text-base font-semibold text-gray-800 mb-2">
            Tags (optional)
          </Text>
          <TextInput
            className="bg-white rounded-xl px-4 py-3 text-base text-gray-800 shadow-sm"
            value={tags}
            onChangeText={setTags}
            placeholder="Enter tags separated by commas"
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* Recurring Toggle */}
        <View className="mb-6">
          <TouchableOpacity
            className="bg-white rounded-xl px-4 py-4 shadow-sm"
            onPress={() => setIsRecurring(!isRecurring)}
          >
            <View className="flex-row justify-between items-center">
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
            className="flex-1 mr-2 py-4 rounded-xl bg-gray-100 items-center"
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
