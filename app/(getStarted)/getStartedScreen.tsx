import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ImageBackground,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NavigationManager } from "../../utils/navigationManager";

const BACKGROUND_IMAGE = require("../../assets/images/GetStartBG.png");

const { width, height } = Dimensions.get("window");

const GetStartedScreen = () => {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    // Use replace to prevent back navigation to GetStarted screen
    NavigationManager.navigateToSignupFromGetStarted();
  };

  const handleLogin = () => {
    // Use replace to prevent back navigation to GetStarted screen
    NavigationManager.navigateToLoginFromGetStarted();
  };

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <View className="flex-1">
        <ImageBackground
          source={BACKGROUND_IMAGE}
          className="justify-end flex-1"
          resizeMode="cover"
        >
          {/* Simple transparent black overlay for bottom half */}
          <View className="absolute bottom-0 left-0 right-0 h-full bg-black/60 rounded-t-3xl" />

          <View className="px-6 pt-8 pb-12">
            <MotiView
              from={{ opacity: 0, translateY: 50 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                translateY: isVisible ? 0 : 50,
              }}
              transition={{
                opacity: { type: "timing", duration: 800, delay: 200 },
                translateY: { type: "spring", damping: 15, delay: 200 },
              }}
              className="mb-4"
            >
              <Text className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
                Take control of your
              </Text>
              <Text className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
                financial future.
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 30 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                translateY: isVisible ? 0 : 30,
              }}
              transition={{
                opacity: { type: "timing", duration: 800, delay: 400 },
                translateY: { type: "spring", damping: 15, delay: 400 },
              }}
              className="mb-12"
            >
              <Text className="text-lg leading-relaxed text-white/90 drop-shadow-md">
                Track your expenses smartly and achieve your financial goals.
              </Text>
              <Text className="text-lg leading-relaxed text-white/90 drop-shadow-md">
                Spend Smart, Live Better.
              </Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.9 }}
              animate={{
                opacity: isVisible ? 1 : 0,
                scale: isVisible ? 1 : 0.9,
              }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 600 },
                scale: { type: "spring", damping: 12, delay: 600 },
              }}
              className="mb-6"
            >
              <TouchableOpacity
                onPress={handleGetStarted}
                className="bg-[#9EE640] py-4 px-8 rounded-2xl shadow-lg"
                activeOpacity={0.9}
              >
                <MotiView
                  animate={{
                    scale: [1, 1.02, 1],
                  }}
                  transition={{
                    scale: {
                      type: "timing",
                      duration: 2000,
                      loop: true,
                    },
                  }}
                >
                  <Text className="text-lg font-bold text-center text-black">
                    Get Started
                  </Text>
                </MotiView>
              </TouchableOpacity>
            </MotiView>

            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 800 },
              }}
              className="items-center mb-5"
            >
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
                <Text className="text-base text-white/95 drop-shadow-md">
                  Already have an account?{" "}
                  <Text className="font-semibold text-white underline drop-shadow-md">
                    Login
                  </Text>
                </Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </ImageBackground>
      </View>
    </>
  );
};

export default GetStartedScreen;
