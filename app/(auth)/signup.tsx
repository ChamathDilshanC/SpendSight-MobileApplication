import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
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
import { useAuth } from "../../context/FirebaseAuthContext";
import {
  AuthService,
  validateEmail,
  validateFullName,
  validatePassword,
} from "../../services/authService";
import { NavigationManager } from "../../utils/navigationManager";

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

  const handleSignup = async () => {
    try {
      setIsLoading(true);
      console.log("🚀 Starting signup process...");
      console.log("📝 Form data:", {
        fullName: formData.fullName,
        email: formData.email,
        passwordLength: formData.password.length,
      });

      // Validation
      if (!validateFullName(formData.fullName)) {
        Alert.alert(
          "Validation Error",
          "Full name must be at least 2 characters long"
        );
        return;
      }

      if (!validateEmail(formData.email)) {
        Alert.alert("Validation Error", "Please enter a valid email address");
        return;
      }

      if (!validatePassword(formData.password)) {
        Alert.alert(
          "Validation Error",
          "Password must be at least 6 characters long"
        );
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        Alert.alert("Validation Error", "Passwords do not match");
        return;
      }

      console.log("✅ Validation passed, calling AuthService.register...");

      // Use the service
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
        Alert.alert(
          "Account Created!",
          "Your account has been created successfully. Please sign in to continue.",
          [
            {
              text: "Sign In",
              onPress: () => {
                console.log("🔄 Navigating to login...");
                NavigationManager.navigateToLogin();
              },
            },
          ]
        );
      } else {
        console.log("❌ Registration failed:", result.error);
        Alert.alert(
          "Registration Failed",
          result.error || "Unknown error occurred"
        );
      }
    } catch (error) {
      console.error("💥 Unexpected error during signup:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    const success = await signInWithGoogle();
    if (success) {
      // Navigate to dashboard and clear auth history
      NavigationManager.navigateToDashboard();
    } else if (authState.error) {
      Alert.alert("Google Sign-In Failed", authState.error, [
        { text: "OK", onPress: clearError },
      ]);
    }
  };

  const handleAppleSignUp = async () => {
    const success = await signInWithApple();
    if (success) {
      // Navigate to dashboard and clear auth history
      NavigationManager.navigateToDashboard();
    } else if (authState.error) {
      Alert.alert("Apple Sign-In Failed", authState.error, [
        { text: "OK", onPress: clearError },
      ]);
    }
  };

  const goToLogin = () => {
    NavigationManager.navigateToLogin();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1F2937" />
      <KeyboardAvoidingView
        className="flex-1 bg-gray-800"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 py-12 justify-center">
            <MotiView
              from={{ opacity: 0, translateY: -20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                opacity: { type: "timing", duration: 600 },
                translateY: { type: "timing", duration: 600 },
              }}
              className="mb-12"
            >
              <Text className="text-3xl font-bold text-white mb-2">
                Create Account
              </Text>
              <Text className="text-gray-300 text-base">
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
              className="space-y-4 mb-6"
            >
              <View className="mb-4">
                <Text className="text-gray-300 text-sm mb-2 ml-1">
                  Full Name
                </Text>
                <TextInput
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-base focus:border-blue-500"
                  placeholder="Enter your full name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.fullName}
                  onChangeText={(text) =>
                    setFormData({ ...formData, fullName: text })
                  }
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 text-sm mb-2 ml-1">
                  Email Address
                </Text>
                <TextInput
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-base focus:border-blue-500"
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View className="mb-4">
                <Text className="text-gray-300 text-sm mb-2 ml-1">
                  Password
                </Text>
                <TextInput
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-base focus:border-blue-500"
                  placeholder="Create a password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  secureTextEntry
                />
              </View>

              <View className="mb-6">
                <Text className="text-gray-300 text-sm mb-2 ml-1">
                  Confirm Password
                </Text>
                <TextInput
                  className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white text-base focus:border-blue-500"
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  value={formData.confirmPassword}
                  onChangeText={(text) =>
                    setFormData({ ...formData, confirmPassword: text })
                  }
                  secureTextEntry
                />
              </View>
            </MotiView>

            {/* Social Sign-In Options */}
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 300 },
                translateY: { type: "timing", duration: 600, delay: 300 },
              }}
              className="mb-6"
            >
              <View className="flex-row items-center mb-6">
                <View className="flex-1 h-px bg-gray-600" />
                <Text className="text-gray-400 text-sm mx-4">
                  Or continue with
                </Text>
                <View className="flex-1 h-px bg-gray-600" />
              </View>

              <View className="space-y-3">
                <TouchableOpacity
                  className="bg-white rounded-lg py-3 px-4 flex-row items-center justify-center shadow-md active:bg-gray-100"
                  onPress={handleGoogleSignUp}
                  disabled={authState.isLoading}
                >
                  <View className="w-5 h-5 mr-3">
                    <Text className="text-lg">🔍</Text>
                  </View>
                  <Text className="text-gray-700 text-base font-medium">
                    Sign up with Google
                  </Text>
                </TouchableOpacity>

                {Platform.OS === "ios" && (
                  <TouchableOpacity
                    className="bg-black border border-gray-700 rounded-lg py-3 px-4 flex-row items-center justify-center shadow-md active:bg-gray-900 mt-4"
                    onPress={handleAppleSignUp}
                    disabled={authState.isLoading}
                  >
                    <View className="w-5 h-5 mr-3">
                      <Text className="text-lg">🍎</Text>
                    </View>
                    <Text className="text-white text-base font-medium">
                      Sign up with Apple
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 400 },
                scale: { type: "timing", duration: 600, delay: 400 },
              }}
            >
              <TouchableOpacity
                className={`rounded-lg py-4 mb-4 shadow-lg ${
                  isLoading || authState.isLoading
                    ? "bg-blue-400"
                    : "bg-blue-600 active:bg-blue-700"
                }`}
                onPress={handleSignup}
                disabled={isLoading || authState.isLoading}
              >
                <Text className="text-white text-center text-base font-semibold">
                  {isLoading || authState.isLoading
                    ? "Creating Account..."
                    : "Create Account"}
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center">
                <Text className="text-gray-400 text-sm">
                  Already have an account?{" "}
                </Text>
                <TouchableOpacity onPress={goToLogin}>
                  <Text className="text-blue-400 text-sm font-medium">
                    Sign In
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
