import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignupScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignup = () => {
    // TODO: Add form validation and authentication logic
    console.log("Signup with:", formData);
    // Navigate to main app or login
  };

  const goToLogin = () => {
    router.push("/login");
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

            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 400 },
                scale: { type: "timing", duration: 600, delay: 400 },
              }}
            >
              <TouchableOpacity
                className="bg-blue-600 rounded-lg py-4 mb-4 shadow-lg active:bg-blue-700"
                onPress={handleSignup}
              >
                <Text className="text-white text-center text-base font-semibold">
                  Create Account
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
