import { useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StatusBar, BackHandler } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../../context/FirebaseAuthContext";
import { NavigationManager } from "../../utils/navigationManager";

export default function LoadingScreen() {
  const { authState } = useAuth();
  const [loadingStep, setLoadingStep] = useState(0);
  const [loadingText, setLoadingText] = useState("Welcome back!");
  const [loadingSubText, setLoadingSubText] = useState(
    "Preparing your account..."
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription?.remove();
    }, [])
  );

  useEffect(() => {
    console.log("🔄 Loading Screen: Starting loading sequence");

    const loadingSteps = [
      {
        step: 0,
        text: "Welcome back!",
        subText: "Preparing your account...",
        duration: 700,
      },
      {
        step: 1,
        text: "Loading your data...",
        subText: "Fetching your financial information",
        duration: 700,
      },
      {
        step: 2,
        text: "Setting up dashboard...",
        subText: "Organizing your accounts and transactions",
        duration: 700,
      },
      {
        step: 3,
        text: "Almost ready!",
        subText: "Finalizing your experience...",
        duration: 700,
      },
    ];

    let currentStep = 0;

    const runLoadingSequence = () => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];
        console.log(`📱 Loading Step ${step.step}: ${step.text}`);

        setLoadingStep(step.step);
        setLoadingText(step.text);
        setLoadingSubText(step.subText);

        setTimeout(() => {
          currentStep++;
          if (currentStep < loadingSteps.length) {
            runLoadingSequence();
          } else {
            console.log("✅ Loading complete, navigating to dashboard");
            setTimeout(() => {
              NavigationManager.navigateToDashboard();
            }, 500);
          }
        }, step.duration);
      }
    };

    const timer = setTimeout(() => {
      runLoadingSequence();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      console.log(
        "❌ User not authenticated during loading, redirecting to login"
      );
      NavigationManager.navigateToLogin();
    }
  }, [authState.isLoading, authState.isAuthenticated]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <SafeAreaView className="flex-1 bg-[#ffffff]">
        <View className="items-center justify-center flex-1 px-6">
          {/* Main Loading Container */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 100,
            }}
            className="items-center"
          >
            {/* Lottie Animation */}
            <View className="mb-8">
              <LottieView
                source={require("../../assets/animations/loading-animation.json")}
                autoPlay
                loop
                style={{
                  width: 200,
                  height: 200,
                }}
                colorFilters={[
                  {
                    keypath: "**",
                    color: "#0077CC",
                  },
                ]}
              />
            </View>

            {/* Loading Text */}
            <MotiView
              key={loadingStep} // Re-animate when step changes
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 600,
              }}
              className="items-center"
            >
              <Text className="mb-3 text-2xl font-bold text-center text-white">
                {loadingText}
              </Text>

              <Text className="text-lg text-center text-gray-400 max-w-80">
                {loadingSubText}
              </Text>
            </MotiView>

            {/* Progress Indicator */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                type: "timing",
                duration: 800,
                delay: 400,
              }}
              className="mt-12"
            >
              <View className="flex-row space-x-2">
                {[0, 1, 2, 3].map((index) => (
                  <MotiView
                    key={index}
                    animate={{
                      scale: index <= loadingStep ? 1.2 : 1,
                      backgroundColor:
                        index <= loadingStep ? "#0077CC" : "#374151",
                    }}
                    transition={{
                      type: "spring",
                      damping: 15,
                      stiffness: 200,
                    }}
                    className="w-3 h-3 rounded-full"
                  />
                ))}
              </View>
            </MotiView>
          </MotiView>

          {/* App Info */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              type: "timing",
              duration: 800,
              delay: 600,
            }}
            className="absolute items-center bottom-10"
          >
            <Text className="text-xs font-medium text-gray-500">
              SpendSight v1.0
            </Text>
            <Text className="mt-1 text-xs text-center text-gray-600">
              All rights reserved By Developer : Chamath Dilshan
            </Text>
          </MotiView>
        </View>
      </SafeAreaView>
    </>
  );
}
