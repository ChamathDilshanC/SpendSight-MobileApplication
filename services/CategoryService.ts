import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { Category, DefaultCategories } from "../types/finance";

export class CategoryService {
  /**
   * Initialize default categories for a new user
   */
  static async initializeDefaultCategories(userId: string): Promise<void> {
    const batch = writeBatch(db);

    try {
      // Create default categories
      for (const categoryData of DefaultCategories) {
        const categoryRef = doc(collection(db, "categories"));
        batch.set(categoryRef, {
          ...categoryData,
          id: categoryRef.id,
          userId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      await batch.commit();
      console.log("✅ Default categories initialized for user:", userId);
    } catch (error) {
      console.error("❌ Error initializing default categories:", error);
      throw error;
    }
  }

  /**
   * Get all categories for a user
   */
  static async getUserCategories(userId: string): Promise<Category[]> {
    try {
      console.log("🔍 Fetching categories for user:", userId);

      // Simplified query to avoid composite index requirement
      const q = query(
        collection(db, "categories"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(q);
      console.log("✅ Found", querySnapshot.docs.length, "categories");

      // Sort in memory to avoid index requirement
      const categories = querySnapshot.docs
        .map(
          (doc) =>
            ({
              ...doc.data(),
              id: doc.id,
              createdAt: doc.data().createdAt?.toDate() || new Date(),
              updatedAt: doc.data().updatedAt?.toDate() || new Date(),
            }) as Category
        )
        .sort((a, b) => {
          // First sort by isDefault (default categories first)
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          // Then sort by name
          return a.name.localeCompare(b.name);
        });

      console.log("✅ Categories sorted and returned:", categories.length);
      return categories;
    } catch (error) {
      console.error("❌ Error fetching categories:", error);
      console.error("🔍 Error details:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        userId: userId,
      });
      throw error;
    }
  }

  /**
   * Create a new custom category
   */
  static async createCategory(
    userId: string,
    categoryData: Omit<Category, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, "categories"), {
        ...categoryData,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Category created with ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating category:", error);
      throw error;
    }
  }

  /**
   * Update category details
   */
  static async updateCategory(
    categoryId: string,
    updateData: Partial<
      Omit<Category, "id" | "userId" | "createdAt" | "isDefault">
    >
  ): Promise<void> {
    try {
      const categoryRef = doc(db, "categories", categoryId);
      await updateDoc(categoryRef, {
        ...updateData,
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Category updated:", categoryId);
    } catch (error) {
      console.error("❌ Error updating category:", error);
      throw error;
    }
  }

  /**
   * Delete a category (only custom categories can be deleted)
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    try {
      const categoryRef = doc(db, "categories", categoryId);
      // Note: In a real implementation, you might want to check if the category
      // is being used in any transactions before deleting
      await updateDoc(categoryRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      console.log("✅ Category deactivated:", categoryId);
    } catch (error) {
      console.error("❌ Error deactivating category:", error);
      throw error;
    }
  }

  /**
   * Get categories by type (income/expense)
   */
  static async getCategoriesByType(
    userId: string,
    type: "income" | "expense"
  ): Promise<Category[]> {
    try {
      const allCategories = await this.getUserCategories(userId);
      return allCategories.filter((category) => category.type === type);
    } catch (error) {
      console.error("❌ Error fetching categories by type:", error);
      throw error;
    }
  }

  /**
   * Search categories by name
   */
  static async searchCategories(
    userId: string,
    searchTerm: string
  ): Promise<Category[]> {
    try {
      const allCategories = await this.getUserCategories(userId);
      return allCategories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    } catch (error) {
      console.error("❌ Error searching categories:", error);
      throw error;
    }
  }
}
