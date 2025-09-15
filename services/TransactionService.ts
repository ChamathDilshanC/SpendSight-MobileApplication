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
import { db } from "../firebase";
import { Transaction } from "../types/finance";

export class TransactionService {
  /**
   * Create a new transaction and update account balances
   */
  static async createTransaction(
    userId: string,
    transactionData: Omit<
      Transaction,
      "id" | "userId" | "createdAt" | "updatedAt"
    >
  ): Promise<string> {
    const batch = writeBatch(db);

    try {
      // Create the transaction
      const transactionRef = doc(collection(db, "transactions"));
      batch.set(transactionRef, {
        ...transactionData,
        id: transactionRef.id,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Update account balances
      if (transactionData.type === "expense" && transactionData.fromAccountId) {
        // Deduct from account
        const accountRef = doc(db, "accounts", transactionData.fromAccountId);
        batch.update(accountRef, {
          balance: increment(-transactionData.amount),
          updatedAt: serverTimestamp(),
        });
      } else if (
        transactionData.type === "income" &&
        transactionData.toAccountId
      ) {
        // Add to account
        const accountRef = doc(db, "accounts", transactionData.toAccountId);
        batch.update(accountRef, {
          balance: increment(transactionData.amount),
          updatedAt: serverTimestamp(),
        });
      } else if (
        transactionData.type === "transfer" &&
        transactionData.fromAccountId &&
        transactionData.toAccountId
      ) {
        // Deduct from source account
        const fromAccountRef = doc(
          db,
          "accounts",
          transactionData.fromAccountId
        );
        batch.update(fromAccountRef, {
          balance: increment(-transactionData.amount),
          updatedAt: serverTimestamp(),
        });

        // Add to destination account
        const toAccountRef = doc(db, "accounts", transactionData.toAccountId);
        batch.update(toAccountRef, {
          balance: increment(transactionData.amount),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      console.log("✅ Transaction created with ID:", transactionRef.id);
      return transactionRef.id;
    } catch (error) {
      console.error("❌ Error creating transaction:", error);
      throw error;
    }
  }

  /**
   * Get transactions for a user with optional filters
   */
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

      // Start with just the userId filter to avoid composite index issues
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

      // Apply filters in memory to avoid composite index requirements
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

      // Sort by date descending
      transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

      // Apply limit after all filtering and sorting
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

  /**
   * Update a transaction
   */
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

      console.log("✅ Transaction updated:", transactionId);
    } catch (error) {
      console.error("❌ Error updating transaction:", error);
      throw error;
    }
  }

  /**
   * Delete a transaction (and reverse account balance changes)
   */
  static async deleteTransaction(transactionId: string): Promise<void> {
    const batch = writeBatch(db);

    try {
      // First, get the transaction to reverse the balance changes
      const transactionRef = doc(db, "transactions", transactionId);
      const transactionDoc = await getDocs(
        query(collection(db, "transactions"), where("id", "==", transactionId))
      );

      if (transactionDoc.empty) {
        throw new Error("Transaction not found");
      }

      const transaction = transactionDoc.docs[0].data() as Transaction;

      // Reverse the account balance changes
      if (transaction.type === "expense" && transaction.fromAccountId) {
        // Add back to account (reverse the deduction)
        const accountRef = doc(db, "accounts", transaction.fromAccountId);
        batch.update(accountRef, {
          balance: increment(transaction.amount),
          updatedAt: serverTimestamp(),
        });
      } else if (transaction.type === "income" && transaction.toAccountId) {
        // Deduct from account (reverse the addition)
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
        // Add back to source account
        const fromAccountRef = doc(db, "accounts", transaction.fromAccountId);
        batch.update(fromAccountRef, {
          balance: increment(transaction.amount),
          updatedAt: serverTimestamp(),
        });

        // Deduct from destination account
        const toAccountRef = doc(db, "accounts", transaction.toAccountId);
        batch.update(toAccountRef, {
          balance: increment(-transaction.amount),
          updatedAt: serverTimestamp(),
        });
      }

      // Mark transaction as deleted (soft delete)
      batch.update(transactionRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });

      await batch.commit();
      console.log("✅ Transaction deleted:", transactionId);
    } catch (error) {
      console.error("❌ Error deleting transaction:", error);
      throw error;
    }
  }

  /**
   * Get transactions by date range
   */
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

  /**
   * Get recent transactions
   */
  static async getRecentTransactions(
    userId: string,
    limit: number = 10
  ): Promise<Transaction[]> {
    return this.getUserTransactions(userId, { limit });
  }

  /**
   * Listen to transaction changes in real-time
   */
  static subscribeToTransactions(
    userId: string,
    callback: (transactions: Transaction[]) => void,
    limitCount: number = 50
  ): () => void {
    // Simplified query to avoid composite index requirement
    const q = query(
      collection(db, "transactions"),
      where("userId", "==", userId)
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        // Sort and limit in memory to avoid index requirement
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
}
