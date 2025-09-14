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

export default function LoginScreen() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleLogin = () => {
    // Add your login logic here
    console.log("Login with:", formData);
    // Navigate to main app
    router.push("/");
  };

  const goToSignup = () => {
    router.push("/(auth)/signup");
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
                className="bg-[#0077CC] py-4 rounded-xl mb-6"
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-bold text-lg">
                  Login
                </Text>
              </TouchableOpacity>

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
