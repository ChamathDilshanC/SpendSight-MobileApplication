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
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View className="flex-1 bg-[#1a1a1a]">
        <View className="flex-1 items-center justify-center bg-[#1a1a1a]">
          {/* Main Content - Centered with slide animation */}
          <MotiView
            className="items-center justify-center flex-1 bg-[#1a1a1a]"
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
                    className={`w-3 h-3 rounded-full mr-3 ${
                      isConnected === null || !imagesLoaded
                        ? "bg-gray-400"
                        : isConnected
                          ? "bg-green-500"
                          : "bg-red-500"
                    }`}
                  />
                  <Text
                    className={`text-base font-medium ${
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
                  >
                    <Text className="text-sm text-center text-gray-300">
                      <Text className="text-[#0077CC]">Tap</Text> the logo to
                      get started
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
                    <Text className="text-sm text-center text-red-400 max-w-64">
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
                  >
                    <Text className="text-sm text-center text-gray-400 max-w-64">
                      Preparing your experience...
                    </Text>
                  </MotiView>
                )}
              </MotiView>
            </MotiView>
          </MotiView>
          <View className="absolute items-center bottom-20">
            <Text className="text-xs text-gray-600">SpendSight v1.0</Text>
            <Text className="mt-1 text-xs text-gray-600">
              All rights reserved By Developer : Chamath Dilshan
            </Text>
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
    </>
  );
}
