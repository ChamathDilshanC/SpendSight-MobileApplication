import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  UserCredential,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/firebase";
import { User } from "../types/user";
import { SessionManager } from "../utils/sessionManager";

// Auth Service Class
export class AuthService {
  // Register a new user with email and password
  static async register(
    fullName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Create user with Firebase Auth
      const userCredential: UserCredential =
        await createUserWithEmailAndPassword(auth, email, password);

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: fullName,
      });

      // Create user document in Firestore
      const newUser: User = {
        id: userCredential.user.uid,
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        dateJoined: new Date(),
        isActive: true,
        authProvider: "email",
        preferences: {
          currency: "USD",
          notifications: true,
          darkMode: true,
        },
      };

      // Save to Firestore
      console.log("💾 Saving user to Firestore...", { userId: newUser.id });
      try {
        await setDoc(doc(db, "users", newUser.id), {
          ...newUser,
          dateJoined: Timestamp.fromDate(newUser.dateJoined),
        });
        console.log("✅ User saved to Firestore successfully");
      } catch (firestoreError: any) {
        console.error("❌ Firestore save failed:", firestoreError);
        console.warn(
          "⚠️ User created in Auth but not in Firestore. Check Firebase security rules."
        );
      }

      return { success: true, user: newUser };
    } catch (error: any) {
      console.error("Registration error:", error);

      let errorMessage = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use") {
        errorMessage = "An account with this email already exists";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password is too weak";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      }

      return { success: false, error: errorMessage };
    }
  }

  // Login with email and password
  static async login(
    email: string,
    password: string
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Sign in with Firebase
      const userCredential: UserCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      const userData = userDoc.data();

      if (!userData) {
        return { success: false, error: "User data not found" };
      }

      const user: User = {
        id: userCredential.user.uid,
        fullName: userData.fullName || userCredential.user.displayName || "",
        email: userCredential.user.email || "",
        profilePicture:
          userData.profilePicture || userCredential.user.photoURL || undefined,
        dateJoined: userData.dateJoined
          ? userData.dateJoined.toDate()
          : new Date(),
        isActive: userData.isActive ?? true,
        authProvider: userData.authProvider || "email",
        preferences: userData.preferences || {
          currency: "USD",
          notifications: true,
          darkMode: true,
        },
      };

      // Save session for 10 days
      await SessionManager.saveSession(user.id, user.email);

      return { success: true, user };
    } catch (error: any) {
      console.error("Login error:", error);

      let errorMessage = "Login failed. Please try again.";
      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address";
      } else if (error.code === "auth/wrong-password") {
        errorMessage = "Incorrect password";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      } else if (error.code === "auth/invalid-credential") {
        errorMessage = "Invalid email or password";
      }

      return { success: false, error: errorMessage };
    }
  }

  // Logout
  static async logout(): Promise<{ success: boolean; error?: string }> {
    try {
      await signOut(auth);
      // Clear stored session
      await SessionManager.clearSession();
      console.log("✅ User logged out and session cleared");
      return { success: true };
    } catch (error: any) {
      console.error("Logout error:", error);
      return { success: false, error: "Failed to logout" };
    }
  }

  // Get current user from Firebase
  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  // Convert Firebase user to our User type
  static async convertFirebaseUser(
    firebaseUser: FirebaseUser
  ): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
      const userData = userDoc.data();

      if (!userData) {
        return null;
      }

      return {
        id: firebaseUser.uid,
        fullName: userData.fullName || firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        profilePicture:
          userData.profilePicture || firebaseUser.photoURL || undefined,
        dateJoined: userData.dateJoined
          ? userData.dateJoined.toDate()
          : new Date(),
        isActive: userData.isActive ?? true,
        authProvider: userData.authProvider || "email",
        preferences: userData.preferences || {
          currency: "USD",
          notifications: true,
          darkMode: true,
        },
      };
    } catch (error) {
      console.error("Error converting Firebase user:", error);
      return null;
    }
  }
}

// Validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

export const validateFullName = (fullName: string): boolean => {
  return fullName.trim().length >= 2;
};
