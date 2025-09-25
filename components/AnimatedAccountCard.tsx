import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useCallback, useEffect } from "react";
import { Dimensions, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useAuth } from "../context/FirebaseAuthContext";
import { AccountService, CurrencyType } from "../services/AccountService";
import { Account } from "../types/finance";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = SCREEN_WIDTH - 40;
const SWIPE_THRESHOLD = 50;

const FAST_SPRING_CONFIG = {
  damping: 20,
  stiffness: 300,
  mass: 0.8,
};

const FAST_TIMING_CONFIG = {
  duration: 200,
};

interface AnimatedAccountCardProps {
  accounts: Account[];
  currentIndex: number;
  onSwipe: (newIndex: number) => void;
}

const useCurrency = () => {
  const { authState } = useAuth();
  const userCurrency: CurrencyType =
    authState?.user?.preferences?.currency || "USD";

  const formatCurrency = (amount: number): string => {
    return AccountService.formatCurrency(amount, userCurrency);
  };

  const getCurrencySymbol = (): string => {
    return AccountService.getCurrencySymbol(userCurrency);
  };

  return {
    currency: userCurrency,
    formatCurrency,
    getCurrencySymbol,
  };
};

export const AnimatedAccountCard: React.FC<AnimatedAccountCardProps> = ({
  accounts,
  currentIndex,
  onSwipe,
}) => {
  const { formatCurrency, currency } = useCurrency();
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateX.value = withSpring(0, FAST_SPRING_CONFIG);
    scale.value = withSpring(1, FAST_SPRING_CONFIG);
    opacity.value = withTiming(1, { duration: 150 });
  }, [currentIndex]);

  const handleManualSwipe = useCallback(
    (direction: "left" | "right") => {
      if (!accounts || accounts.length === 0) return;

      let newIndex = currentIndex;

      if (direction === "left" && currentIndex < accounts.length - 1) {
        newIndex = currentIndex + 1;
      } else if (direction === "right" && currentIndex > 0) {
        newIndex = currentIndex - 1;
      } else {
        return;
      }

      try {
        onSwipe(newIndex);
      } catch (error) {
        console.error("Manual swipe error:", error);
      }
    },
    [currentIndex, accounts, onSwipe]
  );

  const panGesture = Gesture.Pan()
    .onStart(() => {
      "worklet";
      scale.value = withSpring(0.95, {
        damping: 15,
        stiffness: 200,
      });
    })
    .onUpdate((event) => {
      "worklet";
      if (!accounts || accounts.length === 0) return;

      translateX.value = event.translationX;

      if (currentIndex === 0 && event.translationX > 0) {
        translateX.value = event.translationX * 0.3;
      }
      if (currentIndex === accounts.length - 1 && event.translationX < 0) {
        translateX.value = event.translationX * 0.3;
      }
    })
    .onEnd((event) => {
      "worklet";
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });

      if (!accounts || accounts.length === 0) {
        return;
      }

      const shouldSwipeLeft =
        event.translationX < -SWIPE_THRESHOLD &&
        currentIndex < accounts.length - 1;
      const shouldSwipeRight =
        event.translationX > SWIPE_THRESHOLD && currentIndex > 0;

      if (shouldSwipeLeft) {
        translateX.value = withTiming(
          -CARD_WIDTH,
          FAST_TIMING_CONFIG,
          (finished) => {
            if (finished) {
              runOnJS(handleManualSwipe)("left");
            }
          }
        );
      } else if (shouldSwipeRight) {
        translateX.value = withTiming(
          CARD_WIDTH,
          FAST_TIMING_CONFIG,
          (finished) => {
            if (finished) {
              runOnJS(handleManualSwipe)("right");
            }
          }
        );
      } else {
        translateX.value = withSpring(0, FAST_SPRING_CONFIG);
      }
    })
    .onFinalize(() => {
      "worklet";
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 200,
      });
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }, { scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const getAccountIcon = (account: Account): string => {
    if (account?.icon) {
      return account.icon;
    }

    switch (account?.type) {
      case "main":
        return "card-outline";
      case "savings":
        return "trending-up-outline";
      case "expenses":
        return "trending-down-outline";
      default:
        return "wallet-outline";
    }
  };

  const getAccountColor = (account: Account): string => {
    if (account?.color) {
      return account.color;
    }

    switch (account?.type) {
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

  const getAccountTypeDisplay = (type: string): string => {
    switch (type) {
      case "main":
        return "Main";
      case "savings":
        return "Savings";
      case "expenses":
        return "Expenses";
      case "custom":
        return "Custom";
      default:
        return "Unknown";
    }
  };

  if (!accounts || accounts.length === 0) {
    return (
      <View className="items-center justify-center h-48 mx-5 bg-gray-100 rounded-2xl">
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: "spring",
            damping: 15,
            stiffness: 200,
          }}
          className="items-center"
        >
          <Ionicons name="wallet-outline" size={48} color="#9CA3AF" />
          <Text className="mt-2 text-base font-medium text-gray-500">
            No accounts available
          </Text>
          <Text className="mt-1 text-sm text-gray-400">
            Create your first account to get started
          </Text>
        </MotiView>
      </View>
    );
  }

  if (currentIndex < 0 || currentIndex >= accounts.length) {
    return (
      <View className="items-center justify-center h-48 mx-5 bg-gray-100 rounded-2xl">
        <Text className="text-gray-500">Invalid account index</Text>
      </View>
    );
  }

  const currentAccount = accounts[currentIndex];

  if (!currentAccount) {
    return (
      <View className="items-center justify-center h-48 mx-5 bg-gray-100 rounded-2xl">
        <Text className="text-gray-500">Account not found</Text>
      </View>
    );
  }

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
              stiffness: 250,
              mass: 0.8,
            }}
            className="p-6 mx-2 shadow-lg rounded-2xl"
            style={{
              backgroundColor: getAccountColor(currentAccount),
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 10,
            }}
          >
            {}
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <MotiView
                  from={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    damping: 15,
                    stiffness: 200,
                    delay: 100,
                  }}
                  className="items-center justify-center w-10 h-10 bg-white rounded-full bg-opacity-20"
                >
                  <Ionicons
                    name={getAccountIcon(currentAccount) as any}
                    size={20}
                    color="white"
                  />
                </MotiView>
                <View className="ml-3">
                  <MotiView
                    from={{ opacity: 0, translateX: -10 }}
                    animate={{ opacity: 1, translateX: 0 }}
                    transition={{
                      type: "timing",
                      duration: 300,
                      delay: 150,
                    }}
                  >
                    <Text className="text-base font-semibold text-white">
                      {currentAccount.name || "Unnamed Account"}
                    </Text>
                    <Text className="text-sm text-white opacity-80">
                      {getAccountTypeDisplay(currentAccount.type || "custom")}{" "}
                      Account
                    </Text>
                  </MotiView>
                </View>
              </View>
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 15,
                  stiffness: 200,
                  delay: 200,
                }}
                className="items-center"
              >
                <Text className="text-xs text-white opacity-70">
                  {currentIndex + 1} of {accounts.length}
                </Text>
              </MotiView>
            </View>

            {}
            <MotiView
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 200,
                delay: 250,
              }}
              className="mb-6"
            >
              <Text className="text-sm text-white opacity-80">
                Current Balance
              </Text>
              <Text className="text-3xl font-bold text-white">
                {formatCurrency(currentAccount.balance || 0)}
              </Text>
            </MotiView>

            {}
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 200,
                delay: 300,
              }}
              className="mb-4"
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-xs text-white opacity-70">
                    Account Type
                  </Text>
                  <Text className="text-sm font-medium text-white">
                    {getAccountTypeDisplay(currentAccount.type || "custom")}
                  </Text>
                </View>
                <View>
                  <Text className="text-xs text-white opacity-70">
                    Currency
                  </Text>
                  <Text className="text-sm font-medium text-white">
                    {currency}
                  </Text>
                </View>
              </View>
            </MotiView>

            {}
            <MotiView
              from={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 200,
                delay: 350,
              }}
              className="flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View
                  className={`w-2 h-2 rounded-full ${
                    currentAccount.isActive ? "bg-green-300" : "bg-red-300"
                  }`}
                />
                <Text className="ml-2 text-sm text-white opacity-80">
                  {currentAccount.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
              <Text className="text-xs text-white opacity-60">
                ID: {currentAccount.id?.slice(-6) || "N/A"}
              </Text>
            </MotiView>
          </MotiView>
        </Animated.View>
      </GestureDetector>

      {}
      <MotiView
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{
          type: "spring",
          damping: 15,
          stiffness: 200,
          delay: 400,
        }}
        className="flex-row justify-center mt-4 space-x-2"
      >
        {accounts.map((_, index) => {
          const isActive = index === currentIndex;
          return (
            <MotiView
              key={`pagination-dot-${index}`}
              from={{ scale: 0 }}
              animate={{
                scale: isActive ? 1.25 : 1,
                opacity: isActive ? 1 : 0.5,
              }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 200,
                delay: 450 + index * 50,
              }}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: isActive ? "#3B82F6" : "#D1D5DB",
              }}
            />
          );
        })}
      </MotiView>

      {}
      {accounts.length > 1 && (
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 0.7, translateY: 0 }}
          transition={{
            type: "timing",
            duration: 300,
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
