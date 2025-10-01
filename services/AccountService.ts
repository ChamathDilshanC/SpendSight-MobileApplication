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

export type CurrencyType = "USD" | "LKR";

const getDefaultAccounts = (currency: CurrencyType = "USD") => [
  {
    name: "Main Account",
    type: "main" as const,
    currency,
    isActive: true,
    description: "Primary account for daily transactions",
    color: "#4ECDC4",
    icon: "wallet",
  },
  {
    name: "Savings Account",
    type: "savings" as const,
    currency,
    isActive: true,
    description: "Long-term savings and emergency fund",
    color: "#45B7D1",
    icon: "save",
  },
  {
    name: "Expenses Account",
    type: "expenses" as const,
    currency,
    isActive: true,
    description: "Dedicated account for planned expenses",
    color: "#96CEB4",
    icon: "card",
  },
  {
    name: "Investment Account",
    type: "custom" as const,
    currency,
    isActive: true,
    description: "Investment fund for long-term growth",
    color: "#FF6B6B",
    icon: "trending-up",
  },
  {
    name: "Emergency Fund",
    type: "custom" as const,
    currency,
    isActive: true,
    description: "Emergency fund for unexpected expenses",
    color: "#FFA726",
    icon: "shield",
  },
  {
    name: "Goals & Dreams",
    type: "custom" as const,
    currency,
    isActive: true,
    description: "Saving for personal goals and aspirations",
    color: "#AB47BC",
    icon: "star",
  },
];

export class AccountService {
  static async getUserAccounts(userId: string): Promise<Account[]> {
    try {
      console.log("🔍 Fetching accounts for user:", userId);

      const q = query(
        collection(db, "accounts"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      console.log("✅ Found", querySnapshot.docs.length, "total accounts");

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

  static subscribeToAccounts(
    userId: string,
    callback: (accounts: Account[]) => void
  ): () => void {
    const q = query(collection(db, "accounts"), where("userId", "==", userId));

    return onSnapshot(
      q,
      (querySnapshot) => {
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

      const fromAccountRef = doc(db, "accounts", fromAccountId);
      const toAccountRef = doc(db, "accounts", toAccountId);

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

  static async initializeAccountsWithBudget(
    userId: string,
    monthlyBudget: number,
    currency: CurrencyType = "USD"
  ): Promise<void> {
    const batch = writeBatch(db);

    try {
      console.log(
        "💰 Initializing accounts with comprehensive 6-account budget allocation:",
        monthlyBudget,
        currency
      );

      const mainAllocation = monthlyBudget * 0.35;
      const savingsAllocation = monthlyBudget * 0.2;
      const expensesAllocation = monthlyBudget * 0.25;
      const investmentAllocation = monthlyBudget * 0.1;
      const emergencyAllocation = monthlyBudget * 0.05;
      const goalsAllocation = monthlyBudget * 0.05;

      const defaultAccounts = getDefaultAccounts(currency);

      const accountsWithBudget = [
        {
          ...defaultAccounts[0],
          balance: mainAllocation,
        },
        {
          ...defaultAccounts[1],
          balance: savingsAllocation,
        },
        {
          ...defaultAccounts[2],
          balance: expensesAllocation,
        },
        {
          ...defaultAccounts[3],
          balance: investmentAllocation,
        },
        {
          ...defaultAccounts[4],
          balance: emergencyAllocation,
        },
        {
          ...defaultAccounts[5],
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
      console.log(
        "✅ Accounts initialized with budget allocation in",
        currency
      );
    } catch (error) {
      console.error("❌ Error initializing accounts with budget:", error);
      throw error;
    }
  }

  static async convertUserAccountsCurrency(
    userId: string,
    toCurrency: CurrencyType,
    exchangeRate: number
  ): Promise<void> {
    const batch = writeBatch(db);

    try {
      console.log(
        "💱 Converting user accounts to",
        toCurrency,
        "with rate:",
        exchangeRate
      );

      const accounts = await this.getUserAccounts(userId);

      for (const account of accounts) {
        if (account.currency !== toCurrency) {
          const convertedBalance = account.balance * exchangeRate;

          const accountRef = doc(db, "accounts", account.id);
          batch.update(accountRef, {
            currency: toCurrency,
            balance: convertedBalance,
            updatedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      console.log("✅ All accounts converted to", toCurrency);
    } catch (error) {
      console.error("❌ Error converting accounts currency:", error);
      throw error;
    }
  }

  static formatCurrency(amount: number, currency?: CurrencyType): string {
    const currencyToUse = currency || "USD";
    const symbol = this.getCurrencySymbol(currencyToUse);

    const formattedAmount = amount.toFixed(2);
    const parts = formattedAmount.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = parts.join(".");

    if (currencyToUse === "LKR") {
      return `Rs. ${formatted}`;
    } else {
      return `$${formatted}`;
    }
  }

  static getCurrencySymbol(currency: CurrencyType): string {
    return currency === "LKR" ? "Rs." : "$";
  }
}
