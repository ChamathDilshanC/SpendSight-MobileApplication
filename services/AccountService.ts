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
import { Account, DefaultAccounts } from "../types/finance";

export class AccountService {
  /**
   * Initialize default accounts for a new user
   */
  static async initializeDefaultAccounts(userId: string): Promise<void> {
    const batch = writeBatch(db);

    try {
      // Create default accounts
      for (const accountData of DefaultAccounts) {
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
      console.log("✅ Default accounts initialized for user:", userId);
    } catch (error) {
      console.error("❌ Error initializing default accounts:", error);
      throw error;
    }
  }

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
}
