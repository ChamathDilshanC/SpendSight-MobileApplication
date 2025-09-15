import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "../../context/FirebaseAuthContext";
import { AccountService } from "../../services/AccountService";
import { Account } from "../../types/finance";

interface NewAccountForm {
  name: string;
  type: "main" | "savings" | "expenses" | "custom";
  balance: string;
  description: string;
  color: string;
  icon: string;
}

const AccountScreen = () => {
  const { authState } = useAuth();
  console.log("🔐 AccountScreen - authState:", {
    hasAuthState: !!authState,
    hasUser: !!authState?.user,
    userId: authState?.user?.id,
    userEmail: authState?.user?.email,
  });

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [transferForm, setTransferForm] = useState({
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    description: "",
  });
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [newAccount, setNewAccount] = useState<NewAccountForm>({
    name: "",
    type: "main",
    balance: "0",
    description: "",
    color: "#4F46E5",
    icon: "wallet-outline",
  });

  // Account type options with icons and colors
  const accountTypes = [
    {
      value: "main" as const,
      label: "Main",
      icon: "wallet-outline",
      color: "#3B82F6",
    },
    {
      value: "savings" as const,
      label: "Savings",
      icon: "save-outline",
      color: "#10B981",
    },
    {
      value: "expenses" as const,
      label: "Expenses",
      icon: "card-outline",
      color: "#EF4444",
    },
    {
      value: "custom" as const,
      label: "Custom",
      icon: "briefcase-outline",
      color: "#8B5CF6",
    },
  ];

  // Load accounts on component mount
  useEffect(() => {
    console.log("🔍 AccountScreen useEffect - authState:", authState?.user?.id);

    if (authState?.user?.id) {
      console.log("📱 Loading accounts for user:", authState.user.id);
      loadAccounts();

      // Set up real-time listener
      try {
        const unsubscribe = AccountService.subscribeToAccounts(
          authState.user.id,
          (updatedAccounts) => {
            console.log(
              "📊 Received updated accounts:",
              updatedAccounts.length
            );
            setAccounts(updatedAccounts);
            setLoading(false);
          }
        );

        // Set a timeout to ensure loading doesn't get stuck
        const timeout = setTimeout(() => {
          console.log("⏰ Loading timeout reached, setting loading to false");
          setLoading(false);
        }, 5000); // 5 second timeout

        return () => {
          clearTimeout(timeout);
          unsubscribe();
        };
      } catch (error) {
        console.error("❌ Error setting up account subscription:", error);
        setLoading(false);
      }
    } else {
      console.log("⚠️ No user ID available, setting loading to false");
      setLoading(false);
    }
  }, [authState?.user?.id]);

  const loadAccounts = async () => {
    try {
      if (!authState?.user?.id) {
        console.log("⚠️ No user ID in loadAccounts");
        return;
      }

      console.log("📊 Loading accounts for user:", authState.user.id);
      const userAccounts = await AccountService.getUserAccounts(
        authState.user.id
      );
      console.log("✅ Loaded accounts:", userAccounts.length);
      setAccounts(userAccounts);

      // If no accounts found, initialize default accounts
      if (userAccounts.length === 0) {
        console.log(
          "📝 No accounts found, checking if this is first-time user..."
        );
        // Show budget setup modal for first-time users
        setShowBudgetModal(true);
      }
    } catch (error) {
      console.error("❌ Error loading accounts:", error);
      Alert.alert("Error", "Failed to load accounts. Please try again.");
    } finally {
      console.log("🔄 Setting loading to false");
      setLoading(false);
    }
  };

  const handleBudgetSetup = async () => {
    if (!authState?.user?.id || !monthlyBudget.trim()) {
      Alert.alert("Error", "Please enter your monthly budget/salary");
      return;
    }

    const budget = parseFloat(monthlyBudget);
    if (budget <= 0) {
      Alert.alert("Error", "Please enter a valid budget amount");
      return;
    }

    try {
      setLoading(true);
      await AccountService.initializeAccountsWithBudget(
        authState.user.id,
        budget
      );

      setShowBudgetModal(false);
      setMonthlyBudget("");

      Alert.alert(
        "Success!",
        `Your accounts have been set up with budget allocation:\n\n• Main Account (50%): $${(budget * 0.5).toFixed(2)}\n• Savings Account (30%): $${(budget * 0.3).toFixed(2)}\n• Expenses Account (20%): $${(budget * 0.2).toFixed(2)}`,
        [{ text: "OK" }]
      );
    } catch (error) {
      console.error("❌ Error setting up budget:", error);
      Alert.alert("Error", "Failed to set up your accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (
      !transferForm.fromAccountId ||
      !transferForm.toAccountId ||
      !transferForm.amount.trim()
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const amount = parseFloat(transferForm.amount);
    if (amount <= 0) {
      Alert.alert("Error", "Please enter a valid transfer amount");
      return;
    }

    // Check if sender has sufficient balance
    const fromAccount = accounts.find(
      (acc) => acc.id === transferForm.fromAccountId
    );
    if (!fromAccount || fromAccount.balance < amount) {
      Alert.alert("Error", "Insufficient balance in the sender account");
      return;
    }

    try {
      setLoading(true);

      await AccountService.transferBetweenAccounts(
        transferForm.fromAccountId,
        transferForm.toAccountId,
        amount,
        transferForm.description || "Account transfer"
      );

      const fromAccountName = accounts.find(
        (acc) => acc.id === transferForm.fromAccountId
      )?.name;
      const toAccountName = accounts.find(
        (acc) => acc.id === transferForm.toAccountId
      )?.name;

      setShowTransferModal(false);
      setTransferForm({
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        description: "",
      });

      Alert.alert(
        "Transfer Successful",
        `$${amount.toFixed(2)} has been transferred from ${fromAccountName} to ${toAccountName}`
      );
    } catch (error) {
      console.error("❌ Error transferring funds:", error);
      Alert.alert("Error", "Failed to transfer funds. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  }, []);

  const handleCreateAccount = async () => {
    if (!authState?.user?.id) return;

    if (!newAccount.name.trim()) {
      Alert.alert("Error", "Please enter an account name");
      return;
    }

    const balance = parseFloat(newAccount.balance) || 0;

    try {
      setLoading(true);

      const accountData = {
        name: newAccount.name.trim(),
        type: newAccount.type,
        balance,
        description: newAccount.description.trim(),
        isActive: true,
        currency: "USD", // Default currency
        color: newAccount.color,
        icon: newAccount.icon,
      };

      await AccountService.createAccount(authState.user.id, accountData);

      // Reset form
      setNewAccount({
        name: "",
        type: "main",
        balance: "0",
        description: "",
        color: "#4F46E5",
        icon: "wallet-outline",
      });

      setShowAddModal(false);
      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      console.error("Error creating account:", error);
      Alert.alert("Error", "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAccount = async () => {
    if (!editingAccount) return;

    if (!newAccount.name.trim()) {
      Alert.alert("Error", "Please enter an account name");
      return;
    }

    try {
      setLoading(true);

      const updateData = {
        name: newAccount.name.trim(),
        type: newAccount.type,
        description: newAccount.description.trim(),
        color: newAccount.color,
        icon: newAccount.icon,
      };

      await AccountService.updateAccount(editingAccount.id, updateData);

      setEditingAccount(null);
      setShowAddModal(false);
      Alert.alert("Success", "Account updated successfully!");
    } catch (error) {
      console.error("Error updating account:", error);
      Alert.alert("Error", "Failed to update account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = (account: Account) => {
    Alert.alert(
      "Delete Account",
      `Are you sure you want to delete "${account.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await AccountService.deleteAccount(account.id);
              Alert.alert("Success", "Account deleted successfully!");
            } catch (error) {
              console.error("Error deleting account:", error);
              Alert.alert(
                "Error",
                "Failed to delete account. Please try again."
              );
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openEditModal = (account: Account) => {
    setEditingAccount(account);
    setNewAccount({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      description: account.description || "",
      color: account.color,
      icon: account.icon,
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    setEditingAccount(null);
    setNewAccount({
      name: "",
      type: "main",
      balance: "0",
      description: "",
      color: "#4F46E5",
      icon: "wallet-outline",
    });
    setShowAddModal(true);
  };

  const getAccountTypeInfo = (type: string) => {
    return accountTypes.find((t) => t.value === type) || accountTypes[0];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const calculateTotalBalance = () => {
    return accounts.reduce((total, account) => {
      // Include all account types in total balance
      if (!account.isActive) return total;
      return total + account.balance;
    }, 0);
  };

  if (!authState?.user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <AppHeader title="My Accounts" />
        <View className="items-center justify-center flex-1">
          <Text className="text-gray-600">Please log in to view accounts</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader title="My Accounts" />

      {/* Background Blur Effect - Subtle */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: -1,
        }}
      >
        {/* Subtle blur layers with reduced opacity */}
        <View
          style={{
            flex: 1,
            backgroundColor: "#F3F4F6",
            opacity: 0.15,
          }}
        />
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#F9FAFB",
            opacity: 0.1,
          }}
        />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        className="flex-1"
        style={{ backgroundColor: "transparent" }}
      >
        {/* Summary Card */}
        <View className="mx-4 mt-4 mb-6">
          <View
            className="p-6 rounded-2xl"
            style={{
              backgroundColor: "#3B82F6",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="mb-2 text-lg font-medium text-white">
              Total Balance
            </Text>
            <Text className="mb-4 text-3xl font-bold text-white">
              {formatCurrency(calculateTotalBalance())}
            </Text>
            <View className="flex-row justify-between">
              <View>
                <Text className="text-sm text-white" style={{ opacity: 0.8 }}>
                  Active Accounts
                </Text>
                <Text className="text-lg font-semibold text-white">
                  {accounts.length}
                </Text>
              </View>
              <TouchableOpacity
                onPress={openAddModal}
                className="flex-row items-center px-4 py-2 rounded-full"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.2)" }}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="ml-1 font-medium text-white">Add Account</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Transfer Button */}
          {accounts.length >= 2 && (
            <View className="mx-4 mt-3">
              <TouchableOpacity
                onPress={() => setShowTransferModal(true)}
                className="flex-row items-center justify-center py-4 rounded-xl"
                style={{
                  backgroundColor: "#FFFFFF",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <Ionicons name="swap-horizontal" size={20} color="#3B82F6" />
                <Text
                  className="ml-2 font-semibold"
                  style={{ color: "#3B82F6" }}
                >
                  Transfer Between Accounts
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Accounts List */}
        <View className="px-4">
          <Text className="mb-4 text-xl font-bold text-gray-900">
            Your Accounts
          </Text>

          {loading && accounts.length === 0 ? (
            <View className="items-center justify-center flex-1 py-12">
              <ActivityIndicator size="large" color="#3B82F6" />
              <Text className="mt-2 text-gray-500">Loading accounts...</Text>
            </View>
          ) : accounts.length === 0 ? (
            <View className="items-center p-8 bg-white rounded-2xl">
              <Ionicons name="wallet-outline" size={64} color="#9CA3AF" />
              <Text className="mt-4 mb-2 text-lg font-semibold text-gray-900">
                No Accounts Yet
              </Text>
              <Text className="mb-6 text-center text-gray-500">
                Create your first account to start managing your finances
              </Text>
              <TouchableOpacity
                onPress={openAddModal}
                className="flex-row items-center px-6 py-3 rounded-xl"
                style={{ backgroundColor: "#3B82F6" }}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="ml-2 font-semibold text-white">
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            accounts.map((account) => {
              const typeInfo = getAccountTypeInfo(account.type);
              return (
                <View
                  key={account.id}
                  className="p-4 mb-3 bg-white shadow-sm rounded-2xl"
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center flex-1">
                      <View
                        className="items-center justify-center w-12 h-12 mr-4 rounded-full"
                        style={{ backgroundColor: `${typeInfo.color}20` }}
                      >
                        <Ionicons
                          name={typeInfo.icon as any}
                          size={24}
                          color={typeInfo.color}
                        />
                      </View>

                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-gray-900">
                          {account.name}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          {typeInfo.label}
                        </Text>
                        {account.description && (
                          <Text className="mt-1 text-xs text-gray-400">
                            {account.description}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View className="items-end">
                      <Text
                        className={`text-lg font-bold ${
                          account.balance >= 0
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      >
                        {formatCurrency(Math.abs(account.balance))}
                      </Text>
                      <Text className="text-xs text-gray-400">
                        {account.currency || "USD"}
                      </Text>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View className="flex-row justify-end mt-4">
                    <TouchableOpacity
                      onPress={() => openEditModal(account)}
                      className="flex-row items-center px-3 py-2 mr-2 rounded-lg"
                      style={{ backgroundColor: "#EFF6FF" }}
                    >
                      <Ionicons
                        name="create-outline"
                        size={16}
                        color="#3B82F6"
                      />
                      <Text className="ml-1 text-sm font-medium text-blue-600">
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDeleteAccount(account)}
                      className="flex-row items-center px-3 py-2 rounded-lg"
                      style={{ backgroundColor: "#FEF2F2" }}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={16}
                        color="#EF4444"
                      />
                      <Text className="ml-1 text-sm font-medium text-red-600">
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add/Edit Account Modal */}
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

            <Text className="text-lg font-bold text-gray-900">
              {editingAccount ? "Edit Account" : "New Account"}
            </Text>

            <TouchableOpacity
              onPress={
                editingAccount ? handleUpdateAccount : handleCreateAccount
              }
              disabled={!newAccount.name.trim()}
              style={{
                opacity: newAccount.name.trim() ? 1 : 0.5,
              }}
            >
              <Text className="text-lg font-medium text-blue-500">
                {editingAccount ? "Save" : "Create"}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {/* Account Name */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Account Name *
              </Text>
              <TextInput
                value={newAccount.name}
                onChangeText={(text) =>
                  setNewAccount({ ...newAccount, name: text })
                }
                placeholder="e.g., Main Checking, Emergency Fund"
                className="px-4 py-4 text-lg text-gray-900 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
                autoFocus
              />
            </View>

            {/* Account Type */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Account Type
              </Text>
              <View>
                {accountTypes.map((type, index) => (
                  <Pressable
                    key={type.value}
                    onPress={() =>
                      setNewAccount({
                        ...newAccount,
                        type: type.value,
                        color: type.color,
                        icon: type.icon,
                      })
                    }
                    className="flex-row items-center p-4 rounded-xl"
                    style={{
                      backgroundColor:
                        newAccount.type === type.value ? "#EFF6FF" : "#F9FAFB",
                      borderWidth: newAccount.type === type.value ? 2 : 1,
                      borderColor:
                        newAccount.type === type.value ? "#3B82F6" : "#E5E7EB",
                      marginBottom: index < accountTypes.length - 1 ? 8 : 0,
                    }}
                  >
                    <View
                      className="items-center justify-center w-10 h-10 mr-3 rounded-full"
                      style={{ backgroundColor: `${type.color}20` }}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={type.color}
                      />
                    </View>
                    <Text
                      className="text-lg font-medium"
                      style={{
                        color:
                          newAccount.type === type.value
                            ? "#2563EB"
                            : "#1F2937",
                      }}
                    >
                      {type.label}
                    </Text>
                    {newAccount.type === type.value && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#3B82F6"
                        style={{ marginLeft: "auto" }}
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Initial Balance - Only show for new accounts */}
            {!editingAccount && (
              <View className="mb-6">
                <Text className="mb-3 font-medium text-gray-700">
                  Initial Balance
                </Text>
                <TextInput
                  value={newAccount.balance}
                  onChangeText={(text) => {
                    // Allow only numbers and decimal point
                    const cleanText = text.replace(/[^0-9.-]/g, "");
                    setNewAccount({ ...newAccount, balance: cleanText });
                  }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  className="px-4 py-4 text-lg text-gray-900 rounded-xl"
                  style={{ backgroundColor: "#F9FAFB" }}
                />
              </View>
            )}

            {/* Description */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Description (Optional)
              </Text>
              <TextInput
                value={newAccount.description}
                onChangeText={(text) =>
                  setNewAccount({ ...newAccount, description: text })
                }
                placeholder="Add notes about this account..."
                multiline
                numberOfLines={3}
                className="px-4 py-4 text-lg text-gray-900 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>

          {loading && (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            >
              <View className="items-center p-6 bg-white rounded-2xl">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-3 text-gray-700">
                  {editingAccount
                    ? "Updating account..."
                    : "Creating account..."}
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView className="flex-1 bg-white">
          {/* Modal Header */}
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-gray-200">
            <TouchableOpacity onPress={() => setShowTransferModal(false)}>
              <Text className="text-lg font-medium text-red-500">Cancel</Text>
            </TouchableOpacity>

            <Text className="text-lg font-bold text-gray-900">
              Transfer Funds
            </Text>

            <TouchableOpacity
              onPress={handleTransfer}
              disabled={
                !transferForm.fromAccountId ||
                !transferForm.toAccountId ||
                !transferForm.amount.trim()
              }
              style={{
                opacity:
                  transferForm.fromAccountId &&
                  transferForm.toAccountId &&
                  transferForm.amount.trim()
                    ? 1
                    : 0.5,
              }}
            >
              <Text className="text-lg font-medium text-blue-500">
                Transfer
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-6 py-6">
            {/* From Account */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                From Account *
              </Text>
              <View>
                {accounts.map((account, index) => (
                  <Pressable
                    key={`from-${account.id}`}
                    onPress={() =>
                      setTransferForm({
                        ...transferForm,
                        fromAccountId: account.id,
                      })
                    }
                    className="flex-row items-center p-4 rounded-xl"
                    style={{
                      backgroundColor:
                        transferForm.fromAccountId === account.id
                          ? "#EFF6FF"
                          : "#F9FAFB",
                      borderWidth:
                        transferForm.fromAccountId === account.id ? 2 : 1,
                      borderColor:
                        transferForm.fromAccountId === account.id
                          ? "#3B82F6"
                          : "#E5E7EB",
                      marginBottom: index < accounts.length - 1 ? 8 : 0,
                    }}
                  >
                    <View
                      className="items-center justify-center w-10 h-10 mr-3 rounded-full"
                      style={{ backgroundColor: `${account.color}20` }}
                    >
                      <Ionicons
                        name={account.icon as any}
                        size={20}
                        color={account.color}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium text-gray-900">
                        {account.name}
                      </Text>
                      <Text className="text-sm text-gray-500">
                        Balance: {formatCurrency(account.balance)}
                      </Text>
                    </View>
                    {transferForm.fromAccountId === account.id && (
                      <Ionicons
                        name="checkmark-circle"
                        size={24}
                        color="#3B82F6"
                      />
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* To Account */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                To Account *
              </Text>
              <View>
                {accounts
                  .filter(
                    (account) => account.id !== transferForm.fromAccountId
                  )
                  .map((account, index) => (
                    <Pressable
                      key={`to-${account.id}`}
                      onPress={() =>
                        setTransferForm({
                          ...transferForm,
                          toAccountId: account.id,
                        })
                      }
                      className="flex-row items-center p-4 rounded-xl"
                      style={{
                        backgroundColor:
                          transferForm.toAccountId === account.id
                            ? "#EFF6FF"
                            : "#F9FAFB",
                        borderWidth:
                          transferForm.toAccountId === account.id ? 2 : 1,
                        borderColor:
                          transferForm.toAccountId === account.id
                            ? "#3B82F6"
                            : "#E5E7EB",
                        marginBottom:
                          index <
                          accounts.filter(
                            (acc) => acc.id !== transferForm.fromAccountId
                          ).length -
                            1
                            ? 8
                            : 0,
                      }}
                    >
                      <View
                        className="items-center justify-center w-10 h-10 mr-3 rounded-full"
                        style={{ backgroundColor: `${account.color}20` }}
                      >
                        <Ionicons
                          name={account.icon as any}
                          size={20}
                          color={account.color}
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="font-medium text-gray-900">
                          {account.name}
                        </Text>
                        <Text className="text-sm text-gray-500">
                          Balance: {formatCurrency(account.balance)}
                        </Text>
                      </View>
                      {transferForm.toAccountId === account.id && (
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#3B82F6"
                        />
                      )}
                    </Pressable>
                  ))}
              </View>
            </View>

            {/* Transfer Amount */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">Amount *</Text>
              <TextInput
                value={transferForm.amount}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.-]/g, "");
                  setTransferForm({ ...transferForm, amount: cleanText });
                }}
                placeholder="0.00"
                keyboardType="numeric"
                className="px-4 py-4 text-lg text-gray-900 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
              />
              {transferForm.fromAccountId && (
                <Text className="mt-2 text-sm text-gray-500">
                  Available balance:{" "}
                  {formatCurrency(
                    accounts.find(
                      (acc) => acc.id === transferForm.fromAccountId
                    )?.balance || 0
                  )}
                </Text>
              )}
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="mb-3 font-medium text-gray-700">
                Description (Optional)
              </Text>
              <TextInput
                value={transferForm.description}
                onChangeText={(text) =>
                  setTransferForm({ ...transferForm, description: text })
                }
                placeholder="Transfer description..."
                className="px-4 py-4 text-lg text-gray-900 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
              />
            </View>

            {/* button for transfer */}
            <Pressable
              onPress={handleTransfer}
              className="items-center justify-center flex-1 px-4 py-4 mt-6 rounded-xl"
              style={{ backgroundColor: "#3B82F6" }}
            >
              <Text className="font-medium text-center text-white">
                Transfer
              </Text>
            </Pressable>
          </ScrollView>

          {loading && (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.2)" }}
            >
              <View className="items-center p-6 bg-white rounded-2xl">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-3 text-gray-700">
                  Processing transfer...
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>

      {/* Budget Setup Modal for First-Time Users */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <SafeAreaView className="flex-1 bg-white">
          <View className="flex-1 px-6 py-6">
            <View className="items-center mb-8">
              <View
                className="items-center justify-center w-24 h-24 mb-4 rounded-full"
                style={{ backgroundColor: "#EFF6FF" }}
              >
                <Ionicons name="wallet" size={48} color="#3B82F6" />
              </View>
              <Text className="mb-2 text-2xl font-bold text-center text-gray-900">
                Welcome to SpendSight!
              </Text>
              <Text className="text-center text-gray-600">
                Let's set up your accounts with smart budget allocation
              </Text>
            </View>

            <View className="mb-8">
              <Text className="mb-4 text-lg font-medium text-gray-700">
                Enter your monthly salary/budget:
              </Text>
              <TextInput
                value={monthlyBudget}
                onChangeText={setMonthlyBudget}
                placeholder="Enter amount (e.g., 3000)"
                keyboardType="numeric"
                className="px-6 py-4 text-xl text-gray-900 rounded-xl"
                style={{ backgroundColor: "#F9FAFB" }}
                autoFocus
              />
            </View>

            {monthlyBudget && parseFloat(monthlyBudget) > 0 && (
              <View
                className="p-6 mb-8 rounded-2xl"
                style={{ backgroundColor: "#F0FDF4" }}
              >
                <Text className="mb-4 text-lg font-semibold text-gray-900">
                  Your money will be allocated as:
                </Text>

                <View>
                  <View
                    className="flex-row items-center justify-between"
                    style={{ marginBottom: 12 }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="items-center justify-center w-8 h-8 mr-3 rounded-full"
                        style={{ backgroundColor: "#4ECDC420" }}
                      >
                        <Ionicons name="wallet" size={16} color="#4ECDC4" />
                      </View>
                      <Text className="font-medium text-gray-700">
                        Main Account (50%)
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-green-600">
                      ${(parseFloat(monthlyBudget) * 0.5).toFixed(2)}
                    </Text>
                  </View>

                  <View
                    className="flex-row items-center justify-between"
                    style={{ marginBottom: 12 }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="items-center justify-center w-8 h-8 mr-3 rounded-full"
                        style={{ backgroundColor: "#45B7D120" }}
                      >
                        <Ionicons name="save" size={16} color="#45B7D1" />
                      </View>
                      <Text className="font-medium text-gray-700">
                        Savings Account (30%)
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-green-600">
                      ${(parseFloat(monthlyBudget) * 0.3).toFixed(2)}
                    </Text>
                  </View>

                  <View
                    className="flex-row items-center justify-between"
                    style={{ marginBottom: 0 }}
                  >
                    <View className="flex-row items-center">
                      <View
                        className="items-center justify-center w-8 h-8 mr-3 rounded-full"
                        style={{ backgroundColor: "#96CEB420" }}
                      >
                        <Ionicons name="card" size={16} color="#96CEB4" />
                      </View>
                      <Text className="font-medium text-gray-700">
                        Expenses Account (20%)
                      </Text>
                    </View>
                    <Text className="text-lg font-bold text-green-600">
                      ${(parseFloat(monthlyBudget) * 0.2).toFixed(2)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <View className="mt-auto">
              <TouchableOpacity
                onPress={handleBudgetSetup}
                disabled={
                  !monthlyBudget.trim() || parseFloat(monthlyBudget) <= 0
                }
                className="py-4 rounded-xl"
                style={{
                  backgroundColor:
                    monthlyBudget.trim() && parseFloat(monthlyBudget) > 0
                      ? "#3B82F6"
                      : "#E5E7EB",
                }}
              >
                <Text className="text-lg font-semibold text-center text-white">
                  Set Up My Accounts
                </Text>
              </TouchableOpacity>

              <Text className="mt-4 text-sm text-center text-gray-500">
                You can always modify these allocations later in settings
              </Text>
            </View>
          </View>

          {loading && (
            <View
              className="absolute inset-0 items-center justify-center"
              style={{ backgroundColor: "rgba(0, 0, 0, 0.8)" }}
            >
              <View className="items-center p-6 bg-white rounded-2xl">
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text className="mt-3 text-gray-700">
                  Setting up your accounts...
                </Text>
              </View>
            </View>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

export default AccountScreen;
