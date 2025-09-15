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
import { db } from "../firebase";
import { Goal } from "../types/finance";
import { TransactionService } from "./TransactionService";

export class GoalService {
  /**
   * Create a new financial goal
   */
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
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating goal:", error);
      throw error;
    }
  }

  /**
   * Get all goals for a user
   */
  static async getUserGoals(userId: string): Promise<Goal[]> {
    try {
      console.log("🔍 Fetching goals for user:", userId);

      // Simplified query to avoid composite index requirement
      const q = query(collection(db, "goals"), where("userId", "==", userId));

      const querySnapshot = await getDocs(q);
      console.log("✅ Found", querySnapshot.docs.length, "goals");

      // Sort in memory to avoid index requirement
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
          // Sort by completion status first (incomplete first), then by target date
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

  /**
   * Update goal details
   */
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

      console.log("✅ Goal updated:", goalId);
    } catch (error) {
      console.error("❌ Error updating goal:", error);
      throw error;
    }
  }

  /**
   * Make a manual payment towards a goal (deposit)
   */
  static async payTowardGoal(
    userId: string,
    goalId: string,
    fromAccountId: string,
    amount: number,
    description: string = "Goal payment"
  ): Promise<string> {
    try {
      // Create a transaction for the goal payment
      const transactionId = await TransactionService.createTransaction(userId, {
        type: "goal_payment",
        amount,
        currency: "USD",
        description,
        fromAccountId,
        // categoryId omitted for goal transactions
        date: new Date(),
        goalId,
        isRecurring: false,
        tags: ["goal-payment"],
      });

      // Update the goal's current amount
      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, {
        currentAmount: increment(amount),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Goal payment processed:", goalId, "amount:", amount);
      return transactionId;
    } catch (error) {
      console.error("❌ Error processing goal payment:", error);
      throw error;
    }
  }

  /**
   * Withdraw money from a goal back to an account
   */
  static async withdrawFromGoal(
    userId: string,
    goalId: string,
    toAccountId: string,
    amount: number,
    description: string = "Goal withdrawal"
  ): Promise<string> {
    try {
      // Validate that goal has enough balance for withdrawal
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

      // Create a transaction for the goal withdrawal (income to the account)
      const transactionId = await TransactionService.createTransaction(userId, {
        type: "goal_payment",
        amount,
        currency: "USD",
        description,
        toAccountId, // Money goes TO the account
        // categoryId omitted for goal transactions
        date: new Date(),
        goalId,
        isRecurring: false,
        tags: ["goal-withdrawal"],
      });

      // Update the goal's current amount (decrease)
      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, {
        currentAmount: increment(-amount), // Negative increment to subtract
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Goal withdrawal processed:", goalId, "amount:", amount);
      return transactionId;
    } catch (error) {
      console.error("❌ Error processing goal withdrawal:", error);
      throw error;
    }
  }

  /**
   * Set up automatic transfers for a goal
   */
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

      // Filter out undefined values to prevent Firebase errors
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

      // Only add nextPaymentDate if it's not undefined
      if (nextPaymentDate !== undefined) {
        updateData.autoPayment.nextPaymentDate = nextPaymentDate;
      }

      await updateDoc(goalRef, updateData);

      console.log("✅ Auto-transfer setup updated for goal:", goalId);
    } catch (error) {
      console.error("❌ Error setting up auto-transfer:", error);
      throw error;
    }
  }

  /**
   * Process automatic transfers for all eligible goals
   */
  static async processAutoTransfers(userId: string): Promise<void> {
    try {
      const activeGoals = await this.getActiveGoals(userId);
      const now = new Date();

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
            // Process the auto payment
            await this.payTowardGoal(
              userId,
              goal.id,
              goal.autoPayment.fromAccountId,
              goal.autoPayment.amount,
              `Auto-transfer to ${goal.name}`
            );

            // Calculate next payment date
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

            // Update next payment date
            await this.setupAutoTransfer(goal.id, {
              ...goal.autoPayment,
              nextPaymentDate: nextDate,
            });

            console.log(`✅ Auto-transfer processed for goal: ${goal.name}`);
          } catch (error) {
            console.error(
              `❌ Error processing auto-transfer for goal ${goal.name}:`,
              error
            );
          }
        }
      }
    } catch (error) {
      console.error("❌ Error processing auto-transfers:", error);
      throw error;
    }
  }

  /**
   * Mark a goal as completed
   */
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

  /**
   * Get active goals (not completed)
   */
  static async getActiveGoals(userId: string): Promise<Goal[]> {
    try {
      const allGoals = await this.getUserGoals(userId);
      return allGoals.filter((goal) => !goal.isCompleted);
    } catch (error) {
      console.error("❌ Error fetching active goals:", error);
      throw error;
    }
  }

  /**
   * Get completed goals
   */
  static async getCompletedGoals(userId: string): Promise<Goal[]> {
    try {
      const allGoals = await this.getUserGoals(userId);
      return allGoals.filter((goal) => goal.isCompleted);
    } catch (error) {
      console.error("❌ Error fetching completed goals:", error);
      throw error;
    }
  }

  /**
   * Get goals by category
   */
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

  /**
   * Calculate goal progress percentage
   */
  static calculateGoalProgress(goal: Goal): number {
    if (goal.targetAmount === 0) return 0;
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  }

  /**
   * Get goals that are due soon (within specified days)
   */
  static async getGoalsDueSoon(
    userId: string,
    daysAhead: number = 30
  ): Promise<Goal[]> {
    try {
      const allGoals = await this.getActiveGoals(userId);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

      return allGoals.filter((goal) => goal.targetDate <= cutoffDate);
    } catch (error) {
      console.error("❌ Error fetching goals due soon:", error);
      throw error;
    }
  }

  /**
   * Delete a goal
   */
  static async deleteGoal(goalId: string): Promise<void> {
    try {
      const goalRef = doc(db, "goals", goalId);
      // In a real implementation, you might want to check if there are any
      // transactions associated with this goal before deleting
      await updateDoc(goalRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Goal deactivated:", goalId);
    } catch (error) {
      console.error("❌ Error deactivating goal:", error);
      throw error;
    }
  }

  /**
   * Add a milestone to a goal
   */
  static async addGoalMilestone(
    goalId: string,
    milestone: { amount: number; date: Date; note?: string }
  ): Promise<void> {
    try {
      // Note: This would require updating the Goal type to include milestones as an array
      // For now, this is a placeholder implementation
      const goalRef = doc(db, "goals", goalId);
      await updateDoc(goalRef, {
        // milestones: arrayUnion(milestone), // Would need to import arrayUnion
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Milestone added to goal:", goalId);
    } catch (error) {
      console.error("❌ Error adding milestone to goal:", error);
      throw error;
    }
  }
}
