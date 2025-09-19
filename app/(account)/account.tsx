import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiText, MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
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
    color: "#6366F1",
    icon: "wallet-outline",
  });

  const accountTypes = [
    {
      value: "main" as const,
      label: "Main",
      icon: "wallet-outline",
      color: "#6366F1",
      gradient: ["#6366F1", "#8B5CF6"],
    },
    {
      value: "savings" as const,
      label: "Savings",
      icon: "shield-checkmark-outline",
      color: "#059669",
      gradient: ["#059669", "#0D9488"],
    },
    {
      value: "expenses" as const,
      label: "Expenses",
      icon: "card-outline",
      color: "#DC2626",
      gradient: ["#DC2626", "#EA580C"],
    },
    {
      value: "custom" as const,
      label: "Custom",
      icon: "diamond-outline",
      color: "#7C3AED",
      gradient: ["#7C3AED", "#C026D3"],
    },
  ];

  const availableIcons = [
    "wallet-outline",
    "card-outline",
    "shield-checkmark-outline",
    "diamond-outline",
    "heart-outline",
    "star-outline",
    "home-outline",
    "car-outline",
    "airplane-outline",
    "gift-outline",
    "medical-outline",
    "fitness-outline",
    "restaurant-outline",
    "book-outline",
    "game-controller-outline",
    "musical-notes-outline",
    "briefcase-outline",
    "school-outline",
    "flower-outline",
    "trophy-outline",
    "rocket-outline",
    "leaf-outline",
    "build-outline",
    "camera-outline",
  ];

  const availableColors = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#F97316",
    "#EAB308",
    "#22C55E",
    "#10B981",
    "#06B6D4",
    "#3B82F6",
    "#A855F7",
    "#D946EF",
    "#F59E0B",
    "#84CC16",
    "#059669",
    "#0891B2",
    "#1D4ED8",
    "#7C3AED",
    "#DC2626",
    "#16A34A",
  ];

  useEffect(() => {
    if (authState?.user?.id) {
      loadAccounts();

      try {
        const unsubscribe = AccountService.subscribeToAccounts(
          authState.user.id,
          (updatedAccounts) => {
            setAccounts(updatedAccounts);
            setLoading(false);
          }
        );

        const timeout = setTimeout(() => {
          setLoading(false);
        }, 5000);

        return () => {
          clearTimeout(timeout);
          unsubscribe();
        };
      } catch (error) {
        console.error("Error setting up account subscription:", error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [authState?.user?.id]);

  const loadAccounts = async () => {
    try {
      if (!authState?.user?.id) {
        return;
      }

      const userAccounts = await AccountService.getUserAccounts(
        authState.user.id
      );
      setAccounts(userAccounts);

      if (userAccounts.length === 0) {
        setShowBudgetModal(true);
      }
    } catch (error) {
      console.error("Error loading accounts:", error);
      Alert.alert("Error", "Failed to load accounts. Please try again.");
    } finally {
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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
      console.error("Error setting up budget:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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

    const fromAccount = accounts.find(
      (acc) => acc.id === transferForm.fromAccountId
    );
    if (!fromAccount || fromAccount.balance < amount) {
      Alert.alert("Error", "Insufficient balance in the sender account");
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Transfer Successful",
        `$${amount.toFixed(2)} has been transferred from ${fromAccountName} to ${toAccountName}`
      );
    } catch (error) {
      console.error("Error transferring funds:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to transfer funds. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const accountData = {
        name: newAccount.name.trim(),
        type: newAccount.type,
        balance,
        description: newAccount.description.trim(),
        isActive: true,
        currency: "USD",
        color: newAccount.color,
        icon: newAccount.icon,
      };

      await AccountService.createAccount(authState.user.id, accountData);

      setNewAccount({
        name: "",
        type: "main",
        balance: "0",
        description: "",
        color: "#4F46E5",
        icon: "wallet-outline",
      });

      setShowAddModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Account created successfully!");
    } catch (error) {
      console.error("Error creating account:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Account updated successfully!");
    } catch (error) {
      console.error("Error updating account:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to update account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = (account: Account) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert("Success", "Account deleted successfully!");
            } catch (error) {
              console.error("Error deleting account:", error);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingAccount(account);
    setNewAccount({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      description: account.description || "",
      color: account.color || "#4F46E5",
      icon: account.icon || "wallet-outline",
    });
    setShowAddModal(true);
  };

  const openAddModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingAccount(null);
    setNewAccount({
      name: "",
      type: "main",
      balance: "0",
      description: "",
      color: "#6366F1",
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
      if (!account.isActive) return total;
      return total + account.balance;
    }, 0);
  };

  const AccountSkeleton = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="p-3 mb-3 bg-white shadow-sm rounded-xl"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <Skeleton colorMode="light" width={40} height={40} radius={20} />
          <View className="flex-1 ml-3">
            <Skeleton colorMode="light" width="60%" height={18} radius={4} />
            <View className="mt-1">
              <Skeleton colorMode="light" width="40%" height={14} radius={4} />
            </View>
          </View>
        </View>
        <View className="items-end">
          <Skeleton colorMode="light" width={70} height={18} radius={4} />
          <View className="mt-1">
            <Skeleton colorMode="light" width={35} height={14} radius={4} />
          </View>
        </View>
      </View>
    </MotiView>
  );

  if (!authState?.user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={["top"]}>
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <AppHeader title="My Accounts" />
        <MotiView
          from={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="items-center justify-center flex-1"
        >
          <Ionicons name="lock-closed" size={64} color="#9CA3AF" />
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            delay={300}
            className="mt-4 text-lg text-gray-600"
          >
            Please log in to view accounts
          </MotiText>
        </MotiView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <AppHeader title="My Accounts" backgroundColor="#f9fafb" />

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        className="flex-1"
        style={{ backgroundColor: "#f9fafb" }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="mb-6"
        >
          <View
            className="p-4 rounded-2xl"
            style={{
              backgroundColor: "#6366F1",
              shadowColor: "#667eea",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              delay={200}
              className="mb-1 text-base font-medium text-white opacity-90"
            >
              Total Balance
            </MotiText>
            <MotiText
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              delay={400}
              className="mb-4 text-3xl font-bold text-white"
            >
              {formatCurrency(calculateTotalBalance())}
            </MotiText>

            <View className="flex-row items-center justify-between">
              <MotiView
                from={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                delay={600}
              >
                <Text className="text-sm text-white opacity-80">
                  Active Accounts
                </Text>
                <Text className="text-xl font-semibold text-white">
                  {accounts.length}
                </Text>
              </MotiView>

              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                delay={800}
              >
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
                    Add Account
                  </Text>
                </TouchableOpacity>
              </MotiView>
            </View>
          </View>

          {accounts.length >= 2 && (
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              delay={1000}
              className="mt-5"
            >
              <TouchableOpacity
                onPress={() => setShowTransferModal(true)}
                className="flex-row items-center justify-center py-3 bg-white rounded-xl"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  elevation: 2,
                }}
                activeOpacity={0.9}
              >
                <Ionicons name="swap-horizontal" size={18} color="#6366F1" />
                <Text
                  className="ml-2 text-base font-semibold"
                  style={{ color: "#6366F1" }}
                >
                  Transfer Between Accounts
                </Text>
              </TouchableOpacity>
            </MotiView>
          )}
        </MotiView>

        <MotiText
          from={{ opacity: 0, translateX: -20 }}
          animate={{ opacity: 1, translateX: 0 }}
          delay={300}
          className="mt-6 mb-5 text-xl font-bold text-gray-900"
        >
          Your Accounts
        </MotiText>

        {loading && accounts.length === 0 ? (
          <View>
            {[...Array(3)].map((_, index) => (
              <AccountSkeleton key={index} />
            ))}
          </View>
        ) : accounts.length === 0 ? (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="items-center p-6 bg-white rounded-2xl"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.06,
              shadowRadius: 12,
              elevation: 2,
            }}
          >
            <Ionicons name="wallet-outline" size={60} color="#D1D5DB" />
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              delay={200}
              className="mt-4 mb-2 text-xl font-bold text-gray-900"
            >
              No Accounts Yet
            </MotiText>
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              delay={400}
              className="mb-6 text-center text-gray-600"
            >
              Create your first account to start managing your finances
            </MotiText>
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              delay={600}
            >
              <TouchableOpacity
                onPress={openAddModal}
                className="flex-row items-center px-6 py-3 rounded-xl"
                style={{
                  backgroundColor: "#6366F1",
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
                  Create Account
                </Text>
              </TouchableOpacity>
            </MotiView>
          </MotiView>
        ) : (
          accounts.map((account, index) => {
            const typeInfo = getAccountTypeInfo(account.type);
            const accountColor = account.color || typeInfo.color;
            const accountIcon = account.icon || typeInfo.icon;
            return (
              <MotiView
                key={account.id}
                from={{ opacity: 0, translateY: 30 }}
                animate={{ opacity: 1, translateY: 0 }}
                delay={index * 100}
                className="p-3 mb-3 bg-white shadow-sm rounded-xl"
                style={{
                  shadowColor: accountColor,
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
                        backgroundColor: accountColor,
                        shadowColor: accountColor,
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.2,
                        shadowRadius: 4,
                      }}
                    >
                      <Ionicons
                        name={accountIcon as any}
                        size={20}
                        color="white"
                      />
                    </View>

                    <View className="flex-1">
                      <Text className="text-lg font-bold text-gray-900">
                        {account.name}
                      </Text>
                      <Text
                        className="text-xs font-medium"
                        style={{ color: accountColor }}
                      >
                        {typeInfo.label}
                      </Text>
                      {account.description && (
                        <Text className="mt-0.5 text-xs text-gray-500">
                          {account.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View className="items-end">
                    <Text
                      className={`text-lg font-bold ${
                        account.balance >= 0
                          ? "text-emerald-500"
                          : "text-rose-500"
                      }`}
                    >
                      {formatCurrency(Math.abs(account.balance))}
                    </Text>
                    <Text className="text-xs font-medium text-gray-400">
                      {account.currency || "USD"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-end mt-3">
                  <TouchableOpacity
                    onPress={() => openEditModal(account)}
                    className="flex-row items-center px-3 py-1.5 mr-2 rounded-lg bg-blue-50"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pencil" size={14} color="#3B82F6" />
                    <Text className="ml-1 text-xs font-semibold text-blue-600">
                      Edit
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDeleteAccount(account)}
                    className="flex-row items-center px-3 py-1.5 rounded-lg bg-rose-50"
                    activeOpacity={0.8}
                  >
                    <Ionicons name="trash" size={14} color="#EF4444" />
                    <Text className="ml-1 text-xs font-semibold text-rose-600">
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            );
          })
        )}

        <View className="h-10" />
      </ScrollView>

      {/* Add/Edit Account Modal */}
      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="justify-end flex-1 bg-black/20">
          <MotiView
            from={{ translateY: 400 }}
            animate={{ translateY: 0 }}
            className="p-6 bg-white rounded-t-3xl"
            style={{ maxHeight: "90%" }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">
                {editingAccount ? "Edit Account" : "Add New Account"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowAddModal(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Account Name */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Account Name
                </Text>
                <TextInput
                  value={newAccount.name}
                  onChangeText={(text) =>
                    setNewAccount({ ...newAccount, name: text })
                  }
                  placeholder="Enter account name"
                  className="p-4 text-base border border-gray-200 rounded-xl"
                  style={{ backgroundColor: "#f9fafb" }}
                />
              </View>

              {/* Account Type */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Account Type
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {accountTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() =>
                        setNewAccount({ ...newAccount, type: type.value })
                      }
                      className={`flex-row items-center px-4 py-3 rounded-xl border-2 ${
                        newAccount.type === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={
                          newAccount.type === type.value
                            ? type.color
                            : "#6B7280"
                        }
                      />
                      <Text
                        className={`ml-2 font-medium ${
                          newAccount.type === type.value
                            ? "text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Initial Balance */}
              {!editingAccount && (
                <View className="mb-4">
                  <Text className="mb-2 text-base font-semibold text-gray-700">
                    Initial Balance
                  </Text>
                  <TextInput
                    value={newAccount.balance}
                    onChangeText={(text) =>
                      setNewAccount({ ...newAccount, balance: text })
                    }
                    placeholder="0.00"
                    keyboardType="numeric"
                    className="p-4 text-base border border-gray-200 rounded-xl"
                    style={{ backgroundColor: "#f9fafb" }}
                  />
                </View>
              )}

              {/* Description */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Description (Optional)
                </Text>
                <TextInput
                  value={newAccount.description}
                  onChangeText={(text) =>
                    setNewAccount({ ...newAccount, description: text })
                  }
                  placeholder="Enter description"
                  className="p-4 text-base border border-gray-200 rounded-xl"
                  style={{ backgroundColor: "#f9fafb" }}
                  multiline
                  numberOfLines={3}
                />
              </View>

              {/* Color Picker */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Choose Color
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setNewAccount({ ...newAccount, color })}
                      className={`w-12 h-12 rounded-full border-4 ${
                        newAccount.color === color
                          ? "border-gray-800"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </View>
              </View>

              {/* Icon Picker */}
              <View className="mb-6">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Choose Icon
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableIcons.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      onPress={() => setNewAccount({ ...newAccount, icon })}
                      className={`w-12 h-12 rounded-full items-center justify-center border-2 ${
                        newAccount.icon === icon
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons
                        name={icon as any}
                        size={24}
                        color={newAccount.icon === icon ? "#3B82F6" : "#6B7280"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-4">
                <TouchableOpacity
                  onPress={() => setShowAddModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 rounded-xl"
                >
                  <Text className="text-base font-semibold text-center text-gray-700">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={
                    editingAccount ? handleUpdateAccount : handleCreateAccount
                  }
                  className="flex-1 px-6 py-4 rounded-xl"
                  style={{ backgroundColor: "#6366F1" }}
                >
                  <Text className="text-base font-semibold text-center text-white">
                    {editingAccount ? "Update" : "Create"} Account
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </MotiView>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal
        visible={showTransferModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowTransferModal(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <MotiView
            from={{ translateY: 400 }}
            animate={{ translateY: 0 }}
            className="p-6 bg-white rounded-t-3xl"
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">
                Transfer Funds
              </Text>
              <TouchableOpacity
                onPress={() => setShowTransferModal(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* From Account */}
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
                        setTransferForm({
                          ...transferForm,
                          fromAccountId: account.id,
                        })
                      }
                      className={`p-4 rounded-xl border-2 min-w-[140px] ${
                        transferForm.fromAccountId === account.id
                          ? "border-blue-500 bg-blue-50"
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

            {/* To Account */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                To Account
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-3">
                  {accounts
                    .filter(
                      (account) => account.id !== transferForm.fromAccountId
                    )
                    .map((account) => (
                      <TouchableOpacity
                        key={account.id}
                        onPress={() =>
                          setTransferForm({
                            ...transferForm,
                            toAccountId: account.id,
                          })
                        }
                        className={`p-4 rounded-xl border-2 min-w-[140px] ${
                          transferForm.toAccountId === account.id
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

            {/* Amount */}
            <View className="mb-4">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Transfer Amount
              </Text>
              <TextInput
                value={transferForm.amount}
                onChangeText={(text) =>
                  setTransferForm({ ...transferForm, amount: text })
                }
                placeholder="0.00"
                keyboardType="numeric"
                className="p-4 text-base border border-gray-200 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              />
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Description (Optional)
              </Text>
              <TextInput
                value={transferForm.description}
                onChangeText={(text) =>
                  setTransferForm({ ...transferForm, description: text })
                }
                placeholder="Enter transfer description"
                className="p-4 text-base border border-gray-200 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              />
            </View>

            {/* Action Buttons */}
            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowTransferModal(false)}
                className="flex-1 px-6 py-4 bg-gray-100 rounded-xl"
              >
                <Text className="text-base font-semibold text-center text-gray-700">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleTransfer}
                className="flex-1 px-6 py-4 rounded-xl"
                style={{ backgroundColor: "#6366F1" }}
              >
                <Text className="text-base font-semibold text-center text-white">
                  Transfer Funds
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>

      {/* Budget Setup Modal */}
      <Modal
        visible={showBudgetModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View className="justify-center flex-1 px-4 bg-black/50">
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 bg-white rounded-3xl"
          >
            <View className="items-center mb-6">
              <View
                className="items-center justify-center w-20 h-20 mb-4 rounded-full"
                style={{ backgroundColor: "#6366F1" }}
              >
                <Ionicons name="wallet-outline" size={40} color="white" />
              </View>
              <Text className="text-2xl font-bold text-center text-gray-900">
                Set Up Your Budget
              </Text>
              <Text className="mt-2 text-center text-gray-600">
                Enter your monthly budget to automatically create accounts
              </Text>
            </View>

            <View className="mb-6">
              <Text className="mb-2 text-base font-semibold text-gray-700">
                Monthly Budget/Salary
              </Text>
              <TextInput
                value={monthlyBudget}
                onChangeText={setMonthlyBudget}
                placeholder="Enter your monthly budget"
                keyboardType="numeric"
                className="p-4 text-base border border-gray-200 rounded-xl"
                style={{ backgroundColor: "#f9fafb" }}
              />
            </View>

            <View className="p-4 mb-6 bg-blue-50 rounded-xl">
              <Text className="mb-2 text-sm font-semibold text-blue-700">
                Account Allocation:
              </Text>
              <Text className="text-sm text-blue-600">
                • Main Account: 50% (Daily expenses)
              </Text>
              <Text className="text-sm text-blue-600">
                • Savings Account: 30% (Future goals)
              </Text>
              <Text className="text-sm text-blue-600">
                • Expenses Account: 20% (Bills & utilities)
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                onPress={() => setShowBudgetModal(false)}
                className="flex-1 px-6 py-4 bg-gray-100 rounded-xl"
              >
                <Text className="text-base font-semibold text-center text-gray-700">
                  Skip for Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleBudgetSetup}
                className="flex-1 px-6 py-4 rounded-xl"
                style={{ backgroundColor: "#6366F1" }}
              >
                <Text className="text-base font-semibold text-center text-white">
                  Create Accounts
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <MotiView
        from={{ scale: 0, rotate: "180deg" }}
        animate={{ scale: 1, rotate: "0deg" }}
        delay={1000}
        className="absolute bottom-10 right-6"
      >
        <TouchableOpacity
          onPress={openAddModal}
          className="items-center justify-center rounded-full shadow-lg w-14 h-14"
          style={{
            backgroundColor: "#6366F1",
            shadowColor: "#6366F1",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
};

export default AccountScreen;
