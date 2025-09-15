import { router } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { auth } from "../../firebase";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);

      Alert.alert(
        "Email Sent",
        "Password reset email has been sent to your email address. Please check your inbox and follow the instructions.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/(auth)/login"),
          },
        ]
      );
    } catch (error: any) {
      let errorMessage = "Failed to send password reset email";

      if (error.code === "auth/user-not-found") {
        errorMessage = "No account found with this email address";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many requests. Please try again later";
      }

      Alert.alert("Error", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <SafeAreaView className="flex-1 bg-[#1a1a1a]">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View className="flex-1 px-6 pt-8">
              {/* Header with Back Button */}
              <MotiView
                from={{ opacity: 0, translateY: -20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  opacity: { type: "timing", duration: 600 },
                  translateY: { type: "timing", duration: 600 },
                }}
                className="mb-8"
              >
                <TouchableOpacity
                  className="self-start mb-6"
                  onPress={() => router.back()}
                  activeOpacity={0.7}
                >
                  <Text className="text-[#0077CC] text-lg font-medium">
                    ← Back
                  </Text>
                </TouchableOpacity>

                <Text className="mb-2 text-3xl font-bold text-white">
                  Forgot Password?
                </Text>
                <Text className="text-lg text-gray-400">
                  We'll help you reset your password
                </Text>
              </MotiView>

              {/* Instructions */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  opacity: { type: "timing", duration: 600, delay: 200 },
                  translateY: { type: "timing", duration: 600, delay: 200 },
                }}
                className="mb-8"
              >
                <Text className="text-base leading-6 text-center text-gray-300">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </Text>
              </MotiView>

              {/* Email Input */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  opacity: { type: "timing", duration: 600, delay: 400 },
                  translateY: { type: "timing", duration: 600, delay: 400 },
                }}
                className="mb-8"
              >
                <View className="mb-6">
                  <Text className="mb-4 font-medium text-white">
                    Email Address<Text className="text-red-500"> *</Text>
                  </Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email"
                    placeholderTextColor="#666"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCorrect={false}
                    editable={!isLoading}
                    importantForAutofill="yes"
                    className="bg-gray-800 text-white px-4 py-3 rounded-xl border border-gray-700 focus:border-[#0077CC]"
                  />
                </View>

                {/* Reset Button */}
                <TouchableOpacity
                  onPress={handleResetPassword}
                  className={`py-4 rounded-xl mb-6 ${
                    isLoading ? "bg-blue-400" : "bg-[#0077CC]"
                  }`}
                  activeOpacity={0.8}
                  disabled={isLoading}
                >
                  <Text className="text-lg font-bold text-center text-white">
                    {isLoading ? "Sending..." : "Send Reset Email"}
                  </Text>
                </TouchableOpacity>
              </MotiView>

              {/* Login Link */}
              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  opacity: { type: "timing", duration: 600, delay: 600 },
                  translateY: { type: "timing", duration: 600, delay: 600 },
                }}
                className="items-center"
              >
                <TouchableOpacity
                  onPress={() => router.replace("/(auth)/login")}
                  activeOpacity={0.7}
                >
                  <Text className="text-gray-400">
                    Remember your password?{" "}
                    <Text className="text-[#0077CC] font-semibold">
                      Sign In
                    </Text>
                  </Text>
                </TouchableOpacity>
              </MotiView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
