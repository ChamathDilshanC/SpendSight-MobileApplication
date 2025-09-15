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
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../context/FirebaseAuthContext";
import {
  AuthService,
  validateEmail,
  validateFullName,
  validatePassword,
} from "../../services/authService";
import { NavigationManager } from "../../utils/navigationManager";

// Google Logo Component
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

// Apple Logo Component
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
                />
              </View>

              {/* Create Account Button */}
              <TouchableOpacity
                className={`py-4 rounded-xl mb-6 ${
                  isLoading || authState.isLoading
                    ? "bg-blue-400"
                    : "bg-[#0077CC]"
                }`}
                onPress={handleSignup}
                disabled={isLoading || authState.isLoading}
                activeOpacity={0.8}
              >
                <Text className="text-lg font-bold text-center text-white">
                  {isLoading || authState.isLoading
                    ? "Creating Account..."
                    : "Create Account"}
                </Text>
              </TouchableOpacity>

              {/* Social Sign-In Options */}
              <View className="mb-6">
                <View className="flex-row items-center mb-6">
                  <View className="flex-1 h-px bg-gray-600" />
                  <Text className="mx-4 text-sm text-gray-400">
                    Or continue with
                  </Text>
                  <View className="flex-1 h-px bg-gray-600" />
                </View>

                <View className="space-y-3">
                  {/* Google Sign-Up Button */}
                  <TouchableOpacity
                    className="flex-row items-center justify-center px-4 py-4 mb-3 bg-white shadow-md rounded-xl active:bg-gray-100"
                    onPress={handleGoogleSignUp}
                    disabled={authState.isLoading}
                  >
                    <View className="mr-3">
                      <GoogleLogo size={20} />
                    </View>
                    <Text className="text-base font-medium text-gray-700">
                      Sign up with Google
                    </Text>
                  </TouchableOpacity>

                  {/* Apple Sign-Up Button (iOS only) */}
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center px-4 py-4 bg-black border border-gray-700 shadow-md rounded-xl active:bg-gray-900"
                      onPress={handleAppleSignUp}
                      disabled={authState.isLoading}
                    >
                      <View className="mr-3">
                        <AppleLogo size={20} color="#FFFFFF" />
                      </View>
                      <Text className="text-base font-medium text-white">
                        Sign up with Apple
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Login Link */}
              <View className="items-center">
                <TouchableOpacity onPress={goToLogin} activeOpacity={0.7}>
                  <Text className="text-gray-400">
                    Already have an account?{" "}
                    <Text className="text-[#0077CC] font-semibold">
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
