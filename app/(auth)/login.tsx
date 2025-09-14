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
import { NavigationManager } from "../../utils/navigationManager";

export default function LoginScreen() {
  const { login, signInWithGoogle, signInWithApple, authState, clearError } =
    useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    // Prevent multiple rapid submissions
    if (isSubmitting || authState.isLoading) {
      console.log("🚫 Login already in progress, ignoring button press");
      return;
    }

    setIsSubmitting(true);

    try {
      const success = await login(formData);
      if (success) {
        // Navigate to dashboard and clear auth history
        console.log("✅ Login successful, navigating to dashboard...");
        NavigationManager.navigateToDashboard();
      } else if (authState.error) {
        Alert.alert("Login Failed", authState.error, [
          { text: "OK", onPress: clearError },
        ]);
      }
    } finally {
      // Add a small delay to prevent rapid re-submission
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    if (success) {
      // Navigate to dashboard and clear auth history
      console.log("✅ Google sign-in successful, navigating to dashboard...");
      NavigationManager.navigateToDashboard();
    } else if (authState.error) {
      Alert.alert("Google Sign-In Failed", authState.error, [
        { text: "OK", onPress: clearError },
      ]);
    }
  };

  const handleAppleSignIn = async () => {
    const success = await signInWithApple();
    if (success) {
      // Navigate to dashboard and clear auth history
      console.log("✅ Apple sign-in successful, navigating to dashboard...");
      NavigationManager.navigateToDashboard();
    } else if (authState.error) {
      Alert.alert("Apple Sign-In Failed", authState.error, [
        { text: "OK", onPress: clearError },
      ]);
    }
  };

  const goToSignup = () => {
    NavigationManager.navigateToSignup();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-[#1a1a1a]"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 pt-20">
            {/* Header */}
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
                Welcome Back
              </Text>
              <Text className="text-gray-400 text-lg">
                Sign in to your SpendSight account
              </Text>
            </MotiView>

            {/* Form */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 200 },
                translateY: { type: "timing", duration: 600, delay: 200 },
              }}
              className="space-y-4"
            >
              {/* Email */}
              <View className="mb-4">
                <Text className="text-white mb-2 font-medium">Email</Text>
                <TextInput
                  value={formData.email}
                  onChangeText={(text) =>
                    setFormData({ ...formData, email: text })
                  }
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                />
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="text-white mb-2 font-medium">Password</Text>
                <TextInput
                  value={formData.password}
                  onChangeText={(text) =>
                    setFormData({ ...formData, password: text })
                  }
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                />
              </View>

              {/* Forgot Password */}
              <TouchableOpacity className="mb-8" activeOpacity={0.7}>
                <Text className="text-[#0077CC] text-right">
                  Forgot Password?
                </Text>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                onPress={handleLogin}
                className={`py-4 rounded-xl mb-6 ${
                  authState.isLoading || isSubmitting
                    ? "bg-blue-400"
                    : "bg-[#0077CC]"
                }`}
                activeOpacity={0.8}
                disabled={authState.isLoading || isSubmitting}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {authState.isLoading || isSubmitting
                    ? "Logging in..."
                    : "Login"}
                </Text>
              </TouchableOpacity>

              {/* Social Sign-In Options */}
              <View className="mb-6">
                <View className="flex-row items-center mb-6">
                  <View className="flex-1 h-px bg-gray-600" />
                  <Text className="text-gray-400 text-sm mx-4">
                    Or continue with
                  </Text>
                  <View className="flex-1 h-px bg-gray-600" />
                </View>

                <View className="space-y-3 mb-6">
                  {/* Google Sign-In Button */}
                  <TouchableOpacity
                    className="bg-white rounded-xl py-4 px-4 flex-row items-center justify-center shadow-md active:bg-gray-100 mb-3"
                    onPress={handleGoogleSignIn}
                    disabled={authState.isLoading}
                  >
                    <View className="w-5 h-5 mr-3">
                      <Text className="text-md">🔍</Text>
                    </View>
                    <Text className="text-gray-700 text-base font-medium">
                      Continue with Google
                    </Text>
                  </TouchableOpacity>

                  {/* Apple Sign-In Button (iOS only) */}
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      className="bg-black border border-gray-700 rounded-xl py-4 px-4 flex-row items-center justify-center shadow-md active:bg-gray-900"
                      onPress={handleAppleSignIn}
                      disabled={authState.isLoading}
                    >
                      <View className="w-5 h-5 mr-3 ">
                        <Text className="text-md">🍎</Text>
                      </View>
                      <Text className="text-white text-base font-medium">
                        Continue with Apple
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Signup Link */}
              <View className="items-center">
                <TouchableOpacity onPress={goToSignup} activeOpacity={0.7}>
                  <Text className="text-gray-400">
                    Don't have an account?{" "}
                    <Text className="text-[#0077CC] font-semibold">
                      Sign Up
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
