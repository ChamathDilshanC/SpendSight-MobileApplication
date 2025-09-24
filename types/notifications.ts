export interface NotificationData {
  title: string;
  body: string;
  data?: Record<string, any>;
}

export interface TransactionNotificationData {
  type: "transaction";
  amount: number;
  category?: string;
  transactionType: "income" | "expense";
}

export interface DailyLimitNotificationData {
  type: "daily_limit_warning" | "daily_limit_exceeded";
  spent: number;
  limit: number;
  percentage?: number;
  over?: number;
}

export interface GoalNotificationData {
  type: "goal_completed" | "goal_progress" | "goal_milestone" | "goal_update";
  goalId: string;
  goalName: string;
  progress?: number;
  targetAmount: number;
  currentAmount?: number;
  addedAmount?: number;
  remaining?: number;
}

export interface BudgetNotificationData {
  type: "budget_exceeded" | "budget_warning";
  accountId: string;
  accountName: string;
  spent: number;
  budget: number;
  percentage?: number;
}

export interface BalanceNotificationData {
  type: "balance_low" | "balance_critical" | "large_transaction";
  accountId: string;
  accountName?: string;
  balance?: number;
  amount?: number;
}

export type NotificationPayload =
  | TransactionNotificationData
  | DailyLimitNotificationData
  | GoalNotificationData
  | BudgetNotificationData
  | BalanceNotificationData;

export interface Goal {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  budget?: number;
  type: string;
  userId: string;
}

export interface Transaction {
  id: string;
  amount: number;
  category?: string;
  accountId: string;
  userId: string;
  createdAt: Date;
}

export interface NotificationSettings {
  dailyReminders: boolean;
  transactionAlerts: boolean;
  goalUpdates: boolean;
  budgetWarnings: boolean;
  reminderTime: {
    hour: number;
    minute: number;
  };
}
