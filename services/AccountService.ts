import {
  addDoc,
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
import { Account } from "../types/finance";

// Define the 6 default accounts directly in the service
const DEFAULT_ACCOUNTS = [
  {
    name: "Main Account",
    type: "main" as const,
    currency: "USD",
    isActive: true,
    description: "Primary account for daily transactions",
    color: "#4ECDC4",
    icon: "wallet",
  },
  {
    name: "Savings Account",
    type: "savings" as const,
    currency: "USD",
    isActive: true,
    description: "Long-term savings and emergency fund",
    color: "#45B7D1",
    icon: "save",
  },
  {
    name: "Expenses Account",
    type: "expenses" as const,
    currency: "USD",
    isActive: true,
    description: "Dedicated account for planned expenses",
    color: "#96CEB4",
    icon: "card",
  },
  {
    name: "Investment Account",
    type: "custom" as const,
    currency: "USD",
    isActive: true,
    description: "Investment fund for long-term growth",
    color: "#FF6B6B",
    icon: "trending-up",
  },
  {
    name: "Emergency Fund",
    type: "custom" as const,
    currency: "USD",
    isActive: true,
    description: "Emergency fund for unexpected expenses",
    color: "#FFA726",
    icon: "shield",
  },
  {
    name: "Goals & Dreams",
    type: "custom" as const,
    currency: "USD",
    isActive: true,
    description: "Saving for personal goals and aspirations",
    color: "#AB47BC",
    icon: "star",
  },
];

export class AccountService {
  /**
   * Get all accounts for a user
   */
  static async getUserAccounts(userId: string): Promise<Account[]> {
    try {
      console.log("🔍 Fetching accounts for user:", userId);

      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, "accounts"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      console.log("✅ Found", querySnapshot.docs.length, "total accounts");

      // Filter and sort in memory to avoid index requirement
      const accounts = querySnapshot.docs
        .map(
          (doc) =>
            ({
              ...doc.data(),
              id: doc.id,
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            }) as Account
        )
        .filter((account) => account.isActive)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      console.log(
        "✅ Found",
        accounts.length,
        "active accounts after filtering"
      );

      return accounts;
    } catch (error) {
      console.error("❌ Error fetching accounts:", error);
      console.error("🔍 Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        userId: userId,
      });
      throw error;
    }
  }

  /**
   * Create a new custom account
   */
  static async createAccount(
    userId: string,
    accountData: Omit<Account, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "accounts"), {
        ...accountData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Account created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating account:", error);
      throw error;
    }
  }

  /**
   * Update account balance (usually called after transactions)
   */
  static async updateAccountBalance(
    accountId: string,
    amount: number
  ): Promise<void> {
    try {
      const accountRef = doc(db, "accounts", accountId);
      await updateDoc(accountRef, {
        balance: increment(amount),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Account balance updated:", accountId, "by", amount);
    } catch (error) {
      console.error("❌ Error updating account balance:", error);
      throw error;
    }
  }

  /**
   * Update account details
   */
  static async updateAccount(
    accountId: string,
    updateData: Partial<Omit<Account, "id" | "userId" | "createdAt">>
  ): Promise<void> {
    try {
      const accountRef = doc(db, "accounts", accountId);
      await updateDoc(accountRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Account updated:", accountId);
    } catch (error) {
      console.error("❌ Error updating account:", error);
      throw error;
    }
  }

  /**
   * Soft delete an account (mark as inactive)
   */
  static async deleteAccount(accountId: string): Promise<void> {
    try {
      const accountRef = doc(db, "accounts", accountId);
      await updateDoc(accountRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Account deactivated:", accountId);
    } catch (error) {
      console.error("❌ Error deactivating account:", error);
      throw error;
    }
  }

  /**
   * Listen to account changes in real-time
   */
  static subscribeToAccounts(
    userId: string,
    callback: (accounts: Account[]) => void
  ): () => void {
    // Simplified query to avoid composite index requirement
    const q = query(collection(db, "accounts"), where("userId", "==", userId));

    return onSnapshot(
      q,
      (querySnapshot) => {
        // Filter and sort in memory to avoid index requirement
        const accounts = querySnapshot.docs
          .map(
            (doc) =>
              ({
                ...doc.data(),
                id: doc.id,
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date(),
              }) as Account
          )
          .filter((account) => account.isActive)
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

        callback(accounts);
      },
      (error) => {
        console.error("❌ Error in accounts listener:", error);
      }
    );
  }

  /**
   * Transfer money between accounts
   */
  static async transferBetweenAccounts(
    fromAccountId: string,
    toAccountId: string,
    amount: number,
    description?: string
  ): Promise<void> {
    if (amount <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }

    if (fromAccountId === toAccountId) {
      throw new Error("Cannot transfer to the same account");
    }

    const batch = writeBatch(db);

    try {
      console.log("🔄 Starting transfer:", {
        fromAccountId,
        toAccountId,
        amount,
      });

      // Get current balances to validate transfer
      const fromAccountRef = doc(db, "accounts", fromAccountId);
      const toAccountRef = doc(db, "accounts", toAccountId);

      // Update account balances
      batch.update(fromAccountRef, {
        balance: increment(-amount),
        updatedAt: serverTimestamp(),
      });

      batch.update(toAccountRef, {
        balance: increment(amount),
        updatedAt: serverTimestamp(),
      });

      await batch.commit();

      console.log("✅ Transfer completed successfully");
    } catch (error) {
      console.error("❌ Error transferring between accounts:", error);
      throw error;
    }
  }

  /**
   * Initialize accounts with budget allocation for new users
   */
  static async initializeAccountsWithBudget(
    userId: string,
    monthlyBudget: number
  ): Promise<void> {
    const batch = writeBatch(db);

    try {
      console.log(
        "💰 Initializing accounts with comprehensive 6-account budget allocation:",
        monthlyBudget
      );

      // Calculate allocations using smart budgeting principles
      const mainAllocation = monthlyBudget * 0.35; // 35% - Primary spending
      const savingsAllocation = monthlyBudget * 0.2; // 20% - General savings
      const expensesAllocation = monthlyBudget * 0.25; // 25% - Monthly expenses
      const investmentAllocation = monthlyBudget * 0.1; // 10% - Investment fund
      const emergencyAllocation = monthlyBudget * 0.05; // 5% - Emergency fund
      const goalsAllocation = monthlyBudget * 0.05; // 5% - Goals and dreams

      // Create all 6 accounts with allocated amounts
      const accountsWithBudget = [
        {
          ...DEFAULT_ACCOUNTS[0], // Main Account
          balance: mainAllocation,
        },
        {
          ...DEFAULT_ACCOUNTS[1], // Savings Account
          balance: savingsAllocation,
        },
        {
          ...DEFAULT_ACCOUNTS[2], // Expenses Account
          balance: expensesAllocation,
        },
        {
          ...DEFAULT_ACCOUNTS[3], // Investment Account
          balance: investmentAllocation,
        },
        {
          ...DEFAULT_ACCOUNTS[4], // Emergency Fund
          balance: emergencyAllocation,
        },
        {
          ...DEFAULT_ACCOUNTS[5], // Goals & Dreams
          balance: goalsAllocation,
        },
      ];

      for (const accountData of accountsWithBudget) {
        const accountRef = doc(collection(db, "accounts"));
        batch.set(accountRef, {
          ...accountData,
          id: accountRef.id,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      console.log("✅ Accounts initialized with budget allocation");
    } catch (error) {
      console.error("❌ Error initializing accounts with budget:", error);
      throw error;
    }
  }
}
