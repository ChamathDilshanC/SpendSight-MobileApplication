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
    NavigationManager.navigateToSignupFromGetStarted();
  };

  const handleLogin = () => {
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
            {/* Title Fade In */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ type: "timing", duration: 800, delay: 200 }}
              className="mb-4"
            >
              <Text className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
                Take control of your
              </Text>
              <Text className="text-4xl font-bold leading-tight text-white drop-shadow-lg">
                financial future.
              </Text>
            </MotiView>

            {/* Description Fade In */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ type: "timing", duration: 800, delay: 400 }}
              className="mb-12"
            >
              <Text className="text-lg leading-relaxed text-white/90 drop-shadow-md">
                Track your expenses smartly and achieve your financial goals.
              </Text>
              <Text className="text-lg leading-relaxed text-white/90 drop-shadow-md">
                Spend Smart, Live Better.
              </Text>
            </MotiView>

            {/* Button Fade In */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ type: "timing", duration: 600, delay: 600 }}
              className="mb-6"
            >
              <TouchableOpacity
                onPress={handleGetStarted}
                className="bg-[#9EE640] py-4 px-8 rounded-2xl shadow-lg"
                activeOpacity={0.9}
              >
                {/* Optional: Keep subtle pulse on button text if desired */}
                <MotiView
                  animate={{
                    opacity: [1, 0.8, 1],
                  }}
                  transition={{
                    opacity: {
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

            {/* Login Link Fade In */}
            <MotiView
              from={{ opacity: 0 }}
              animate={{ opacity: isVisible ? 1 : 0 }}
              transition={{ type: "timing", duration: 600, delay: 800 }}
              className="items-center mb-5"
            >
              <TouchableOpacity onPress={handleLogin} activeOpacity={0.7}>
                <Text className="text-base text-white/95 drop-shadow-md">
                  Already have an account?{"  "}
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
