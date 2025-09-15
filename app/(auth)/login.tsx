import { MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
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

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  useEffect(() => {
    const syncAutofillValues = () => {
      console.log("� Checking for autofill sync...");
    };

    const interval = setInterval(syncAutofillValues, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const handleEmailFocus = () => {
    console.log("📧 Email field focused");
  };

  const handlePasswordFocus = () => {
    console.log("🔒 Password field focused");
  };

  const handleEmailChange = (text: string) => {
    console.log("📧 Email changed manually:", text);
    setFormData((prev) => ({ ...prev, email: text }));
  };

  const handlePasswordChange = (text: string) => {
    console.log("🔒 Password changed manually");
    setFormData((prev) => ({ ...prev, password: text }));
  };

  const handleLogin = async () => {
    if (isSubmitting || authState.isLoading) {
      console.log("🚫 Login already in progress, ignoring button press");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalEmail = formData.email;
      let finalPassword = formData.password;

      console.log("🚀 Logging in with:", {
        email: finalEmail,
        hasPassword: !!finalPassword,
      });

      const success = await login({
        email: finalEmail,
        password: finalPassword,
      });

      if (success) {
        console.log("✅ Login successful, navigating to dashboard...");
        NavigationManager.navigateToDashboard();
      } else if (authState.error) {
        Alert.alert("Login Failed", authState.error, [
          { text: "OK", onPress: clearError },
        ]);
      }
    } catch (error) {
      console.error("❌ Login error:", error);
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  const handleGoogleSignIn = async () => {
    const success = await signInWithGoogle();
    if (success) {
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
                Welcome Back
              </Text>
              <Text className="text-lg text-gray-400">
                Sign in to your SpendSight account
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
                  Email<Text className="text-red-500"> *</Text>
                </Text>
                <TextInput
                  ref={emailRef}
                  value={formData.email}
                  onChangeText={handleEmailChange}
                  onFocus={handleEmailFocus}
                  placeholder="Enter your email"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                  autoCorrect={false}
                  // FIX 6: Add importantForAutofill to help password managers
                  importantForAutofill="yes"
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                />
              </View>

              {/* Password */}
              <View className="mb-6">
                <Text className="mb-4 font-medium text-white">
                  Password<Text className="text-red-500"> *</Text>
                </Text>
                <TextInput
                  ref={passwordRef}
                  value={formData.password}
                  onChangeText={handlePasswordChange}
                  onFocus={handlePasswordFocus}
                  placeholder="Enter your password"
                  placeholderTextColor="#666"
                  secureTextEntry
                  autoComplete="current-password"
                  textContentType="password"
                  autoCorrect={false}
                  // FIX 7: Add importantForAutofill for password field
                  importantForAutofill="yes"
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
                <Text className="text-lg font-bold text-center text-white">
                  {authState.isLoading || isSubmitting
                    ? "Logging in..."
                    : "Login"}
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

                <View className="mb-6 space-y-3">
                  {/* Google Sign-In Button */}
                  <TouchableOpacity
                    className="flex-row items-center justify-center px-4 py-4 mb-3 bg-white shadow-md rounded-xl active:bg-gray-100"
                    onPress={handleGoogleSignIn}
                    disabled={authState.isLoading}
                  >
                    <View className="w-5 h-5 mr-3">
                      <Text className="text-md">🔍</Text>
                    </View>
                    <Text className="text-base font-medium text-gray-700">
                      Continue with Google
                    </Text>
                  </TouchableOpacity>

                  {/* Apple Sign-In Button (iOS only) */}
                  {Platform.OS === "ios" && (
                    <TouchableOpacity
                      className="flex-row items-center justify-center px-4 py-4 bg-black border border-gray-700 shadow-md rounded-xl active:bg-gray-900"
                      onPress={handleAppleSignIn}
                      disabled={authState.isLoading}
                    >
                      <View className="w-5 h-5 mr-3 ">
                        <Text className="text-md">🍎</Text>
                      </View>
                      <Text className="text-base font-medium text-white">
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
