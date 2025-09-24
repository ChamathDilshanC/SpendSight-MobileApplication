import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
  DailyLimitNotificationData,
  GoalNotificationData,
  NotificationPayload,
  TransactionNotificationData,
} from "../types/notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async initialize(): Promise<boolean> {
    try {
      if (!Device.isDevice) {
        console.log("📱 Notifications only work on physical devices");
        return false;
      }

      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("❌ Notification permission denied");
        return false;
      }

      console.log("✅ Notifications initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Notification initialization error:", error);
      return false;
    }
  }

  static async sendNotification(
    title: string,
    body: string,
    data?: NotificationPayload
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: null,
      } as any);

      console.log("✅ Notification sent:", title);
    } catch (error) {
      console.error("❌ Error sending notification:", error);
    }
  }

  static async scheduleNotification(
    title: string,
    body: string,
    seconds: number,
    data?: NotificationPayload
  ): Promise<string | null> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
        },
        trigger: {
          seconds: seconds,
        },
      } as any);

      console.log(`✅ Notification scheduled for ${seconds} seconds`);
      return identifier;
    } catch (error) {
      console.error("❌ Error scheduling notification:", error);
      return null;
    }
  }

  static async notifyTransaction(
    amount: number,
    type: "income" | "expense",
    category?: string
  ): Promise<void> {
    const isIncome = type === "income";
    const emoji = isIncome ? "💰" : "💸";
    const symbol = isIncome ? "+" : "-";

    const title = `${emoji} ${isIncome ? "Income" : "Expense"} Added`;
    const body = `${symbol}$${Math.abs(amount).toFixed(2)}${category ? ` - ${category}` : ""}`;

    const data: TransactionNotificationData = {
      type: "transaction",
      amount: amount,
      category: category,
      transactionType: type,
    };

    await this.sendNotification(title, body, data);
  }

  static async notifyDailyLimit(
    spent: number,
    limit: number,
    type: "warning" | "exceeded"
  ): Promise<void> {
    if (type === "warning") {
      const percentage = Math.round((spent / limit) * 100);
      const data: DailyLimitNotificationData = {
        type: "daily_limit_warning",
        spent,
        limit,
        percentage,
      };

      await this.sendNotification(
        "⚠️ Daily Limit Warning",
        `You've spent $${spent.toFixed(2)} (${percentage}%) of your $${limit} daily limit`,
        data
      );
    } else if (type === "exceeded") {
      const over = spent - limit;
      const data: DailyLimitNotificationData = {
        type: "daily_limit_exceeded",
        spent,
        limit,
        over,
      };

      await this.sendNotification(
        "🚨 Daily Limit Exceeded",
        `You've exceeded your daily limit by $${over.toFixed(2)}. Total spent: $${spent.toFixed(2)}`,
        data
      );
    }
  }

  static async notifyGoal(
    goalName: string,
    progress: number,
    targetAmount: number,
    currentAmount: number,
    goalId: string
  ): Promise<void> {
    const baseData = {
      goalId,
      goalName,
      targetAmount,
      currentAmount,
      progress,
    };

    if (progress >= 100) {
      const data: GoalNotificationData = {
        ...baseData,
        type: "goal_completed",
      };

      await this.sendNotification(
        "🎉 Goal Achieved!",
        `Congratulations! You've reached your "${goalName}" goal of $${targetAmount}!`,
        data
      );
    } else if (progress >= 75) {
      const remaining = targetAmount - currentAmount;
      const data: GoalNotificationData = {
        ...baseData,
        type: "goal_progress",
        remaining,
      };

      await this.sendNotification(
        "🚀 Almost There!",
        `You're ${progress}% towards "${goalName}". Only $${remaining.toFixed(2)} to go!`,
        data
      );
    } else if (progress >= 50) {
      const data: GoalNotificationData = {
        ...baseData,
        type: "goal_milestone",
      };

      await this.sendNotification(
        "📈 Halfway There!",
        `Great progress! You've reached ${progress}% of your "${goalName}" goal.`,
        data
      );
    }
  }

  static async scheduleDailyReminder(
    hour: number = 18,
    minute: number = 0
  ): Promise<string | null> {
    try {
      const now = new Date();
      const reminderTime = new Date();
      reminderTime.setHours(hour, minute, 0, 0);

      if (reminderTime.getTime() <= now.getTime()) {
        reminderTime.setDate(reminderTime.getDate() + 1);
      }

      const secondsUntilReminder = Math.floor(
        (reminderTime.getTime() - now.getTime()) / 1000
      );

      const identifier = await this.scheduleNotification(
        "SpendSight Daily Reminder 💰",
        "Time to check your spending and stay on track!",
        secondsUntilReminder,
        { type: "daily_limit_warning", spent: 0, limit: 100 }
      );

      console.log(
        `✅ Daily reminder scheduled for ${hour}:${minute.toString().padStart(2, "0")}`
      );
      return identifier;
    } catch (error) {
      console.error("❌ Error scheduling daily reminder:", error);
      return null;
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log("✅ All notifications cleared");
    } catch (error) {
      console.error("❌ Error clearing notifications:", error);
    }
  }

  static async getScheduled(): Promise<Notifications.NotificationRequest[]> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Found ${scheduled.length} scheduled notifications`);
      return scheduled;
    } catch (error) {
      console.error("❌ Error getting scheduled notifications:", error);
      return [];
    }
  }

  static async checkPermissions(): Promise<Notifications.NotificationPermissionsStatus | null> {
    try {
      const permissions = await Notifications.getPermissionsAsync();
      console.log("📋 Notification permissions:", permissions);
      return permissions;
    } catch (error) {
      console.error("❌ Error checking permissions:", error);
      return null;
    }
  }

  static async runTests(): Promise<void> {
    console.log("🧪 Running notification tests...");

    await this.sendNotification("Test 1: Immediate", "This works! 🎉");

    await this.scheduleNotification(
      "Test 2: Delayed",
      "This appeared after 5 seconds!",
      5
    );

    await this.notifyTransaction(-25.5, "expense", "Coffee");

    console.log("✅ All tests scheduled");
  }
}
