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
import { SafeAreaView } from "react-native-safe-area-context";
import "../global.css";
import { NavigationManager } from "../utils/navigationManager";

const LOGO = require("../assets/images/SpendSightLogo.png");
// Preload the GetStarted background image
const GET_STARTED_BG = require("../assets/images/GetStartBG.png");

export default function App() {
  const router = useRouter();
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [connectionType, setConnectionType] = useState<string>("");
  const [isNavigating, setIsNavigating] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);

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

  // Preload images
  useEffect(() => {
    const preloadImages = async () => {
      try {
        // Preload the GetStarted background image
        await Image.prefetch(Image.resolveAssetSource(GET_STARTED_BG).uri);
        setImagesLoaded(true);
      } catch (error) {
        console.log("Image preloading failed:", error);
        setImagesLoaded(true); // Continue anyway
      }
    };

    preloadImages();
  }, []);

  // Modern slide navigation function
  const navigateWithSlideAnimation = () => {
    setIsNavigating(true);

    // Add a slight delay to show the slide animation
    setTimeout(() => {
      // Use replace to prevent back navigation to splash screen
      NavigationManager.navigateToGetStarted();
    }, 300);
  };

  // Auto-navigate after 2.5 seconds if connected and images loaded
  useEffect(() => {
    if (isConnected && imagesLoaded) {
      const timer = setTimeout(() => {
        navigateWithSlideAnimation();
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [isConnected, imagesLoaded, router]);

  const handleGetStarted = () => {
    if (isConnected && imagesLoaded) {
      navigateWithSlideAnimation();
    } else {
      Alert.alert(
        "Please Wait",
        !isConnected
          ? "Please check your internet connection and try again."
          : "Loading assets, please wait...",
        [{ text: "OK", style: "default" }]
      );
    }
  };

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#1a1a1a" }}
      edges={["top"]}
    >
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />

      <View className="flex-1" style={{ backgroundColor: "#1a1a1a" }}>
        <View className="items-center justify-center flex-1">
          {/* Main Content - Centered with slide animation */}
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
              {/* Logo */}
              <TouchableOpacity
                onPress={handleGetStarted}
                activeOpacity={0.8}
                className="items-center justify-center p-4 mb-8 rounded-3xl"
                style={{
                  shadowColor: "#6366F1",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12,
                }}
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
                <View
                  className="flex-row items-center px-4 py-3 mb-4 bg-gray-900/50 rounded-2xl backdrop-blur-sm"
                  style={{
                    shadowColor: "#000000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.25,
                    shadowRadius: 12,
                    elevation: 8,
                  }}
                >
                  <MotiView
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: isConnected && imagesLoaded ? [1, 0.7, 1] : 1,
                    }}
                    transition={{
                      scale: {
                        type: "timing",
                        duration: 2000,
                        loop: !!(isConnected && imagesLoaded),
                      },
                      opacity: {
                        type: "timing",
                        duration: 2000,
                        loop: !!(isConnected && imagesLoaded),
                      },
                    }}
                    className={`w-4 h-4 rounded-full mr-3 ${
                      isConnected === null || !imagesLoaded
                        ? "bg-gray-400"
                        : isConnected
                          ? "bg-green-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      shadowColor:
                        isConnected === null || !imagesLoaded
                          ? "#9CA3AF"
                          : isConnected
                            ? "#10B981"
                            : "#EF4444",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.6,
                      shadowRadius: 4,
                      elevation: 4,
                    }}
                  />
                  <Text
                    className={`text-base font-semibold ${
                      isConnected === null || !imagesLoaded
                        ? "text-gray-400"
                        : isConnected
                          ? "text-green-400"
                          : "text-red-400"
                    }`}
                  >
                    {isConnected === null
                      ? "Checking connection..."
                      : !imagesLoaded
                        ? "Loading assets..."
                        : isConnected
                          ? `Connected via ${connectionType}`
                          : "No internet connection"}
                  </Text>
                </View>

                {/* Action Text */}
                {isConnected && imagesLoaded && (
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      opacity: { type: "timing", duration: 400, delay: 800 },
                    }}
                    className="px-6 py-3 bg-gray-800/60 rounded-2xl backdrop-blur-sm"
                    style={{
                      shadowColor: "#6366F1",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-sm text-center text-gray-300">
                      <Text className="text-[#6366F1] font-semibold">Tap</Text>{" "}
                      the logo to get started
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
                    className="px-6 py-3 border bg-red-900/40 rounded-2xl backdrop-blur-sm border-red-500/30"
                    style={{
                      shadowColor: "#EF4444",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-sm font-medium text-center text-red-300 max-w-64">
                      Please check your internet connection to continue
                    </Text>
                  </MotiView>
                )}

                {isConnected && !imagesLoaded && (
                  <MotiView
                    from={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{
                      opacity: { type: "timing", duration: 400, delay: 800 },
                    }}
                    className="px-6 py-3 border bg-gray-800/40 rounded-2xl backdrop-blur-sm border-gray-600/30"
                    style={{
                      shadowColor: "#6B7280",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text className="text-sm font-medium text-center text-gray-400 max-w-64">
                      Preparing your experience...
                    </Text>
                  </MotiView>
                )}
              </MotiView>
            </MotiView>
          </MotiView>

          {/* Footer Info */}
          <View className="absolute items-center px-4 bottom-20">
            <View
              className="px-4 py-2 bg-gray-900/50 rounded-2xl backdrop-blur-sm"
              style={{
                shadowColor: "#000000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text className="text-xs font-medium text-gray-500">
                SpendSight v1.0
              </Text>
              <Text className="mt-1 text-xs text-center text-gray-600">
                All rights reserved By Developer : Chamath Dilshan
              </Text>
            </View>
          </View>

          {/* Hidden image for preloading */}
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
