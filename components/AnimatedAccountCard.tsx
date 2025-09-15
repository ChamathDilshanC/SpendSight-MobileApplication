import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useEffect } from "react";
import { Dimensions, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Account } from "../types/finance";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;
const SWIPE_THRESHOLD = 50;

interface AnimatedAccountCardProps {
  accounts: Account[];
  currentIndex: number;
  onSwipe: (newIndex: number) => void;
}

export const AnimatedAccountCard: React.FC<AnimatedAccountCardProps> = ({
  accounts,
  currentIndex,
  onSwipe,
}) => {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withSpring(0);
    scale.value = withSpring(1);
    opacity.value = withTiming(1);
  }, [currentIndex]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      scale.value = withSpring(0.95);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;

      // Add resistance at edges
      if (currentIndex === 0 && event.translationX > 0) {
        translateX.value = event.translationX * 0.3;
      }
      if (currentIndex === accounts.length - 1 && event.translationX < 0) {
        translateX.value = event.translationX * 0.3;
      }
    })
    .onEnd((event) => {
      scale.value = withSpring(1);

      const shouldSwipeLeft =
        event.translationX < -SWIPE_THRESHOLD &&
        currentIndex < accounts.length - 1;
      const shouldSwipeRight =
        event.translationX > SWIPE_THRESHOLD && currentIndex > 0;

      if (shouldSwipeLeft) {
        translateX.value = withSpring(-CARD_WIDTH, {}, () => {
          runOnJS(onSwipe)(currentIndex + 1);
        });
      } else if (shouldSwipeRight) {
        translateX.value = withSpring(CARD_WIDTH, {}, () => {
          runOnJS(onSwipe)(currentIndex - 1);
        });
      } else {
        translateX.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  const formatCurrency = (amount: number): string => {
    return `$${amount.toFixed(2)}`;
  };

  const getAccountIcon = (type: string): string => {
    switch (type) {
      case "main":
        return "card";
      case "savings":
        return "trending-up";
      case "expenses":
        return "trending-down";
      default:
        return "wallet";
    }
  };

  const getAccountColor = (type: string, color: string): string => {
    if (color) return color;
    switch (type) {
      case "main":
        return "#3B82F6";
      case "savings":
        return "#10B981";
      case "expenses":
        return "#EF4444";
      default:
        return "#6366F1";
    }
  };

  if (!accounts || accounts.length === 0) {
    return (
      <View className="items-center justify-center h-48 mx-5 bg-gray-100 rounded-2xl">
        <Text className="text-gray-500">No accounts available</Text>
      </View>
    );
  }

  const currentAccount = accounts[currentIndex];

  return (
    <View className="items-center">
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[{ width: CARD_WIDTH }, animatedStyle]}>
          <MotiView
            from={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 150,
            }}
            className="p-6 mx-2 shadow-lg bg-gradient-to-br rounded-2xl"
            style={{
              backgroundColor: getAccountColor(
                currentAccount.type,
                currentAccount.color
              ),
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {/* Account Header */}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <View className="items-center justify-center w-10 h-10 bg-white rounded-full bg-opacity-20">
                  <Ionicons
                    name={getAccountIcon(currentAccount.type) as any}
                    size={20}
                    color="white"
                  />
                </View>
                <View className="ml-3">
                  <Text className="text-base font-semibold text-white">
                    {currentAccount.name}
                  </Text>
                  <Text className="text-sm text-white opacity-80">
                    {currentAccount.type.charAt(0).toUpperCase() +
                      currentAccount.type.slice(1)}{" "}
                    Account
                  </Text>
                </View>
              </View>
              <View className="items-center">
                <Text className="text-xs text-white opacity-70">
                  {currentIndex + 1} of {accounts.length}
                </Text>
              </View>
            </View>

            {/* Account Balance */}
            <View className="mb-6">
              <Text className="text-sm text-white opacity-80">
                Current Balance
              </Text>
              <Text className="text-3xl font-bold text-white">
                {formatCurrency(currentAccount.balance)}
              </Text>
            </View>

            {/* Account Status */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-2 h-2 bg-white rounded-full opacity-80" />
                <Text className="ml-2 text-sm text-white opacity-80">
                  {currentAccount.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
              <Text className="text-xs text-white opacity-60">
                {currentAccount.currency}
              </Text>
            </View>
          </MotiView>
        </Animated.View>
      </GestureDetector>

      {/* Navigation Dots */}
      <View className="flex-row justify-center mt-4 space-x-2">
        {accounts.map((_, index) => (
          <MotiView
            key={index}
            from={{ scale: 0.8 }}
            animate={{
              scale: index === currentIndex ? 1.2 : 0.8,
              opacity: index === currentIndex ? 1 : 0.5,
            }}
            transition={{
              type: "spring",
              damping: 15,
            }}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? "bg-blue-500" : "bg-gray-300"
            }`}
          />
        ))}
      </View>

      {/* Swipe Hint */}
      {accounts.length > 1 && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 0.7, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 1000,
            delay: 500,
          }}
          className="items-center mt-3"
        >
          <View className="flex-row items-center space-x-2">
            <Ionicons name="chevron-back" size={16} color="#9CA3AF" />
            <Text className="text-xs text-gray-400">
              Swipe to see other accounts
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </View>
        </MotiView>
      )}
    </View>
  );
};
