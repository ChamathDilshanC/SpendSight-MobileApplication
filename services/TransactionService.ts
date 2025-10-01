import { db } from "@/firebase";
import {
  collection,
  doc,
  getDocs,
  increment,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { Transaction } from "../types/finance";
import { BalanceNotificationService } from "./BalanceNotificationService";
import { GoalNotificationService } from "./GoalNotificationService";
import { NotificationService } from "./NotificationService";

export class TransactionService {
  static async createTransaction(
    userId: string,
    transactionData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  ): Promise<string> {
    const batch = writeBatch(db);

    try {
      const transactionRef = doc(collection(db, "transactions"));

      const baseData: any = {
        id: transactionRef.id,
        userId,
        type: transactionData.type,
        amount: transactionData.amount,
        currency: transactionData.currency,
        description: transactionData.description,
        date: transactionData.date,
        isRecurring: transactionData.isRecurring,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      if (transactionData.categoryId !== undefined) {
        baseData.categoryId = transactionData.categoryId;
      }
      if (transactionData.fromAccountId !== undefined) {
        baseData.fromAccountId = transactionData.fromAccountId;
      }
      if (transactionData.toAccountId !== undefined) {
        baseData.toAccountId = transactionData.toAccountId;
      }
      if (transactionData.goalId !== undefined) {
        baseData.goalId = transactionData.goalId;
      }
      if (
        transactionData.tags !== undefined &&
        transactionData.tags.length > 0
      ) {
        baseData.tags = transactionData.tags;
      }
      if (
        transactionData.attachments !== undefined &&
        transactionData.attachments.length > 0
      ) {
        baseData.attachments = transactionData.attachments;
      }
      if (transactionData.location !== undefined) {
        baseData.location = transactionData.location;
      }
      if (transactionData.recurringPattern !== undefined) {
        baseData.recurringPattern = transactionData.recurringPattern;
      }

      batch.set(transactionRef, baseData);

      let affectedAccountId: string | null = null;
      let affectedAccountName: string = "";
      let newBalance: number = 0;

      if (transactionData.type === "expense" && transactionData.fromAccountId) {
        const accountRef = doc(db, "accounts", transactionData.fromAccountId);
        batch.update(accountRef, {
          balance: increment(-transactionData.amount),
          updatedAt: serverTimestamp(),
        });

        affectedAccountId = transactionData.fromAccountId;

        const accountData = await this.getAccountById(
          userId,
          transactionData.fromAccountId
        );
        if (accountData) {
          affectedAccountName = accountData.name;
          newBalance = accountData.balance - transactionData.amount;
        }
      } else if (
        transactionData.type === "income" &&
        transactionData.toAccountId
      ) {
        const accountRef = doc(db, "accounts", transactionData.toAccountId);
        batch.update(accountRef, {
          balance: increment(transactionData.amount),
          updatedAt: serverTimestamp(),
        });

        affectedAccountId = transactionData.toAccountId;

        const accountData = await this.getAccountById(
          userId,
          transactionData.toAccountId
        );
        if (accountData) {
          affectedAccountName = accountData.name;
          newBalance = accountData.balance + transactionData.amount;
        }
      } else if (transactionData.type === "goal_payment") {
        if (transactionData.fromAccountId) {
          const accountRef = doc(db, "accounts", transactionData.fromAccountId);
          batch.update(accountRef, {
            balance: increment(-transactionData.amount),
            updatedAt: serverTimestamp(),
          });

          affectedAccountId = transactionData.fromAccountId;
          const accountData = await this.getAccountById(
            userId,
            transactionData.fromAccountId
          );
          if (accountData) {
            affectedAccountName = accountData.name;
            newBalance = accountData.balance - transactionData.amount;
          }

          if (transactionData.goalId) {
            await GoalNotificationService.updateGoalProgress(
              userId,
              transactionData.goalId,
              transactionData.amount
            );
          }
        } else if (transactionData.toAccountId) {
          const accountRef = doc(db, "accounts", transactionData.toAccountId);
          batch.update(accountRef, {
            balance: increment(transactionData.amount),
            updatedAt: serverTimestamp(),
          });

          affectedAccountId = transactionData.toAccountId;
          const accountData = await this.getAccountById(
            userId,
            transactionData.toAccountId
          );
          if (accountData) {
            affectedAccountName = accountData.name;
            newBalance = accountData.balance + transactionData.amount;
          }
        }
      } else if (
        transactionData.type === "transfer" &&
        transactionData.fromAccountId &&
        transactionData.toAccountId
      ) {
        const fromAccountRef = doc(
          db,
          "accounts",
          transactionData.fromAccountId
        );
        batch.update(fromAccountRef, {
          balance: increment(-transactionData.amount),
          updatedAt: serverTimestamp(),
        });

        const toAccountRef = doc(db, "accounts", transactionData.toAccountId);
        batch.update(toAccountRef, {
          balance: increment(transactionData.amount),
          updatedAt: serverTimestamp(),
        });

        affectedAccountId = transactionData.fromAccountId;
        const fromAccountData = await this.getAccountById(
          userId,
          transactionData.fromAccountId
        );
        if (fromAccountData) {
          affectedAccountName = fromAccountData.name;
          newBalance = fromAccountData.balance - transactionData.amount;
        }
      }

      await batch.commit();
      console.log("✅ Transaction created with ID:", transactionRef.id);

      await this.sendTransactionNotifications(
        userId,
        transactionData,
        affectedAccountId,
        affectedAccountName,
        newBalance
      );

      return transactionRef.id;
    } catch (error) {
      console.error("❌ Error creating transaction:", error);
      throw error;
    }
  }

  private static async sendTransactionNotifications(
    userId: string,
    transactionData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt"
    >,
    affectedAccountId: string | null,
    affectedAccountName: string,
    newBalance: number
  ): Promise<void> {
    try {
      const transactionType = this.getTransactionNotificationType(
        transactionData.type,
        transactionData.amount
      );
      const categoryName = await this.getCategoryName(
        transactionData.categoryId
      );

      await NotificationService.notifyTransaction(
        transactionData.amount,
        transactionType,
        categoryName || transactionData.description
      );

      await BalanceNotificationService.checkLargeTransaction(
        transactionData.amount,
        affectedAccountName,
        transactionType
      );

      if (
        transactionData.type === "expense" ||
        (transactionData.type === "goal_payment" &&
          transactionData.fromAccountId)
      ) {
        await this.checkDailyLimits(userId, transactionData.amount);
      }

      if (
        affectedAccountId &&
        affectedAccountName &&
        (transactionData.type === "expense" ||
          transactionData.type === "goal_payment")
      ) {
        await BalanceNotificationService.checkLowBalance(
          userId,
          affectedAccountId,
          newBalance,
          affectedAccountName
        );
      }

      if (
        affectedAccountId &&
        (transactionData.type === "expense" ||
          (transactionData.type === "goal_payment" &&
            transactionData.fromAccountId))
      ) {
        await this.checkAccountBudget(
          userId,
          affectedAccountId,
          transactionData.amount
        );
      }

      if (
        transactionData.type === "transfer" &&
        transactionData.fromAccountId &&
        transactionData.toAccountId
      ) {
        const fromAccount = await this.getAccountById(
          userId,
          transactionData.fromAccountId
        );
        const toAccount = await this.getAccountById(
          userId,
          transactionData.toAccountId
        );

        if (fromAccount && toAccount) {
          await NotificationService.sendNotification(
            "💳 Transfer Completed",
            `$${transactionData.amount.toFixed(2)} transferred from ${fromAccount.name} to ${toAccount.name}`,
            {
              type: "large_transaction",
              accountId: transactionData.fromAccountId,
              accountName: fromAccount.name,
              amount: transactionData.amount,
            }
          );
        }
      }

      console.log("✅ All transaction notifications sent");
    } catch (error) {
      console.error("❌ Error sending transaction notifications:", error);
    }
  }

  private static getTransactionNotificationType(
    type: Transaction["type"],
    amount: number
  ): "income" | "expense" {
    switch (type) {
      case "income":
        return "income";
      case "expense":
        return "expense";
      case "goal_payment":
        return amount > 0 ? "income" : "expense";
      case "transfer":
        return "expense";
      default:
        return amount > 0 ? "income" : "expense";
    }
  }

  private static async checkDailyLimits(
    userId: string,
    expenseAmount: number
  ): Promise<void> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const todayTransactions = await this.getTransactionsByDateRange(
        userId,
        today,
        endOfDay
      );
      const todaySpent = todayTransactions
        .filter(
          (t) =>
            t.type === "expense" ||
            (t.type === "goal_payment" && t.fromAccountId)
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const dailyLimit = await this.getUserDailyLimit(userId);

      if (todaySpent >= dailyLimit) {
        await NotificationService.notifyDailyLimit(
          todaySpent,
          dailyLimit,
          "exceeded"
        );
      } else if (todaySpent >= dailyLimit * 0.8) {
        await NotificationService.notifyDailyLimit(
          todaySpent,
          dailyLimit,
          "warning"
        );
      }
    } catch (error) {
      console.error("❌ Error checking daily limits:", error);
    }
  }

  private static async checkAccountBudget(
    userId: string,
    accountId: string,
    expenseAmount: number
  ): Promise<void> {
    try {
      const account = await this.getAccountById(userId, accountId);
      if (!account?.budget || account.budget <= 0) return;

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(0);
      monthEnd.setHours(23, 59, 59, 999);

      const monthTransactions = await this.getUserTransactions(userId, {
        accountId: accountId,
        startDate: monthStart,
        endDate: monthEnd,
      });

      const monthSpent = monthTransactions
        .filter(
          (t) =>
            t.type === "expense" ||
            (t.type === "goal_payment" && t.fromAccountId === accountId)
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const budget = account.budget;
      const percentage = Math.round((monthSpent / budget) * 100);

      if (monthSpent >= budget) {
        await NotificationService.sendNotification(
          "💳 Budget Exceeded",
          `Your ${account.name} account has exceeded its monthly budget. Spent: $${monthSpent.toFixed(2)} of $${budget}`,
          {
            type: "budget_exceeded",
            accountId,
            accountName: account.name,
            spent: monthSpent,
            budget,
          }
        );
      } else if (percentage >= 80) {
        await NotificationService.sendNotification(
          "⚠️ Budget Warning",
          `You've used ${percentage}% of your ${account.name} budget ($${monthSpent.toFixed(2)} of $${budget})`,
          {
            type: "budget_warning",
            accountId,
            accountName: account.name,
            spent: monthSpent,
            budget,
            percentage,
          }
        );
      }
    } catch (error) {
      console.error("❌ Error checking account budget:", error);
    }
  }

  private static async getUserDailyLimit(userId: string): Promise<number> {
    try {
      return 100;
    } catch (error) {
      console.error("❌ Error getting user daily limit:", error);
      return 100;
    }
  }

  private static async getAccountById(
    userId: string,
    accountId: string
  ): Promise<any> {
    try {
      const accountsQuery = query(
        collection(db, "accounts"),
        where("userId", "==", userId),
        where("id", "==", accountId)
      );

      const querySnapshot = await getDocs(accountsQuery);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data();
      }

      return null;
    } catch (error) {
      console.error("❌ Error getting account:", error);
      return null;
    }
  }

  private static async getCategoryName(
    categoryId?: string
  ): Promise<string | null> {
    if (!categoryId) return null;

    try {
      const categoryQuery = query(
        collection(db, "categories"),
        where("id", "==", categoryId)
      );

      const querySnapshot = await getDocs(categoryQuery);

      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data().name;
      }

      return null;
    } catch (error) {
      console.error("❌ Error getting category name:", error);
      return null;
    }
  }

  static async getUserTransactions(
    userId: string,
    options?: {
      accountId?: string;
      categoryId?: string;
      type?: Transaction["type"];
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Transaction[]> {
    try {
      console.log(
        "🔍 Fetching transactions for user:",
        userId,
        "with options:",
        options
      );

      let q = query(
        collection(db, "transactions"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      console.log("✅ Found", querySnapshot.docs.length, "total transactions");

      let transactions = querySnapshot.docs.map(
        (doc) =>
          ({
            ...doc.data(),
            id: doc.id,
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            date: doc.data().date?.toDate() || new Date(),
          }) as Transaction
      );

      if (options?.type) {
        transactions = transactions.filter((t) => t.type === options.type);
      }

      if (options?.accountId) {
        transactions = transactions.filter(
          (t) =>
            t.fromAccountId === options.accountId ||
            t.toAccountId === options.accountId
        );
      }

      if (options?.categoryId) {
        transactions = transactions.filter(
          (t) => t.categoryId === options.categoryId
        );
      }

      if (options?.startDate) {
        transactions = transactions.filter((t) => t.date >= options.startDate!);
      }

      if (options?.endDate) {
        transactions = transactions.filter((t) => t.date <= options.endDate!);
      }

      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      if (options?.limit) {
        transactions = transactions.slice(0, options.limit);
      }

      console.log("✅ Returning", transactions.length, "filtered transactions");
      return transactions;
    } catch (error) {
      console.error("❌ Error fetching transactions:", error);
      throw error;
    }
  }

  static async updateTransaction(
    transactionId: string,
    updateData: Partial<Omit<Transaction, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    try {
      const transactionRef = doc(db, "transactions", transactionId);
      await updateDoc(transactionRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      if (
        updateData.amount ||
        updateData.description ||
        updateData.categoryId
      ) {
        await NotificationService.sendNotification(
          "📝 Transaction Updated",
          `A transaction has been modified${updateData.description ? ": " + updateData.description : ""}`,
          {
            type: "transaction",
            amount: updateData.amount || 0,
            category: updateData.categoryId,
            transactionType: "expense",
          }
        );
      }

      console.log("✅ Transaction updated:", transactionId);
    } catch (error) {
      console.error("❌ Error updating transaction:", error);
      throw error;
    }
  }

  static async deleteTransaction(transactionId: string): Promise<void> {
    const batch = writeBatch(db);

    try {
      const transactionRef = doc(db, "transactions", transactionId);
      const transactionDoc = await getDocs(
        query(collection(db, "transactions"), where("id", "==", transactionId))
      );

      if (transactionDoc.empty) {
        throw new Error("Transaction not found");
      }

      const transaction = transactionDoc.docs[0].data() as Transaction;

      if (transaction.type === "expense" && transaction.fromAccountId) {
        const accountRef = doc(db, "accounts", transaction.fromAccountId);
        batch.update(accountRef, {
          balance: increment(transaction.amount),
          updatedAt: serverTimestamp(),
        });
      } else if (transaction.type === "income" && transaction.toAccountId) {
        const accountRef = doc(db, "accounts", transaction.toAccountId);
        batch.update(accountRef, {
          balance: increment(-transaction.amount),
          updatedAt: serverTimestamp(),
        });
      } else if (
        transaction.type === "transfer" &&
        transaction.fromAccountId &&
        transaction.toAccountId
      ) {
        const fromAccountRef = doc(db, "accounts", transaction.fromAccountId);
        batch.update(fromAccountRef, {
          balance: increment(transaction.amount),
          updatedAt: serverTimestamp(),
        });

        const toAccountRef = doc(db, "accounts", transaction.toAccountId);
        batch.update(toAccountRef, {
          balance: increment(-transaction.amount),
          updatedAt: serverTimestamp(),
        });
      }

      batch.update(transactionRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      await NotificationService.sendNotification(
        "🗑️ Transaction Deleted",
        `A ${transaction.type} of $${Math.abs(transaction.amount).toFixed(2)} has been removed`,
        {
          type: "transaction",
          amount: transaction.amount,
          category: transaction.categoryId,
          transactionType: transaction.amount > 0 ? "income" : "expense",
        }
      );

      console.log("✅ Transaction deleted:", transactionId);
    } catch (error) {
      console.error("❌ Error deleting transaction:", error);
      throw error;
    }
  }

  static async getTransactionsByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Transaction[]> {
    return this.getUserTransactions(userId, {
      startDate,
      endDate,
    });
  }

  static async getRecentTransactions(
    userId: string,
    limit: number = 10
  ): Promise<Transaction[]> {
    return this.getUserTransactions(userId, { limit });
  }

  static subscribeToTransactions(
    userId: string,
    callback: (transactions: Transaction[]) => void,
    limitCount: number = 50
  ): () => void {
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const transactions = querySnapshot.docs
          .map(
            (doc) =>
              ({
                ...doc.data(),
                id: doc.id,
                date: doc.data().date?.toDate() || new Date(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
              }) as Transaction
          )
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, limitCount);

        callback(transactions);
      },
      (error) => {
        console.error("❌ Error in transactions listener:", error);
      }
    );
  }

  static async checkTodaySpending(userId: string): Promise<{
    spent: number;
    limit: number;
    percentage: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const todayTransactions = await this.getTransactionsByDateRange(
        userId,
        today,
        endOfDay
      );
      const todaySpent = todayTransactions
        .filter(
          (t) =>
            t.type === "expense" ||
            (t.type === "goal_payment" && t.fromAccountId)
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const dailyLimit = await this.getUserDailyLimit(userId);
      const percentage = Math.round((todaySpent / dailyLimit) * 100);

      return {
        spent: todaySpent,
        limit: dailyLimit,
        percentage,
      };
    } catch (error) {
      console.error("❌ Error checking today spending:", error);
      return { spent: 0, limit: 100, percentage: 0 };
    }
  }
}
