import { router } from "expo-router";
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
import Svg, { Path } from "react-native-svg";
import { useAuth } from "../../context/FirebaseAuthContext";
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

export default function LoginScreen() {
  const { login, signInWithGoogle, signInWithApple, authState, clearError } =
    useAuth();

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthLoader, setShowAuthLoader] = useState(false);
  const [loaderText, setLoaderText] = useState("Loading...");
  const [loaderSubText, setLoaderSubText] = useState("");

  // Refs
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  // Component lifecycle logging
  useEffect(() => {
    console.log("🔍 LOGIN SCREEN MOUNTED");
    return () => console.log("🔍 LOGIN SCREEN UNMOUNTED");
  }, []);

  // Auth state monitor for navigation
  useEffect(() => {
    console.log("🔄 Login Screen: Auth state check", {
      isLoading: authState.isLoading,
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      email: authState.user?.email,
    });

    if (!authState.isLoading && authState.isAuthenticated && authState.user) {
      console.log(
        "🔄 Login Screen: User authenticated, updating loader for navigation"
      );

      // Update loader text for success
      setLoaderText("Login Successful!");
      setLoaderSubText("Redirecting to your dashboard...");

      // Navigate to loading screen after brief delay
      setTimeout(() => {
        console.log("🚀 Login Screen: Navigating to loading screen");
        setShowAuthLoader(false);
        router.replace("/(auth)/loading");
      }, 1500);
    }
  }, [authState.isLoading, authState.isAuthenticated, authState.user]);

  // Form handlers
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

  // Email/Password Login
  const handleLogin = async () => {
    if (isSubmitting || authState.isLoading) {
      console.log("🚫 Login already in progress, ignoring button press");
      return;
    }

    // Validate inputs
    if (!formData.email.trim()) {
      Alert.alert("Missing Email", "Please enter your email address.");
      return;
    }

    if (!formData.password.trim()) {
      Alert.alert("Missing Password", "Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setShowAuthLoader(true);
    setLoaderText("Signing you in...");
    setLoaderSubText("Authenticating your credentials");

    try {
      let finalEmail = formData.email.trim();
      let finalPassword = formData.password.trim();

      console.log("🚀 Logging in with:", {
        email: finalEmail,
        hasPassword: !!finalPassword,
      });

      const success = await login({
        email: finalEmail,
        password: finalPassword,
      });

      if (success) {
        console.log("✅ Login successful, will navigate to loading screen");
      } else if (authState.error) {
        setShowAuthLoader(false);
        Alert.alert("Login Failed", authState.error, [
          { text: "OK", onPress: clearError },
        ]);
      }
    } catch (error) {
      setShowAuthLoader(false);
      console.error("❌ Login error:", error);
      Alert.alert(
        "Login Failed",
        "An unexpected error occurred. Please try again.",
        [{ text: "OK", onPress: clearError }]
      );
    } finally {
      setTimeout(() => {
        setIsSubmitting(false);
      }, 1000);
    }
  };

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    try {
      console.log("🔍 Starting Google sign-in...");
      setShowAuthLoader(true);
      setLoaderText("Signing in with Google...");
      setLoaderSubText("Connecting to Google services");

      const success = await signInWithGoogle();

      if (success) {
        console.log(
          "✅ Google sign-in successful, will navigate to loading screen"
        );
      } else if (authState.error) {
        setShowAuthLoader(false);
        Alert.alert("Google Sign-In Failed", authState.error, [
          { text: "OK", onPress: clearError },
        ]);
      }
    } catch (error) {
      setShowAuthLoader(false);
      console.error("❌ Google sign-in error:", error);
      Alert.alert(
        "Google Sign-In Failed",
        "An unexpected error occurred. Please try again.",
        [{ text: "OK", onPress: clearError }]
      );
    }
  };

  // Apple Sign-In
  const handleAppleSignIn = async () => {
    try {
      console.log("🍎 Starting Apple sign-in...");
      setShowAuthLoader(true);
      setLoaderText("Signing in with Apple...");
      setLoaderSubText("Connecting to Apple services");

      const success = await signInWithApple();

      if (success) {
        console.log(
          "✅ Apple sign-in successful, will navigate to loading screen"
        );
        // Auth state effect will handle navigation
      } else if (authState.error) {
        setShowAuthLoader(false);
        Alert.alert("Apple Sign-In Failed", authState.error, [
          { text: "OK", onPress: clearError },
        ]);
      }
    } catch (error) {
      setShowAuthLoader(false);
      console.error("❌ Apple sign-in error:", error);
      Alert.alert(
        "Apple Sign-In Failed",
        "An unexpected error occurred. Please try again.",
        [{ text: "OK", onPress: clearError }]
      );
    }
  };

  // Navigation to signup
  const goToSignup = () => {
    console.log("📝 Navigating to signup");
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
            {/* Header Section */}
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

            {/* Form Section */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 200 },
                translateY: { type: "timing", duration: 600, delay: 200 },
              }}
              className="space-y-4"
            >
              {/* Email Input */}
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
                  importantForAutofill="yes"
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                />
              </View>

              {/* Password Input */}
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
                  importantForAutofill="yes"
                  className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                />
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                className="mb-8"
                activeOpacity={0.7}
                onPress={() => router.push("/(frogetPassword)")}
              >
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

              {/* Social Sign-In Section */}
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
                    disabled={authState.isLoading || isSubmitting}
                  >
                    <View className="mr-3">
                      <GoogleLogo size={20} />
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
                      disabled={authState.isLoading || isSubmitting}
                    >
                      <View className="mr-3">
                        <AppleLogo size={20} color="#FFFFFF" />
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
