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
    router.push("/(auth)/signup");
  };

  const handleLogin = () => {
    router.push("/(auth)/login");
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
          className="flex-1 justify-end"
          resizeMode="cover"
        >
          <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

          <View className="px-6 pb-12 pt-8">
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
              <Text className="text-4xl font-bold text-white leading-tight">
                Take control of your
              </Text>
              <Text className="text-4xl font-bold text-white leading-tight">
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
              <Text className="text-lg text-white/80 leading-relaxed">
                Track your expenses smartly and achieve your financial goals.
              </Text>
              <Text className="text-lg text-white/80 leading-relaxed">
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
                  <Text className="text-black text-lg font-bold text-center">
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
              className="items-center"
            >
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
                <Text className="text-white/80 text-base">
                  Already have an account?{" "}
                  <Text className="text-white font-semibold underline">
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
