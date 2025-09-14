import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import { MotiView } from "moti";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import "../global.css";

const LOGO = require("../assets/images/SpendSightLogo.png");

export default function App() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string>("");

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type || "unknown");
    });

    // Initial check
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type || "unknown");
    });

    return () => unsubscribe();
  }, []);

  // Auto-navigate after 2 seconds if connected
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        router.push("/(getStarted)/getStartedScreen");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isConnected, router]);

  const handleGetStarted = () => {
    if (isConnected) {
      router.push("/(getStarted)/getStartedScreen");
    } else {
      Alert.alert(
        "No Internet Connection",
        "Please check your internet connection and try again.",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View className="flex-1 items-center justify-center bg-[#1a1a1a]">
        {/* Main Content - Centered */}
        <View className="items-center justify-center flex-1">
          <MotiView
            from={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              scale: { type: "spring", damping: 15, stiffness: 100 },
              opacity: { type: "timing", duration: 800 },
            }}
            className="items-center"
          >
            {/* Logo */}
            <TouchableOpacity
              onPress={handleGetStarted}
              activeOpacity={0.8}
              className="items-center justify-center mb-8"
            >
              <MotiView
                from={{ scale: 1 }}
                animate={{
                  scale: isConnected ? [1, 1.05, 1] : 1,
                }}
                transition={{
                  scale: {
                    type: "timing",
                    duration: 1500,
                    loop: !!isConnected,
                  },
                }}
              >
                <Image
                  source={LOGO}
                  className="w-40 h-40"
                  resizeMode="contain"
                />
              </MotiView>
            </TouchableOpacity>

            {/* Connection Status */}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                opacity: { type: "timing", duration: 600, delay: 400 },
                translateY: { type: "timing", duration: 600, delay: 400 },
              }}
              className="items-center"
            >
              {/* Connection Indicator */}
              <View className="flex-row items-center mb-3">
                <MotiView
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: isConnected ? [1, 0.7, 1] : 1,
                  }}
                  transition={{
                    scale: {
                      type: "timing",
                      duration: 2000,
                      loop: !!isConnected,
                    },
                    opacity: {
                      type: "timing",
                      duration: 2000,
                      loop: !!isConnected,
                    },
                  }}
                  className={`w-3 h-3 rounded-full mr-3 ${
                    isConnected === null
                      ? "bg-gray-400"
                      : isConnected
                        ? "bg-green-500"
                        : "bg-red-500"
                  }`}
                />
                <Text
                  className={`text-base font-medium ${
                    isConnected === null
                      ? "text-gray-400"
                      : isConnected
                        ? "text-green-400"
                        : "text-red-400"
                  }`}
                >
                  {isConnected === null
                    ? "Checking connection..."
                    : isConnected
                      ? `Connected via ${connectionType}`
                      : "No internet connection"}
                </Text>
              </View>

              {/* Action Text */}
              {isConnected && (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    opacity: { type: "timing", duration: 400, delay: 800 },
                  }}
                >
                  <Text className="text-gray-300 text-sm text-center">
                    <Text className="text-[#0077CC]">Tap</Text>  the logo to get
                    started
                  </Text>
                </MotiView>
              )}

              {!isConnected && isConnected !== null && (
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    opacity: { type: "timing", duration: 400, delay: 800 },
                  }}
                >
                  <Text className="text-red-400 text-sm text-center max-w-64">
                    Please check your internet connection to continue
                  </Text>
                </MotiView>
              )}
            </MotiView>
          </MotiView>
        </View>
        <View className="absolute bottom-20 items-center">
          <Text className="text-gray-600 text-xs">SpendSight v1.0</Text>
          <Text className="text-gray-600 text-xs mt-1">
            All rights reserved By Developer : Chamath Dilshan
          </Text>
        </View>
      </View>
    </>
  );
}
