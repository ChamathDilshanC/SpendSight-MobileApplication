import { db } from "@/firebase";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  increment,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { Goal } from "../types/finance";
import { GoalNotificationService } from "./GoalNotificationService";
import { NotificationService } from "./NotificationService";
import { TransactionService } from "./TransactionService";

export class GoalService {
  static async createGoal(
    userId: string,
    goalData: Omit<Goal, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "goals"), {
        ...goalData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Goal created with ID:", docRef.id);

      const newGoal: Goal = {
        ...goalData,
        id: docRef.id,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await GoalNotificationService.notifyGoalCreated(newGoal);

      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating goal:", error);
      throw error;
    }
  }

  static async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      console.log("🔍 Fetching goals for user:", userId);

      const q = query(collection(db, "goals"), where("userId", "==", userId));

      const querySnapshot = await getDocs(q);
      console.log("✅ Found", querySnapshot.docs.length, "goals");

      const goals = querySnapshot.docs
        .map(
          (doc) =>
            ({
              ...doc.data(),
              id: doc.id,
              targetDate: doc.data().targetDate?.toDate() || new Date(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            }) as Goal
        )
        .sort((a, b) => {
          if (a.isCompleted && !b.isCompleted) return 1;
          if (!a.isCompleted && b.isCompleted) return -1;
          return a.targetDate.getTime() - b.targetDate.getTime();
        });

      console.log("✅ Goals sorted and returned:", goals.length);
      return goals;
    } catch (error) {
      console.error("❌ Error fetching goals:", error);
      console.error("🔍 Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        userId: userId,
      });
      throw error;
    }
  }

  static async updateGoal(
    goalId: string,
    updateData: Partial<Omit<Goal, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    try {
      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      if (updateData.targetAmount || updateData.targetDate || updateData.name) {
        await NotificationService.sendNotification(
          "📝 Goal Updated",
          `Your goal has been updated${updateData.name ? ": " + updateData.name : ""}`,
          {
            type: "goal_update",
            goalId,
            goalName: updateData.name || "Unknown Goal",
            targetAmount: updateData.targetAmount || 0,
            currentAmount: 0,
            progress: 0,
          }
        );
      }

      console.log("✅ Goal updated:", goalId);
    } catch (error) {
      console.error("❌ Error updating goal:", error);
      throw error;
    }
  }

  static async payTowardGoal(
    userId: string,
    goalId: string,
    fromAccountId: string,
    amount: number,
    description: string = "Goal payment"
  ): Promise<string> {
    try {
      const goals = await this.getUserGoals(userId);
      const goalBefore = goals.find((g) => g.id === goalId);

      if (!goalBefore) {
        throw new Error("Goal not found");
      }

      const transactionId = await TransactionService.createTransaction(userId, {
        type: "goal_payment",
        amount,
        currency: "USD",
        description,
        fromAccountId,

        date: new Date(),
        goalId,
        isRecurring: false,
        tags: ["goal-payment"],
      });

      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, {
        currentAmount: increment(amount),
        updatedAt: serverTimestamp(),
      });

      const updatedGoals = await this.getUserGoals(userId);
      const goalAfter = updatedGoals.find((g) => g.id === goalId);

      if (goalAfter) {
        await GoalNotificationService.notifyGoalPayment(
          goalAfter,
          amount,
          false
        );

        await GoalNotificationService.updateGoalProgress(
          userId,
          goalId,
          amount
        );

        if (
          goalAfter.currentAmount >= goalAfter.targetAmount &&
          !goalAfter.isCompleted
        ) {
          await this.completeGoal(goalId);
        }
      }

      console.log("✅ Goal payment processed:", goalId, "amount:", amount);
      return transactionId;
    } catch (error) {
      console.error("❌ Error processing goal payment:", error);
      throw error;
    }
  }

  static async withdrawFromGoal(
    userId: string,
    goalId: string,
    toAccountId: string,
    amount: number,
    description: string = "Goal withdrawal"
  ): Promise<string> {
    try {
      const goals = await this.getUserGoals(userId);
      const goal = goals.find((g) => g.id === goalId);

      if (!goal) {
        throw new Error("Goal not found");
      }

      if (goal.currentAmount < amount) {
        throw new Error(
          `Insufficient goal balance. Available: $${goal.currentAmount.toFixed(2)}, Requested: $${amount.toFixed(2)}`
        );
      }

      const transactionId = await TransactionService.createTransaction(userId, {
        type: "goal_payment",
        amount,
        currency: "USD",
        description,
        toAccountId,

        date: new Date(),
        goalId,
        isRecurring: false,
        tags: ["goal-withdrawal"],
      });

      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, {
        currentAmount: increment(-amount),
        updatedAt: serverTimestamp(),
      });

      const updatedGoals = await this.getUserGoals(userId);
      const updatedGoal = updatedGoals.find((g) => g.id === goalId);

      if (updatedGoal) {
        await GoalNotificationService.notifyGoalPayment(
          updatedGoal,
          amount,
          true
        );
      }

      console.log("✅ Goal withdrawal processed:", goalId, "amount:", amount);
      return transactionId;
    } catch (error) {
      console.error("❌ Error processing goal withdrawal:", error);
      throw error;
    }
  }

  static async setupAutoTransfer(
    goalId: string,
    autoPaymentSettings: {
      enabled: boolean;
      fromAccountId?: string;
      amount?: number;
      frequency?: "daily" | "weekly" | "biweekly" | "monthly";
      nextPaymentDate?: Date;
    }
  ): Promise<void> {
    try {
      let nextPaymentDate: Date | undefined;

      if (autoPaymentSettings.enabled && autoPaymentSettings.frequency) {
        const now = new Date();
        nextPaymentDate = new Date(now);

        switch (autoPaymentSettings.frequency) {
          case "daily":
            nextPaymentDate.setDate(now.getDate() + 1);
            break;
          case "weekly":
            nextPaymentDate.setDate(now.getDate() + 7);
            break;
          case "biweekly":
            nextPaymentDate.setDate(now.getDate() + 14);
            break;
          case "monthly":
            nextPaymentDate.setMonth(now.getMonth() + 1);
            break;
        }
      }

      const goalRef = doc(db, "goals", goalId);

      const filteredAutoPaymentSettings = Object.fromEntries(
        Object.entries(autoPaymentSettings).filter(
          ([_, value]) => value !== undefined
        )
      );

      const updateData: any = {
        autoPayment: {
          ...filteredAutoPaymentSettings,
        },
        updatedAt: serverTimestamp(),
      };

      if (nextPaymentDate !== undefined) {
        updateData.autoPayment.nextPaymentDate = nextPaymentDate;
      }

      await updateDoc(goalRef, updateData);

      if (autoPaymentSettings.enabled) {
        await NotificationService.sendNotification(
          "🤖 Auto-Transfer Enabled",
          `Automatic transfers of $${autoPaymentSettings.amount?.toFixed(2)} set up ${autoPaymentSettings.frequency} for your goal`,
          {
            type: "goal_update",
            goalId,
            goalName: "Goal Auto-Transfer",
            targetAmount: 0,
            currentAmount: 0,
            addedAmount: autoPaymentSettings.amount || 0,
          }
        );
      } else {
        await NotificationService.sendNotification(
          "⏸️ Auto-Transfer Disabled",
          "Automatic transfers have been disabled for your goal",
          {
            type: "goal_update",
            goalId,
            goalName: "Goal Auto-Transfer",
            targetAmount: 0,
            currentAmount: 0,
          }
        );
      }

      console.log("✅ Auto-transfer setup updated for goal:", goalId);
    } catch (error) {
      console.error("❌ Error setting up auto-transfer:", error);
      throw error;
    }
  }

  static async processAutoTransfers(userId: string): Promise<void> {
    try {
      const activeGoals = await this.getActiveGoals(userId);
      const now = new Date();
      let transfersProcessed = 0;

      for (const goal of activeGoals) {
        if (
          goal.autoPayment?.enabled &&
          goal.autoPayment.nextPaymentDate &&
          goal.autoPayment.nextPaymentDate <= now &&
          goal.autoPayment.fromAccountId &&
          goal.autoPayment.amount &&
          goal.autoPayment.amount > 0
        ) {
          try {
            const accountName = await this.getAccountName(
              userId,
              goal.autoPayment.fromAccountId
            );

            await this.payTowardGoal(
              userId,
              goal.id,
              goal.autoPayment.fromAccountId,
              goal.autoPayment.amount,
              `Auto-transfer to ${goal.name}`
            );

            const updatedGoals = await this.getUserGoals(userId);
            const updatedGoal = updatedGoals.find((g) => g.id === goal.id);

            if (updatedGoal) {
              await GoalNotificationService.notifyAutoTransfer(
                updatedGoal,
                goal.autoPayment.amount,
                accountName || "Unknown Account"
              );
            }

            const nextDate = new Date(goal.autoPayment.nextPaymentDate);
            switch (goal.autoPayment.frequency) {
              case "daily":
                nextDate.setDate(nextDate.getDate() + 1);
                break;
              case "weekly":
                nextDate.setDate(nextDate.getDate() + 7);
                break;
              case "biweekly":
                nextDate.setDate(nextDate.getDate() + 14);
                break;
              case "monthly":
                nextDate.setMonth(nextDate.getMonth() + 1);
                break;
            }

            const goalRef = doc(db, "goals", goal.id);
            await updateDoc(goalRef, {
              "autoPayment.nextPaymentDate": nextDate,
              updatedAt: serverTimestamp(),
            });

            transfersProcessed++;
            console.log(`✅ Auto-transfer processed for goal: ${goal.name}`);
          } catch (error) {
            console.error(
              `❌ Error processing auto-transfer for goal ${goal.name}:`,
              error
            );
          }
        }
      }

      if (transfersProcessed > 0) {
        await NotificationService.sendNotification(
          "🤖 Auto-Transfers Complete",
          `${transfersProcessed} automatic transfer(s) processed successfully`,
          {
            type: "goal_update",
            goalId: "auto-transfer-summary",
            goalName: "Auto-Transfer Summary",
            targetAmount: 0,
            currentAmount: 0,
          }
        );
      }
    } catch (error) {
      console.error("❌ Error processing auto-transfers:", error);
      throw error;
    }
  }

  static async completeGoal(goalId: string): Promise<void> {
    try {
      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, {
        isCompleted: true,
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Goal marked as completed:", goalId);
    } catch (error) {
      console.error("❌ Error completing goal:", error);
      throw error;
    }
  }

  static async getActiveGoals(userId: string): Promise<Goal[]> {
    try {
      const allGoals = await this.getUserGoals(userId);
      return allGoals.filter((goal) => !goal.isCompleted);
    } catch (error) {
      console.error("❌ Error fetching active goals:", error);
      throw error;
    }
  }

  static async getCompletedGoals(userId: string): Promise<Goal[]> {
    try {
      const allGoals = await this.getUserGoals(userId);
      return allGoals.filter((goal) => goal.isCompleted);
    } catch (error) {
      console.error("❌ Error fetching completed goals:", error);
      throw error;
    }
  }

  static async getGoalsByCategory(
    userId: string,
    category: string
  ): Promise<Goal[]> {
    try {
      const allGoals = await this.getUserGoals(userId);
      return allGoals.filter((goal) => goal.category === category);
    } catch (error) {
      console.error("❌ Error fetching goals by category:", error);
      throw error;
    }
  }

  static calculateGoalProgress(goal: Goal): number {
    if (goal.targetAmount === 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }

  static async getGoalsDueSoon(
    userId: string,
    daysAhead: number = 30,
    sendNotifications: boolean = false
  ): Promise<Goal[]> {
    try {
      const allGoals = await this.getActiveGoals(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      const goalsDueSoon = allGoals.filter(
        (goal) => goal.targetDate <= cutoffDate
      );

      if (sendNotifications) {
        for (const goal of goalsDueSoon) {
          const now = new Date();
          const timeDiff = goal.targetDate.getTime() - now.getTime();
          const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));

          await GoalNotificationService.notifyGoalDeadline(goal, daysRemaining);
        }
      }

      return goalsDueSoon;
    } catch (error) {
      console.error("❌ Error fetching goals due soon:", error);
      throw error;
    }
  }

  static async deleteGoal(goalId: string, goalName?: string): Promise<void> {
    try {
      const goalRef = doc(db, "goals", goalId);

      await updateDoc(goalRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      await NotificationService.sendNotification(
        "🗑️ Goal Deleted",
        `"${goalName || "Your goal"}" has been removed from your goals list`,
        {
          type: "goal_update",
          goalId,
          goalName: goalName || "Deleted Goal",
          targetAmount: 0,
          currentAmount: 0,
        }
      );

      console.log("✅ Goal deactivated:", goalId);
    } catch (error) {
      console.error("❌ Error deactivating goal:", error);
      throw error;
    }
  }

  private static async getAccountName(
    userId: string,
    accountId: string
  ): Promise<string | null> {
    try {
      return `Account ${accountId.slice(-4)}`;
    } catch (error) {
      console.error("❌ Error getting account name:", error);
      return null;
    }
  }

  static async sendDailyGoalReminders(userId: string): Promise<void> {
    try {
      await GoalNotificationService.checkGoalDeadlines(userId);
      await GoalNotificationService.sendProgressSummary(userId);
    } catch (error) {
      console.error("❌ Error sending daily goal reminders:", error);
    }
  }

  static async addGoalMilestone(
    goalId: string,
    milestone: { amount: number; date: Date; note?: string }
  ): Promise<void> {
    try {
      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, {
        updatedAt: serverTimestamp(),
      });

      await NotificationService.sendNotification(
        "🎯 Milestone Added",
        `New milestone of $${milestone.amount.toFixed(2)} added to your goal${milestone.note ? ": " + milestone.note : ""}`,
        {
          type: "goal_milestone",
          goalId,
          goalName: "Goal Milestone",
          targetAmount: milestone.amount,
          currentAmount: 0,
        }
      );

      console.log("✅ Milestone added to goal:", goalId);
    } catch (error) {
      console.error("❌ Error adding milestone to goal:", error);
      throw error;
    }
  }
}
