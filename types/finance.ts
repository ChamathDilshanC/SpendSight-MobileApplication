// Finance-related TypeScript interfaces for SpendSight

export interface Account {
  id: string;
  userId: string;
  name: string;
  type: "main" | "savings" | "expenses" | "custom";
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  description?: string;
  color: string; // For UI representation
  icon: string; // Icon name for the account
}

export interface Category {
  id: string;
  userId: string;
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
  budget?: number; // Monthly budget limit for this category
  isDefault: boolean; // System categories vs user-created
  createdAt: Date;
  updatedAt: Date;
  parentId?: string; // For subcategories
}

export interface Transaction {
  id: string;
  userId: string;
  type: "expense" | "income" | "transfer";
  amount: number;
  currency: string;
  description: string;
  categoryId?: string; // For expenses/income
  fromAccountId?: string; // For transfers
  toAccountId?: string; // For transfers or goal payments
  goalId?: string; // If transaction is for a goal
  date: Date;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  attachments?: string[]; // URLs to receipt images
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  isRecurring: boolean;
  recurringPattern?: RecurringPattern;
}

export interface RecurringPattern {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  interval: number; // Every X days/weeks/months/years
  endDate?: Date;
  nextPaymentDate: Date;
}

export interface Goal {
  id: string;
  userId: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate: Date;
  createdAt: Date;
  updatedAt: Date;
  isCompleted: boolean;
  category: string; // e.g., "Electronics", "Travel", "Emergency"
  icon: string;
  color: string;

  // Automatic payment settings
  autoPayment: {
    enabled: boolean;
    fromAccountId?: string;
    amount?: number; // Fixed amount or percentage
    frequency?: "weekly" | "monthly";
    nextPaymentDate?: Date;
  };

  // Progress tracking
  milestones?: {
    amount: number;
    date: Date;
    note?: string;
  }[];
}

export interface Budget {
  id: string;
  userId: string;
  categoryId: string;
  amount: number;
  period: "weekly" | "monthly" | "yearly";
  startDate: Date;
  endDate: Date;
  spent: number;
  isActive: boolean;
  alerts: {
    enabled: boolean;
    thresholds: number[]; // Alert at 50%, 80%, 100%
  };
}

export interface ExpenseAnalytics {
  userId: string;
  period: "week" | "month" | "year";
  totalExpenses: number;
  totalIncome: number;
  netSavings: number;
  categoryBreakdown: {
    categoryId: string;
    categoryName: string;
    amount: number;
    percentage: number;
  }[];
  accountBalances: {
    accountId: string;
    accountName: string;
    balance: number;
  }[];
  topExpenses: {
    transactionId: string;
    description: string;
    amount: number;
    category: string;
    date: Date;
  }[];
  savingsRate: number;
  budgetComparisons: {
    categoryId: string;
    budgeted: number;
    spent: number;
    remaining: number;
    percentageUsed: number;
  }[];
}

// Default categories for new users
export const DefaultCategories: Omit<
  Category,
  "id" | "userId" | "createdAt" | "updatedAt"
>[] = [
  // Expense categories
  {
    name: "Food & Dining",
    type: "expense",
    icon: "restaurant",
    color: "#FF6B6B",
    isDefault: true,
  },
  {
    name: "Transportation",
    type: "expense",
    icon: "car",
    color: "#4ECDC4",
    isDefault: true,
  },
  {
    name: "Shopping",
    type: "expense",
    icon: "bag",
    color: "#45B7D1",
    isDefault: true,
  },
  {
    name: "Entertainment",
    type: "expense",
    icon: "game-controller",
    color: "#96CEB4",
    isDefault: true,
  },
  {
    name: "Bills & Utilities",
    type: "expense",
    icon: "receipt",
    color: "#FECA57",
    isDefault: true,
  },
  {
    name: "Healthcare",
    type: "expense",
    icon: "medical",
    color: "#FF9FF3",
    isDefault: true,
  },
  {
    name: "Insurance",
    type: "expense",
    icon: "shield-checkmark",
    color: "#54A0FF",
    isDefault: true,
  },
  {
    name: "Education",
    type: "expense",
    icon: "school",
    color: "#5F27CD",
    isDefault: true,
  },
  {
    name: "Travel",
    type: "expense",
    icon: "airplane",
    color: "#00D2D3",
    isDefault: true,
  },
  {
    name: "Gifts & Donations",
    type: "expense",
    icon: "gift",
    color: "#FF6348",
    isDefault: true,
  },

  // Income categories
  {
    name: "Salary",
    type: "income",
    icon: "briefcase",
    color: "#2ED573",
    isDefault: true,
  },
  {
    name: "Freelance",
    type: "income",
    icon: "laptop",
    color: "#3742FA",
    isDefault: true,
  },
  {
    name: "Investment",
    type: "income",
    icon: "trending-up",
    color: "#2F3542",
    isDefault: true,
  },
  {
    name: "Other Income",
    type: "income",
    icon: "cash",
    color: "#57606F",
    isDefault: true,
  },
];

// Transaction types for filtering and categorization
export type TransactionType =
  | "expense"
  | "income"
  | "transfer"
  | "goal_payment";
export type AccountType = "main" | "savings" | "expenses" | "custom";
export type CategoryType = "expense" | "income";
export type GoalStatus = "active" | "completed" | "paused" | "cancelled";
