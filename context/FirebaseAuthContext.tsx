import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { Alert, Platform } from "react-native";
import { auth, db } from "../firebase";
import {
  AuthContextType,
  AuthState,
  User,
  UserLoginData,
  UserRegistrationData,
} from "../types/user";
import { SessionManager } from "../utils/sessionManager";

// Initial state
const initialAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true, // Start with true to check existing auth state
  error: null,
};

// Action types
type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "LOGIN_SUCCESS"; payload: User }
  | { type: "LOGOUT" }
  | { type: "UPDATE_USER"; payload: Partial<User> }
  | { type: "CLEAR_ERROR" };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "LOGIN_SUCCESS":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case "LOGOUT":
      return {
        ...initialAuthState,
        isLoading: false,
      };

    case "UPDATE_USER":
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };

    case "CLEAR_ERROR":
      return { ...state, error: null };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | null>(null);

// Helper function to convert Firebase user to our User type
const convertFirebaseUser = async (
  firebaseUser: FirebaseUser,
  additionalData?: any
): Promise<User> => {
  const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
  const userData = userDoc.data();

  return {
    id: firebaseUser.uid,
    fullName: userData?.fullName || firebaseUser.displayName || "",
    email: firebaseUser.email || "",
    profilePicture:
      userData?.profilePicture || firebaseUser.photoURL || undefined,
    dateJoined: userData?.dateJoined
      ? userData.dateJoined.toDate()
      : new Date(),
    isActive: true,
    authProvider:
      additionalData?.authProvider || userData?.authProvider || "email",
    preferences: userData?.preferences || {
      currency: "USD",
      notifications: true,
      darkMode: true,
    },
  };
};

// Helper function to save user to Firestore
const saveUserToFirestore = async (user: User): Promise<void> => {
  await setDoc(
    doc(db, "users", user.id),
    {
      fullName: user.fullName,
      email: user.email,
      profilePicture: user.profilePicture,
      dateJoined: Timestamp.fromDate(user.dateJoined),
      isActive: user.isActive,
      authProvider: user.authProvider,
      preferences: user.preferences,
    },
    { merge: true }
  );
};

// Validation functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 6;
};

// Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, dispatch] = useReducer(authReducer, initialAuthState);

  // Listen to Firebase auth state changes and check stored sessions
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const initializeAuth = async () => {
      try {
        // First, check if we have a valid stored session
        const validSession = await SessionManager.getValidSession();

        if (validSession) {
          console.log(
            `🔄 Valid session found for ${validSession.email}, checking Firebase auth...`
          );

          // If we have a valid session, set up Firebase auth listener
          unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              try {
                const user = await convertFirebaseUser(firebaseUser);
                dispatch({ type: "LOGIN_SUCCESS", payload: user });
                console.log("✅ User restored from session");
              } catch (error) {
                console.error("Error converting Firebase user:", error);
                // If conversion fails, clear the session
                await SessionManager.clearSession();
                dispatch({
                  type: "SET_ERROR",
                  payload: "Failed to load user data",
                });
              }
            } else {
              // Firebase user not found but session exists - session is invalid
              console.log(
                "⚠️ Session exists but Firebase user not found, clearing session"
              );
              await SessionManager.clearSession();
              dispatch({ type: "LOGOUT" });
            }
          });
        } else {
          console.log(
            "🔍 No valid session found, setting up fresh auth listener"
          );

          // No valid session, set up normal auth listener
          unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
              try {
                const user = await convertFirebaseUser(firebaseUser);
                // Save new session when user is authenticated
                await SessionManager.saveSession(
                  firebaseUser.uid,
                  firebaseUser.email || ""
                );
                dispatch({ type: "LOGIN_SUCCESS", payload: user });
              } catch (error) {
                console.error("Error converting Firebase user:", error);
                dispatch({
                  type: "SET_ERROR",
                  payload: "Failed to load user data",
                });
              }
            } else {
              dispatch({ type: "LOGOUT" });
            }
          });
        }
      } catch (error) {
        console.error("Error initializing auth:", error);
        dispatch({ type: "LOGOUT" });
      }
    };

    initializeAuth();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  // Register function
  const register = async (
    registrationData: UserRegistrationData
  ): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const { fullName, email, password, confirmPassword } = registrationData;

      // Validation
      if (!fullName.trim()) {
        dispatch({ type: "SET_ERROR", payload: "Full name is required" });
        return false;
      }

      if (!validateEmail(email)) {
        dispatch({
          type: "SET_ERROR",
          payload: "Please enter a valid email address",
        });
        return false;
      }

      if (!validatePassword(password)) {
        dispatch({
          type: "SET_ERROR",
          payload: "Password must be at least 6 characters long",
        });
        return false;
      }

      if (password !== confirmPassword) {
        dispatch({ type: "SET_ERROR", payload: "Passwords do not match" });
        return false;
      }

      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

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

      await saveUserToFirestore(newUser);

      return true;
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

      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return false;
    }
  };

  // Login function
  const login = async (loginData: UserLoginData): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      const { email, password } = loginData;

      // Validation
      if (!validateEmail(email)) {
        dispatch({
          type: "SET_ERROR",
          payload: "Please enter a valid email address",
        });
        return false;
      }

      if (!password) {
        dispatch({ type: "SET_ERROR", payload: "Password is required" });
        return false;
      }

      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Save session for 10 days
      await SessionManager.saveSession(
        userCredential.user.uid,
        userCredential.user.email || ""
      );

      return true;
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

      dispatch({ type: "SET_ERROR", payload: errorMessage });
      return false;
    }
  };

  // Google Sign-In function (disabled in development)
  const signInWithGoogle = async (): Promise<boolean> => {
    try {
      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      Alert.alert(
        "Social Sign-In Not Available",
        "Google Sign-In is only available in production builds. Please use email and password to sign in during development.",
        [
          {
            text: "OK",
            onPress: () => dispatch({ type: "SET_LOADING", payload: false }),
          },
        ]
      );

      return false;
    } catch (error: any) {
      console.error("Google Sign-In error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Google Sign-In is not available in development mode",
      });
      return false;
    }
  };

  // Apple Sign-In function (disabled in development)
  const signInWithApple = async (): Promise<boolean> => {
    try {
      if (Platform.OS !== "ios") {
        dispatch({
          type: "SET_ERROR",
          payload: "Apple Sign-In is only available on iOS",
        });
        return false;
      }

      dispatch({ type: "SET_LOADING", payload: true });
      dispatch({ type: "CLEAR_ERROR" });

      Alert.alert(
        "Social Sign-In Not Available",
        "Apple Sign-In is only available in production builds. Please use email and password to sign in during development.",
        [
          {
            text: "OK",
            onPress: () => dispatch({ type: "SET_LOADING", payload: false }),
          },
        ]
      );

      return false;
    } catch (error: any) {
      console.error("Apple Sign-In error:", error);
      dispatch({
        type: "SET_ERROR",
        payload: "Apple Sign-In is not available in development mode",
      });
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await signOut(auth);
      // Clear stored session
      await SessionManager.clearSession();
      console.log("✅ User logged out and session cleared");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Clear error function
  const clearError = (): void => {
    dispatch({ type: "CLEAR_ERROR" });
  };

  // Update user function
  const updateUser = async (userData: Partial<User>): Promise<void> => {
    try {
      if (!authState.user) return;

      const updatedUser = { ...authState.user, ...userData };

      // Update in Firestore
      await updateDoc(doc(db, "users", updatedUser.id), {
        ...userData,
        dateJoined: userData.dateJoined
          ? Timestamp.fromDate(userData.dateJoined)
          : undefined,
      });

      dispatch({ type: "UPDATE_USER", payload: userData });
    } catch (error) {
      console.error("Update user error:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to update user profile" });
    }
  };

  const contextValue: AuthContextType = {
    authState,
    login,
    register,
    signInWithGoogle,
    signInWithApple,
    logout,
    clearError,
    updateUser,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
