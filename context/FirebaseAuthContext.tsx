import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";
import { Alert } from "react-native";

// Firebase Imports
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, Timestamp, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

// Google Sign-In Import
import { GoogleSignin } from "@react-native-google-signin/google-signin";

// Local Imports
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
  isLoading: true,
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
      return { ...initialAuthState, isLoading: false };
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

const AuthContext = createContext<AuthContextType | null>(null);

const convertFirebaseUser = async (
  firebaseUser: FirebaseUser
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
    authProvider: userData?.authProvider || "email",
    preferences: userData?.preferences || {
      currency: "USD",
      notifications: true,
      darkMode: true,
    },
  };
};

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

const validateEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password: string): boolean => password.length >= 6;

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [authState, dispatch] = useReducer(authReducer, initialAuthState);

  useEffect(() => {
    // Only configure Google Sign-In if the module is available (in custom dev builds)
    try {
      GoogleSignin.configure({
        webClientId:
          "45937352137-u6tkuf6i5il66miv1aj1i8g01gr7q6b2.apps.googleusercontent.com", // Web client ID from google-services.json
        iosClientId:
          "45937352137-8p3m4nutcplmojnot778jp6rdbdadind.apps.googleusercontent.com", // iOS client ID from GoogleService-Info.plist
        offlineAccess: true, // Enable to get refresh token
        hostedDomain: "", // Optional: specify domain
        forceCodeForRefreshToken: true, // Force code for refresh token on Android
      });
    } catch (error) {
      console.warn("Google Sign-In configuration failed:", error);
      console.warn(
        "This is expected if running in Expo Go. Use a custom development build for Google Sign-In functionality."
      );
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const user = await convertFirebaseUser(firebaseUser);
          dispatch({ type: "LOGIN_SUCCESS", payload: user });
        } catch (error) {
          console.error("Auth state change error:", error);
          dispatch({ type: "SET_ERROR", payload: "Failed to load user data." });
        }
      } else {
        dispatch({ type: "LOGOUT" });
      }
    });
    return () => unsubscribe();
  }, []);

  const register = async (
    registrationData: UserRegistrationData
  ): Promise<boolean> => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });
    const { fullName, email, password, confirmPassword } = registrationData;

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
    if (!password || !validatePassword(password)) {
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

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, { displayName: fullName });

      const newUser: User = {
        id: userCredential.user.uid,
        fullName: fullName.trim(),
        email: email.toLowerCase(),
        dateJoined: new Date(),
        isActive: true,
        authProvider: "email",
        preferences: { currency: "USD", notifications: true, darkMode: true },
      };
      await saveUserToFirestore(newUser);
      await SessionManager.saveSession(
        userCredential.user.uid,
        userCredential.user.email || ""
      );
      // onAuthStateChanged will handle the rest
      return true;
    } catch (error: any) {
      let msg = "Registration failed. Please try again.";
      if (error.code === "auth/email-already-in-use")
        msg = "An account with this email already exists.";
      if (error.code === "auth/weak-password") msg = "Password is too weak.";
      dispatch({ type: "SET_ERROR", payload: msg });
      return false;
    }
  };

  const login = async (loginData: UserLoginData): Promise<boolean> => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });
    const { email, password } = loginData;

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

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.toLowerCase().trim(),
        password
      );
      await SessionManager.saveSession(
        userCredential.user.uid,
        userCredential.user.email || ""
      );
      // onAuthStateChanged will handle the rest
      return true;
    } catch (error: any) {
      let msg = "Login failed. Please check your credentials.";
      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        msg = "Invalid email or password.";
      }
      dispatch({ type: "SET_ERROR", payload: msg });
      return false;
    }
  };

  const signInWithGoogle = async (): Promise<boolean> => {
    dispatch({ type: "SET_LOADING", payload: true });
    dispatch({ type: "CLEAR_ERROR" });

    try {
      // Check if GoogleSignin is available (only in custom development builds)
      if (
        typeof GoogleSignin === "undefined" ||
        !GoogleSignin.hasPlayServices
      ) {
        throw new Error("Google Sign-In is not available in this environment");
      }

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
      const userInfo = await GoogleSignin.signIn();

      // Extract the ID token from the user info
      const idToken = userInfo.data?.idToken;
      if (!idToken) {
        throw new Error("No ID token received from Google Sign-In");
      }

      const googleCredential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, googleCredential);

      const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
      if (!userDoc.exists()) {
        const newUser: User = {
          id: userCredential.user.uid,
          fullName: userCredential.user.displayName || "User",
          email: userCredential.user.email || "",
          profilePicture: userCredential.user.photoURL || undefined,
          dateJoined: new Date(),
          isActive: true,
          authProvider: "google",
          preferences: { currency: "USD", notifications: true, darkMode: true },
        };
        await saveUserToFirestore(newUser);
      }
      await SessionManager.saveSession(
        userCredential.user.uid,
        userCredential.user.email || ""
      );
      // onAuthStateChanged will handle the rest
      return true;
    } catch (error: any) {
      if (
        error.message === "Google Sign-In is not available in this environment"
      ) {
        dispatch({
          type: "SET_ERROR",
          payload:
            "Google Sign-In is only available in custom development builds. Please use email/password login or build a custom development client.",
        });
      } else if (error.code !== "12501" && error.code !== "-5") {
        // 12501 = user cancelled flow, -5 = network error
        console.error("Google Sign-In Error: ", error);
        dispatch({
          type: "SET_ERROR",
          payload: "Google Sign-In failed. Please try again.",
        });
      } else {
        dispatch({ type: "SET_LOADING", payload: false });
      }
      return false;
    }
  };

  const signInWithApple = async (): Promise<boolean> => {
    Alert.alert("Apple Sign-In is not implemented in this version.");
    return false;
  };

  const logout = async (): Promise<void> => {
    try {
      // Sign out from Google if signed in and GoogleSignin is available
      try {
        if (
          typeof GoogleSignin !== "undefined" &&
          GoogleSignin.getCurrentUser
        ) {
          const currentUser = await GoogleSignin.getCurrentUser();
          if (currentUser) {
            await GoogleSignin.signOut();
          }
        }
      } catch (googleError) {
        // User might not be signed in with Google or GoogleSignin not available, continue with Firebase logout
        console.log("Google sign out not needed or failed:", googleError);
      }

      await signOut(auth);
      await SessionManager.clearSession();
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const clearError = () => dispatch({ type: "CLEAR_ERROR" });

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!authState.user) return;
    try {
      await updateDoc(doc(db, "users", authState.user.id), { ...userData });
      dispatch({ type: "UPDATE_USER", payload: userData });
    } catch (error) {
      console.error("Update user error:", error);
      dispatch({ type: "SET_ERROR", payload: "Failed to update profile." });
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

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
