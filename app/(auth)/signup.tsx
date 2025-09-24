import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../context/FirebaseAuthContext";
import {
  AuthService,
  validateEmail,
  validateFullName,
  validatePassword,
} from "../../services/authService";
import { NavigationManager } from "../../utils/navigationManager";

const GoogleLogo = ({ size = 20 }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

const AppleLogo = ({ size = 20, color = "#000" }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </Svg>
);

export default function SignupScreen() {
  const router = useRouter();
  const { signInWithGoogle, signInWithApple, authState, clearError } =
    useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  useEffect(() => {
    if (!authState.isLoading) {
      setIsLoading(false);
      setIsSocialLoading(false);
    }
  }, [authState.isLoading]);

  useEffect(() => {
    if (authState.error) {
      setIsLoading(false);
      setIsSocialLoading(false);
    }
  }, [authState.error]);

  useEffect(() => {
    if (!authState.isLoading && authState.isAuthenticated && authState.user) {
      NavigationManager.navigateToDashboard();
    }
  }, [authState.isLoading, authState.isAuthenticated, authState.user]);

  const showErrorAlert = (title: string, message: string) => {
    Alert.alert(title, message, [
      {
        text: "OK",
        onPress: () => {
          clearError();
          setIsLoading(false);
          setIsSocialLoading(false);
        },
      },
    ]);
  };

  const handleSignup = async () => {
    if (isLoading || isSocialLoading || authState.isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      clearError();

      console.log("🚀 Starting signup process...");
      console.log("📝 Form data:", {
        fullName: formData.fullName,
        email: formData.email,
        passwordLength: formData.password.length,
      });

      if (!validateFullName(formData.fullName)) {
        setIsLoading(false);
        Alert.alert(
          "Invalid Name",
          "Full name must be at least 2 characters long"
        );
        return;
      }

      if (!validateEmail(formData.email)) {
        setIsLoading(false);
        Alert.alert("Invalid Email", "Please enter a valid email address");
        return;
      }

      if (!validatePassword(formData.password)) {
        setIsLoading(false);
        Alert.alert(
          "Weak Password",
          "Password must be at least 6 characters long"
        );
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setIsLoading(false);
        Alert.alert("Password Mismatch", "Passwords do not match");
        return;
      }

      console.log("✅ Validation passed, calling AuthService.register...");

      const result = await AuthService.register(
        formData.fullName,
        formData.email,
        formData.password
      );

      console.log("📊 Registration result:", {
        success: result.success,
        hasError: !!result.error,
      });

      if (result.success) {
        console.log("🎉 Registration successful!");
        setIsLoading(false);
      } else {
        setIsLoading(false);
        console.log("❌ Registration failed:", result.error);

        const errorMessage = result.error || "Registration failed";

        if (errorMessage.includes("auth/email-already-in-use")) {
          showErrorAlert(
            "Email Already Exists",
            "An account with this email address already exists. Please use a different email or sign in instead."
          );
        } else if (errorMessage.includes("auth/weak-password")) {
          showErrorAlert(
            "Weak Password",
            "Your password is too weak. Please choose a stronger password with at least 6 characters."
          );
        } else if (errorMessage.includes("auth/invalid-email")) {
          showErrorAlert(
            "Invalid Email",
            "The email address you entered is not valid. Please check and try again."
          );
        } else if (errorMessage.includes("auth/operation-not-allowed")) {
          showErrorAlert(
            "Registration Disabled",
            "Email/password registration is currently disabled. Please contact support."
          );
        } else if (errorMessage.includes("auth/too-many-requests")) {
          showErrorAlert(
            "Too Many Attempts",
            "Too many registration attempts. Please try again later."
          );
        } else {
          showErrorAlert("Registration Failed", errorMessage);
        }
      }
    } catch (error) {
      console.error("💥 Unexpected error during signup:", error);
      setIsLoading(false);
      showErrorAlert(
        "Registration Failed",
        "An unexpected error occurred. Please try again."
      );
    }
  };

  const handleGoogleSignUp = async () => {
    if (isLoading || isSocialLoading || authState.isLoading) {
      return;
    }

    try {
      setIsSocialLoading(true);
      clearError();

      console.log("🔐 Attempting Google sign-up...");

      const success = await signInWithGoogle();

      if (success) {
        NavigationManager.navigateToDashboard();
      } else {
        setIsSocialLoading(false);
        const errorMessage =
          authState.error || "Google sign-up failed. Please try again.";
        showErrorAlert("Google Sign-Up Failed", errorMessage);
      }
    } catch (error) {
      console.error("❌ Google sign-up error:", error);
      setIsSocialLoading(false);
      showErrorAlert(
        "Google Sign-Up Failed",
        "An unexpected error occurred. Please try again."
      );
    }
  };

  const handleAppleSignUp = async () => {
    if (isLoading || isSocialLoading || authState.isLoading) {
      return;
    }

    try {
      setIsSocialLoading(true);
      clearError();

      console.log("🔐 Attempting Apple sign-up...");

      const success = await signInWithApple();

      if (success) {
        NavigationManager.navigateToDashboard();
      } else {
        setIsSocialLoading(false);
        const errorMessage =
          authState.error || "Apple sign-up failed. Please try again.";
        showErrorAlert("Apple Sign-Up Failed", errorMessage);
      }
    } catch (error) {
      console.error("❌ Apple sign-up error:", error);
      setIsSocialLoading(false);
      showErrorAlert(
        "Apple Sign-Up Failed",
        "An unexpected error occurred. Please try again."
      );
    }
  };

  const goToLogin = () => {
    NavigationManager.navigateToLogin();
  };

  const isAnyLoading = isLoading || isSocialLoading || authState.isLoading;

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <KeyboardAvoidingView
        className="flex-1 bg-[#1a1a1a]"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-20">
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                opacity: { type: "timing", duration: 600 },
                translateY: { type: "timing", duration: 600 },
              }}
              className="mb-12"
            >
              <Text className="mb-2 text-3xl font-bold text-white">
                Create Account
              </Text>
              <Text className="text-lg text-gray-400">
                Join SpendSight to start tracking your expenses
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 200 },
                translateY: { type: "timing", duration: 600, delay: 200 },
              }}
              className="space-y-4"
            >
              <View className="mb-4">
                <Text className="mb-4 font-medium text-white">
                  Full Name<Text className="text-red-500"> *</Text>
                </Text>
                <TextInput
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                  placeholder="Enter your full name"
                  placeholderTextColor="#666"
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, fullName: text })
                  }
                  autoComplete="name"
                  textContentType="name"
                  autoCorrect={false}
                  editable={!isAnyLoading}
                />
              </View>

              <View className="mb-4">
                <Text className="mb-4 font-medium text-white">
                  Email Address<Text className="text-red-500"> *</Text>
                </Text>
                <TextInput
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCorrect={false}
                  editable={!isAnyLoading}
                />
              </View>

              <View className="mb-4">
                <Text className="mb-4 font-medium text-white">
                  Password<Text className="text-red-500"> *</Text>
                </Text>
                <TextInput
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                  placeholder="Create a password"
                  placeholderTextColor="#666"
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  autoCorrect={false}
                  editable={!isAnyLoading}
                />
              </View>

              <View className="mb-6">
                <Text className="mb-4 font-medium text-white">
                  Confirm Password<Text className="text-red-500"> *</Text>
                </Text>
                <TextInput
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                  placeholder="Confirm your password"
                  placeholderTextColor="#666"
                  value={formData.confirmPassword}
                  onChangeText={(text) =>
                    setFormData({ ...formData, confirmPassword: text })
                  }
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                  autoCorrect={false}
                  editable={!isAnyLoading}
                />
              </View>

              {}
              <TouchableOpacity
                className={`py-4 rounded-xl mb-6 ${
                  isAnyLoading ? "bg-blue-400" : "bg-[#0077CC]"
                }`}
                onPress={handleSignup}
                disabled={isAnyLoading}
                activeOpacity={0.8}
              >
                <Text className="text-lg font-bold text-center text-white">
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Text>
              </TouchableOpacity>

              {}
              <View className="mb-6">
                <View className="flex-row items-center mb-6">
                  <View className="flex-1 h-px bg-gray-600" />
                  <Text className="mx-4 text-sm text-gray-400">
                    Or continue with
                  </Text>
                  <View className="flex-1 h-px bg-gray-600" />
                </View>

                <View className="space-y-3">
                  {}
                  <TouchableOpacity
                    className={`flex-row items-center justify-center px-4 py-4 mb-3 shadow-md rounded-xl ${
                      isAnyLoading
                        ? "bg-gray-200"
                        : "bg-white active:bg-gray-100"
                    }`}
                    onPress={handleGoogleSignUp}
                    disabled={isAnyLoading}
                  >
                    <View className="mr-3">
                      <GoogleLogo size={20} />
                    </View>
                    <Text className="text-base font-medium text-gray-700">
                      {isSocialLoading
                        ? "Signing up..."
                        : "Sign up with Google"}
                    </Text>
                  </TouchableOpacity>

                  {}
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      className={`flex-row items-center justify-center px-4 py-4 border border-gray-700 shadow-md rounded-xl ${
                        isAnyLoading
                          ? "bg-gray-800"
                          : "bg-black active:bg-gray-900"
                      }`}
                      onPress={handleAppleSignUp}
                      disabled={isAnyLoading}
                    >
                      <View className="mr-3">
                        <AppleLogo size={20} color="#FFFFFF" />
                      </View>
                      <Text className="text-base font-medium text-white">
                        {isSocialLoading
                          ? "Signing up..."
                          : "Sign up with Apple"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {}
              <View className="items-center">
                <TouchableOpacity
                  onPress={goToLogin}
                  activeOpacity={0.7}
                  disabled={isAnyLoading}
                >
                  <Text className="text-gray-400">
                    Already have an account?{" "}
                    <Text
                      className={`font-semibold ${isAnyLoading ? "text-gray-500" : "text-[#0077CC]"}`}
                    >
                      Sign In
                    </Text>
                  </Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}
