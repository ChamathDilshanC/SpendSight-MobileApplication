import { useFocusEffect } from "@react-navigation/native";
import LottieView from "lottie-react-native";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useState } from "react";
import { BackHandler, StatusBar, Text, View } from "react-native";
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
    const loadingSteps = [
      {
        step: 0,
        text: "Welcome back!",
        subText: "Preparing your account...",
        duration: 400,
      },
      {
        step: 1,
        text: "Loading your data...",
        subText: "Fetching your financial information",
        duration: 400,
      },
      {
        step: 2,
        text: "Setting up dashboard...",
        subText: "Organizing your accounts and transactions",
        duration: 400,
      },
      {
        step: 3,
        text: "Almost ready!",
        subText: "Finalizing your experience...",
        duration: 300,
      },
    ];

    let currentStep = 0;

    const runLoadingSequence = () => {
      if (currentStep < loadingSteps.length) {
        const step = loadingSteps[currentStep];

        setLoadingStep(step.step);
        setLoadingText(step.text);
        setLoadingSubText(step.subText);

        setTimeout(() => {
          currentStep++;
          if (currentStep < loadingSteps.length) {
            runLoadingSequence();
          } else {
            setTimeout(() => {
              NavigationManager.navigateToDashboard();
            }, 200);
          }
        }, step.duration);
      }
    };

    runLoadingSequence();
  }, []);

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      NavigationManager.navigateToLogin();
    }
  }, [authState.isLoading, authState.isAuthenticated]);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <SafeAreaView className="flex-1 bg-[#ffffff]">
        <View className="items-center justify-center flex-1 px-6">
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 150,
            }}
            className="items-center"
          >
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

            <MotiView
              key={loadingStep}
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "timing",
                duration: 400,
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

            {}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                type: "timing",
                duration: 600,
                delay: 200,
              }}
              className="mt-12"
            >
              <View className="flex-row items-center justify-center">
                {[0, 1, 2, 3].map((index) => (
                  <React.Fragment key={index}>
                    <MotiView
                      animate={{
                        scale: index <= loadingStep ? 1.1 : 1,
                        backgroundColor:
                          index <= loadingStep ? "#0077CC" : "#374151",
                      }}
                      transition={{
                        type: "spring",
                        damping: 15,
                        stiffness: 250,
                      }}
                      className="w-3 h-3 rounded-full"
                    />
                    {}
                    {index < 3 && <View className="w-3" />}
                  </React.Fragment>
                ))}
              </View>
            </MotiView>
          </MotiView>

          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              type: "timing",
              duration: 600,
              delay: 300,
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
