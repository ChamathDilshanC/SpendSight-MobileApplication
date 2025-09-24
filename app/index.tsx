import NetInfo, { NetInfoState } from "@react-native-community/netinfo";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../context/FirebaseAuthContext";
import "../global.css";
import { NavigationManager } from "../utils/navigationManager";

const LOGO = require("../assets/images/SpendSightLogo.png");
const GET_STARTED_BG = require("../assets/images/GetStartBG.png");

export default function App() {
  const { authState } = useAuth();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type || "unknown");
    });

    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected ?? false);
      setConnectionType(state.type || "unknown");
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const preloadImages = async () => {
      try {
        await Image.prefetch(Image.resolveAssetSource(GET_STARTED_BG).uri);
        setImagesLoaded(true);
      } catch (error) {
        console.log("Image preloading failed:", error);
        setImagesLoaded(true);
      }
    };

    preloadImages();
  }, []);

  useEffect(() => {
    if (
      authState.isInitialized &&
      isConnected !== null &&
      imagesLoaded &&
      !isNavigating
    ) {
      setIsNavigating(true);
      console.log("🚀 Auth system initialized. Deciding navigation...");

      setTimeout(() => {
        if (authState.isAuthenticated && authState.user) {
          console.log("✅ User authenticated → Navigating to Dashboard");
          NavigationManager.navigateToDashboard();
        } else {
          console.log("❌ No authenticated user → Showing Get Started");
          NavigationManager.navigateToGetStarted();
        }
      }, 300);
    }
  }, [
    authState.isInitialized,
    authState.isAuthenticated,
    authState.user,
    isConnected,
    imagesLoaded,
    isNavigating,
  ]);

  const handleGetStarted = () => {
    if (!authState.isInitialized) {
      Alert.alert("Please Wait", "Checking authentication, please wait...", [
        { text: "OK", style: "default" },
      ]);
      return;
    }

    if (!isConnected) {
      Alert.alert(
        "No Connection",
        "Please check your internet connection and try again.",
        [{ text: "OK", style: "default" }]
      );
      return;
    }

    if (!imagesLoaded) {
      Alert.alert("Loading...", "Please wait while we load assets.", [
        { text: "OK", style: "default" },
      ]);
      return;
    }

    setIsNavigating(true);
    setTimeout(() => {
      if (authState.isAuthenticated && authState.user) {
        NavigationManager.navigateToDashboard();
      } else {
        NavigationManager.navigateToGetStarted();
      }
    }, 300);
  };

  const isReady = authState.isInitialized && isConnected && imagesLoaded;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#1a1a1a" }}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View className="flex-1" style={{ backgroundColor: "#1a1a1a" }}>
        <View className="items-center justify-center flex-1">
          <MotiView
            className="items-center justify-center flex-1"
            animate={{
              translateX: isNavigating ? -400 : 0,
              opacity: isNavigating ? 0 : 1,
            }}
            transition={{
              translateX: { type: "timing", duration: 300, delay: 0 },
              opacity: { type: "timing", duration: 250, delay: 50 },
            }}
          >
            <MotiView
              from={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                scale: { type: "spring", damping: 15, stiffness: 100 },
                opacity: { type: "timing", duration: 800 },
              }}
              className="items-center"
            >
              <TouchableOpacity
                onPress={handleGetStarted}
                activeOpacity={0.8}
                className="items-center justify-center p-4 mb-8"
              >
                <MotiView
                  from={{ scale: 1 }}
                  animate={{
                    scale: isReady ? [1, 1.05, 1] : 1,
                  }}
                  transition={{
                    scale: {
                      type: "timing",
                      duration: 1500,
                      loop: !!isReady,
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

              <MotiView
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  opacity: { type: "timing", duration: 600, delay: 400 },
                  translateY: { type: "timing", duration: 600, delay: 400 },
                }}
                className="items-center"
              >
                {}
                <View className="flex-row items-center justify-center mb-4">
                  <MotiView
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: isReady ? [1, 0.7, 1] : 1,
                    }}
                    transition={{
                      scale: {
                        type: "timing",
                        duration: 2000,
                        loop: !!isReady,
                      },
                      opacity: {
                        type: "timing",
                        duration: 2000,
                        loop: !!isReady,
                      },
                    }}
                    className={`w-4 h-4 rounded-full mr-3 ${
                      !isReady ? "bg-gray-400" : "bg-green-500"
                    }`}
                  />
                  <Text
                    className={`text-base font-semibold text-center ${
                      !isReady ? "text-gray-400" : "text-green-400"
                    }`}
                  >
                    {!authState.isInitialized
                      ? "Checking authentication..."
                      : isConnected === null
                        ? "Checking connection..."
                        : !imagesLoaded
                          ? "Loading assets..."
                          : !isConnected
                            ? "No internet connection"
                            : `Connected via ${connectionType}`}
                  </Text>
                </View>

                {}
                {isReady && (
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      opacity: { type: "timing", duration: 400, delay: 800 },
                    }}
                    className="items-center"
                  >
                    <Text className="text-sm text-center text-gray-300">
                      <Text className="text-[#6366F1] font-semibold">Tap</Text>{" "}
                      the logo to{" "}
                      {authState.isAuthenticated
                        ? "continue to dashboard"
                        : "get started"}
                    </Text>
                  </MotiView>
                )}

                {}
                {!isConnected && isConnected !== null && (
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      opacity: { type: "timing", duration: 400, delay: 800 },
                    }}
                    className="items-center"
                  >
                    <Text className="text-sm font-medium text-center text-red-300 max-w-64">
                      Please check your internet connection to continue
                    </Text>
                  </MotiView>
                )}
              </MotiView>
            </MotiView>
          </MotiView>

          {}
          <View className="absolute items-center bottom-20">
            <Text className="text-xs font-medium text-center text-gray-500">
              SpendSight v1.0
            </Text>
            <Text className="mt-1 text-xs text-center text-gray-600">
              All rights reserved By Developer : Chamath Dilshan
            </Text>
          </View>

          {}
          <Image
            source={GET_STARTED_BG}
            className="absolute w-0 h-0 opacity-0"
            onLoad={() => setImagesLoaded(true)}
            onError={() => setImagesLoaded(true)}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
