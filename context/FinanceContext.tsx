import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import {
  AccountService,
  CategoryService,
  GoalService,
  TransactionService,
} from "../services";
import { Account, Category, Goal, Transaction } from "../types/finance";
import { useAuth } from "./FirebaseAuthContext";

interface FinanceContextType {
  // State
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  goals: Goal[];
  isLoading: boolean;
  error: string | null;

  // Account methods
  createAccount: (
    accountData: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  getAccountById: (accountId: string) => Account | undefined;
  getTotalBalance: () => number;
  getAccountBalance: (accountId: string) => number;

  // Category methods
  createCategory: (
    categoryData: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  getCategoryById: (categoryId: string) => Category | undefined;
  getExpenseCategories: () => Category[];
  getIncomeCategories: () => Category[];

  // Transaction methods
  createTransaction: (
    transactionData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  ) => Promise<string>;
  getRecentTransactions: (limit?: number) => Transaction[];
  getTransactionsByAccount: (accountId: string) => Transaction[];
  getTransactionsByCategory: (categoryId: string) => Transaction[];

  // Goal methods
  createGoal: (
    goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  payTowardGoal: (
    goalId: string,
    fromAccountId: string,
    amount: number,
    description?: string
  ) => Promise<string>;
  getActiveGoals: () => Goal[];
  getCompletedGoals: () => Goal[];

  // Transfer method
  transferBetweenAccounts: (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string
  ) => Promise<string>;

  // Analytics methods
  getMonthlyExpenses: () => number;
  getMonthlyIncome: () => number;
  getCategoryExpenses: (categoryId: string, monthsBack?: number) => number;

  // Utility methods
  refreshData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const useFinance = (): FinanceContextType => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error("useFinance must be used within a FinanceProvider");
  }
  return context;
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { authState } = useAuth();

  // State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unsubscribe functions for real-time listeners
  const [unsubscribeAccounts, setUnsubscribeAccounts] = useState<
    (() => void) | null
  >(null);
  const [unsubscribeTransactions, setUnsubscribeTransactions] = useState<
    (() => void) | null
  >(null);

  // Initialize data when user is authenticated
  useEffect(() => {
    if (authState.isAuthenticated && authState.user?.id) {
      initializeFinanceData();
    } else {
      // Clear data when user logs out
      setAccounts([]);
      setTransactions([]);
      setCategories([]);
      setGoals([]);

      // Cleanup listeners
      if (unsubscribeAccounts) unsubscribeAccounts();
      if (unsubscribeTransactions) unsubscribeTransactions();
    }

    return () => {
      // Cleanup on unmount
      if (unsubscribeAccounts) unsubscribeAccounts();
      if (unsubscribeTransactions) unsubscribeTransactions();
    };
  }, [authState.isAuthenticated, authState.user?.id]);

  const initializeFinanceData = async () => {
    if (!authState.user?.id) return;

    // Double-check Firebase auth state
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.log("⚠️ No current Firebase user found, waiting for auth...");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = authState.user.id;

      console.log("🔧 Initializing finance data for user:", userId);
      console.log("🔐 Auth state:", {
        isAuthenticated: authState.isAuthenticated,
        hasUser: !!authState.user,
        userId: authState.user.id,
        firebaseUser: currentUser.uid,
      });

      // Verify that our user ID matches Firebase user ID
      if (userId !== currentUser.uid) {
        console.error("❌ User ID mismatch!", {
          userId,
          firebaseUid: currentUser.uid,
        });
        throw new Error("User ID mismatch");
      }

      // Check if user has existing data, if not initialize defaults
      const existingAccounts = await AccountService.getUserAccounts(userId);
      if (existingAccounts.length === 0) {
        console.log("🔧 Initializing default finance data for new user...");
        await Promise.all([
          AccountService.initializeDefaultAccounts(userId),
          CategoryService.initializeDefaultCategories(userId),
        ]);
      }

      // Load initial data
      const [accountsData, categoriesData, goalsData, transactionsData] =
        await Promise.all([
          AccountService.getUserAccounts(userId),
          CategoryService.getUserCategories(userId),
          GoalService.getUserGoals(userId),
          TransactionService.getUserTransactions(userId, { limit: 100 }),
        ]);

      setAccounts(accountsData);
      setCategories(categoriesData);
      setGoals(goalsData);
      setTransactions(transactionsData);

      // Set up real-time listeners
      const unsubAccounts = AccountService.subscribeToAccounts(
        userId,
        setAccounts
      );
      const unsubTransactions = TransactionService.subscribeToTransactions(
        userId,
        setTransactions,
        100
      );

      setUnsubscribeAccounts(() => unsubAccounts);
      setUnsubscribeTransactions(() => unsubTransactions);

      console.log("✅ Finance data initialized successfully");
    } catch (err) {
      console.error("❌ Error initializing finance data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load finance data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Account methods
  const createAccount = async (
    accountData: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    if (!authState.user?.id) throw new Error("User not authenticated");
    return await AccountService.createAccount(authState.user.id, accountData);
  };

  const getAccountById = (accountId: string): Account | undefined => {
    return accounts.find((account) => account.id === accountId);
  };

  const getTotalBalance = (): number => {
    return accounts.reduce((total, account) => total + account.balance, 0);
  };

  const getAccountBalance = (accountId: string): number => {
    const account = getAccountById(accountId);
    return account ? account.balance : 0;
  };

  // Category methods
  const createCategory = async (
    categoryData: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    if (!authState.user?.id) throw new Error("User not authenticated");
    const categoryId = await CategoryService.createCategory(
      authState.user.id,
      categoryData
    );

    // Refresh categories to include the new one
    const updatedCategories = await CategoryService.getUserCategories(
      authState.user.id
    );
    setCategories(updatedCategories);

    return categoryId;
  };

  const getCategoryById = (categoryId: string): Category | undefined => {
    return categories.find((category) => category.id === categoryId);
  };

  const getExpenseCategories = (): Category[] => {
    return categories.filter((category) => category.type === "expense");
  };

  const getIncomeCategories = (): Category[] => {
    return categories.filter((category) => category.type === "income");
  };

  // Transaction methods
  const createTransaction = async (
    transactionData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  ): Promise<string> => {
    if (!authState.user?.id) throw new Error("User not authenticated");
    return await TransactionService.createTransaction(
      authState.user.id,
      transactionData
    );
  };

  const getRecentTransactions = (limit: number = 10): Transaction[] => {
    return transactions.slice(0, limit);
  };

  const getTransactionsByAccount = (accountId: string): Transaction[] => {
    return transactions.filter(
      (transaction) =>
        transaction.fromAccountId === accountId ||
        transaction.toAccountId === accountId
    );
  };

  const getTransactionsByCategory = (categoryId: string): Transaction[] => {
    return transactions.filter(
      (transaction) => transaction.categoryId === categoryId
    );
  };

  // Goal methods
  const createGoal = async (
    goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> => {
    if (!authState.user?.id) throw new Error("User not authenticated");
    const goalId = await GoalService.createGoal(authState.user.id, goalData);

    // Refresh goals to include the new one
    const updatedGoals = await GoalService.getUserGoals(authState.user.id);
    setGoals(updatedGoals);

    return goalId;
  };

  const payTowardGoal = async (
    goalId: string,
    fromAccountId: string,
    amount: number,
    description?: string
  ): Promise<string> => {
    if (!authState.user?.id) throw new Error("User not authenticated");
    return await GoalService.payTowardGoal(
      authState.user.id,
      goalId,
      fromAccountId,
      amount,
      description
    );
  };

  const getActiveGoals = (): Goal[] => {
    return goals.filter((goal) => !goal.isCompleted);
  };

  const getCompletedGoals = (): Goal[] => {
    return goals.filter((goal) => goal.isCompleted);
  };

  // Transfer method
  const transferBetweenAccounts = async (
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description: string
  ): Promise<string> => {
    if (!authState.user?.id) throw new Error("User not authenticated");

    return await TransactionService.createTransaction(authState.user.id, {
      type: "transfer",
      amount,
      currency: "USD", // You might want to get this from the account
      description,
      fromAccountId,
      toAccountId,
      date: new Date(),
      isRecurring: false,
    });
  };

  // Analytics methods
  const getMonthlyExpenses = (): number => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return transactions
      .filter(
        (transaction) =>
          transaction.type === "expense" &&
          transaction.date.getMonth() === thisMonth &&
          transaction.date.getFullYear() === thisYear
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  const getMonthlyIncome = (): number => {
    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();

    return transactions
      .filter(
        (transaction) =>
          transaction.type === "income" &&
          transaction.date.getMonth() === thisMonth &&
          transaction.date.getFullYear() === thisYear
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  const getCategoryExpenses = (
    categoryId: string,
    monthsBack: number = 1
  ): number => {
    const now = new Date();
    const cutoffDate = new Date(
      now.getFullYear(),
      now.getMonth() - monthsBack,
      1
    );

    return transactions
      .filter(
        (transaction) =>
          transaction.categoryId === categoryId &&
          transaction.type === "expense" &&
          transaction.date >= cutoffDate
      )
      .reduce((total, transaction) => total + transaction.amount, 0);
  };

  // Utility methods
  const refreshData = async (): Promise<void> => {
    if (authState.user?.id) {
      await initializeFinanceData();
    }
  };

  const contextValue: FinanceContextType = {
    // State
    accounts,
    transactions,
    categories,
    goals,
    isLoading,
    error,

    // Account methods
    createAccount,
    getAccountById,
    getTotalBalance,
    getAccountBalance,

    // Category methods
    createCategory,
    getCategoryById,
    getExpenseCategories,
    getIncomeCategories,

    // Transaction methods
    createTransaction,
    getRecentTransactions,
    getTransactionsByAccount,
    getTransactionsByCategory,

    // Goal methods
    createGoal,
    payTowardGoal,
    getActiveGoals,
    getCompletedGoals,

    // Transfer method
    transferBetweenAccounts,

    // Analytics methods
    getMonthlyExpenses,
    getMonthlyIncome,
    getCategoryExpenses,

    // Utility methods
    refreshData,
  };

  return (
    <FinanceContext.Provider value={contextValue}>
      {children}
    </FinanceContext.Provider>
  );
};
