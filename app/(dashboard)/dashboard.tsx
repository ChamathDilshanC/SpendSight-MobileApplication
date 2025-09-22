import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AnimatedAccountCard } from "../../components/AnimatedAccountCard";
import NavigationDrawer from "../../components/NavigationDrawer";
import { NavigationShortcuts } from "../../components/NavigationShortcuts";
import { ProtectedRoute } from "../../components/ProtectedRoute";
import { useFinance } from "../../context/FinanceContext";
import { useAuth } from "../../context/FirebaseAuthContext";
import { useDashboardBackButton } from "../../hooks/useBackButton";
import { AccountService } from "../../services/AccountService";
import { NavigationManager } from "../../utils/navigationManager";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

const DashboardContent = () => {
  const { authState, logout } = useAuth();
  const { accounts } = useFinance();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);


  const autoSwipeTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUserInteracting = useRef(false);
  const componentMounted = useRef(true);
  const [autoSwipeEnabled, setAutoSwipeEnabled] = useState(true);


  const autoSwipeInterval = 4000;
  const loopAutoSwipe = true;

  useDashboardBackButton(true);

  const slideAnim = useSharedValue(-DRAWER_WIDTH);
  const overlayAnim = useSharedValue(0);


  const clearAutoSwipeTimer = useCallback(() => {
    if (autoSwipeTimerRef.current) {
      clearTimeout(autoSwipeTimerRef.current);
      autoSwipeTimerRef.current = null;
    }
  }, []);


  const doAutoSwipe = useCallback(() => {
    if (
      !componentMounted.current ||
      !accounts ||
      accounts.length <= 1 ||
      isUserInteracting.current ||
      !autoSwipeEnabled
    ) {
      return;
    }

    let nextIndex = currentAccountIndex + 1;
    if (nextIndex >= accounts.length) {
      if (loopAutoSwipe) {
        nextIndex = 0;
      } else {
        return;
      }
    }

    setCurrentAccountIndex(nextIndex);
  }, [currentAccountIndex, accounts, loopAutoSwipe, autoSwipeEnabled]);


  const startAutoSwipeTimer = useCallback(() => {
    if (!autoSwipeEnabled || !accounts || accounts.length <= 1) {
      return;
    }

    clearAutoSwipeTimer();

    if (componentMounted.current && !isUserInteracting.current) {
      autoSwipeTimerRef.current = setTimeout(() => {
        if (componentMounted.current && !isUserInteracting.current) {
          doAutoSwipe();
        }
      }, autoSwipeInterval);
    }
  }, [
    autoSwipeEnabled,
    accounts,
    autoSwipeInterval,
    clearAutoSwipeTimer,
    doAutoSwipe,
  ]);


  const toggleAutoSwipe = useCallback(() => {
    setAutoSwipeEnabled((prev) => {
      const newState = !prev;
      if (!newState) {
        clearAutoSwipeTimer();
      } else {
        startAutoSwipeTimer();
      }
      return newState;
    });
  }, [clearAutoSwipeTimer, startAutoSwipeTimer]);


  useEffect(() => {
    if (autoSwipeEnabled && accounts && accounts.length > 1) {
      startAutoSwipeTimer();
    } else {
      clearAutoSwipeTimer();
    }

    return clearAutoSwipeTimer;
  }, [
    currentAccountIndex,
    autoSwipeEnabled,
    accounts,
    startAutoSwipeTimer,
    clearAutoSwipeTimer,
  ]);


  useEffect(() => {
    return () => {
      componentMounted.current = false;
      clearAutoSwipeTimer();
    };
  }, [clearAutoSwipeTimer]);

  useEffect(() => {
    const checkFirstTimeUser = async () => {
      if (authState?.user?.id && !authState.isLoading) {
        try {
          console.log(
            "🔍 Dashboard: Auth state stable, checking accounts for first-time user..."
          );

          const userAccounts = await AccountService.getUserAccounts(
            authState.user.id
          );
          console.log(`📊 Found ${userAccounts.length} accounts for user`);

          if (userAccounts.length === 0) {
            console.log("📝 First-time user detected, showing budget prompt");
            setTimeout(() => {
              showBudgetPrompt();
            }, 1000);
          } else {
            console.log("✅ Existing user with accounts, no setup needed");
          }
        } catch (error) {
          console.error("❌ Error checking user accounts:", error);
        }
      } else if (authState?.isLoading) {
        console.log("⏳ Auth state still loading, waiting...");
      } else if (!authState?.user?.id) {
        console.log("❌ No authenticated user found");
      }
    };

    checkFirstTimeUser();
  }, [authState?.user?.id, authState?.isLoading]);

  const showBudgetPrompt = () => {
    Alert.alert(
      "Welcome to SpendSight! 🎉",
      "Let's set up your accounts with smart budget allocation.\n\nWould you like to enter your monthly salary/budget to get started?",
      [
        {
          text: "Skip for Now",
          style: "cancel",
          onPress: () => {
            console.log("💡 User skipped budget setup, will show in accounts");
          },
        },
        {
          text: "Set Up Budget",
          onPress: () => {
            promptForBudgetAmount();
          },
        },
      ]
    );
  };

  const promptForBudgetAmount = () => {
    Alert.prompt(
      "Budget Setup",
      "Enter your monthly salary/budget:",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Continue",
          onPress: (text: string | undefined) => {
            if (text && text.trim()) {
              handleBudgetSetup(text.trim());
            } else {
              Alert.alert("Error", "Please enter a valid amount", [
                { text: "Try Again", onPress: () => promptForBudgetAmount() },
                { text: "Cancel", style: "cancel" },
              ]);
            }
          },
        },
      ],
      "plain-text",
      "",
      "numeric"
    );
  };

  const handleBudgetSetup = async (budgetInput: string) => {
    if (!authState?.user?.id) {
      Alert.alert("Error", "User not authenticated");
      return;
    }

    const budget = parseFloat(budgetInput);
    if (budget <= 0 || isNaN(budget)) {
      Alert.alert("Error", "Please enter a valid budget amount", [
        { text: "Try Again", onPress: () => promptForBudgetAmount() },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }

    Alert.alert(
      "Budget Allocation Preview",
      `Your $${budget.toFixed(0)} will be allocated across 6 smart accounts:\n\n• Main Account (35%): $${(budget * 0.35).toFixed(0)}\n• Savings Account (20%): $${(budget * 0.2).toFixed(0)}\n• Expenses Account (25%): $${(budget * 0.25).toFixed(0)}\n• Investment Account (10%): $${(budget * 0.1).toFixed(0)}\n• Emergency Fund (5%): $${(budget * 0.05).toFixed(0)}\n• Goals & Dreams (5%): $${(budget * 0.05).toFixed(0)}\n\nProceed with this allocation?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Create Accounts",
          onPress: () => createAccountsWithBudget(budget),
        },
      ]
    );
  };

  const createAccountsWithBudget = async (budget: number) => {
    try {
      setLoading(true);
      await AccountService.initializeAccountsWithBudget(
        authState!.user!.id,
        budget
      );

      Alert.alert(
        "Success! 🎉",
        `Your accounts have been set up successfully!\n\n6 accounts created with smart budget allocation:\n• Main Account: $${(budget * 0.35).toFixed(0)}\n• Savings Account: $${(budget * 0.2).toFixed(0)}\n• Expenses Account: $${(budget * 0.25).toFixed(0)}\n• Investment Account: $${(budget * 0.1).toFixed(0)}\n• Emergency Fund: $${(budget * 0.05).toFixed(0)}\n• Goals & Dreams: $${(budget * 0.05).toFixed(0)}`,
        [{ text: "Get Started!" }]
      );
    } catch (error) {
      console.error("❌ Error setting up budget:", error);
      Alert.alert(
        "Error",
        "Failed to set up your accounts. Please try again.",
        [
          { text: "Try Again", onPress: () => promptForBudgetAmount() },
          { text: "Cancel", style: "cancel" },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const overlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: overlayAnim.value,
    };
  });

  const drawerAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideAnim.value }],
    };
  });

  const handleLogout = async () => {
    Alert.alert(
      "Logout Confirmation",
      "You will be signed out of your SpendSight account. Your data will be saved and you can sign back in anytime.",
      [
        {
          text: "Stay Logged In",
          style: "cancel",
          onPress: () => {
            console.log("🚫 User chose to stay logged in");
          },
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              console.log("🚪 User confirmed logout, proceeding...");
              await logout();
              console.log(
                "✅ Logout successful, auth state will handle navigation"
              );
            } catch (error) {
              console.error("❌ Logout error:", error);
              Alert.alert(
                "Logout Failed",
                "An error occurred while logging out. Please try again.",
                [{ text: "OK", style: "default" }]
              );
            }
          },
        },
      ],
      {
        cancelable: true,
        userInterfaceStyle: "light",
      }
    );
  };

  const openDrawer = () => {

    isUserInteracting.current = true;
    clearAutoSwipeTimer();

    setIsDrawerVisible(true);

    slideAnim.value = withTiming(0, {
      duration: 350,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });

    overlayAnim.value = withTiming(1, {
      duration: 350,
      easing: Easing.bezier(0.25, 0.46, 0.45, 0.94),
    });
  };

  const closeDrawer = () => {
    slideAnim.value = withTiming(-DRAWER_WIDTH, {
      duration: 300,
      easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
    });

    overlayAnim.value = withTiming(0, {
      duration: 300,
      easing: Easing.bezier(0.55, 0.06, 0.68, 0.19),
    });

    setTimeout(() => {
      setIsDrawerVisible(false);

      if (componentMounted.current) {
        isUserInteracting.current = false;
        if (autoSwipeEnabled) {
          startAutoSwipeTimer();
        }
      }
    }, 300);
  };


  const handleAccountSwipe = useCallback(
    (newIndex: number) => {

      isUserInteracting.current = true;
      clearAutoSwipeTimer();

      setCurrentAccountIndex(newIndex);


      setTimeout(() => {
        if (componentMounted.current) {
          isUserInteracting.current = false;
          if (autoSwipeEnabled) {
            startAutoSwipeTimer();
          }
        }
      }, 2000);
    },
    [clearAutoSwipeTimer, startAutoSwipeTimer, autoSwipeEnabled]
  );

  const handleNavigationShortcut = (route: string) => {
    console.log(`🚀 Dashboard: Navigating to ${route}`);
    NavigationManager.navigateToMainSection(route);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <SafeAreaView className="flex-1 bg-gray-50">
        {}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
          <TouchableOpacity
            className="p-3 rounded-lg min-w-[44px] min-h-[44px] justify-center items-center active:bg-gray-100"
            onPress={openDrawer}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={28} color="#1f2937" />
          </TouchableOpacity>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 100,
            }}
          >
            <Text className="text-xl font-bold text-gray-900">SpendSight</Text>
          </MotiView>

          <TouchableOpacity
            className="p-3 rounded-lg min-w-[44px] min-h-[44px] justify-center items-center active:bg-gray-100"
            onPress={handleLogout}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="log-out" size={24} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {}
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          onScrollBeginDrag={() => {

            isUserInteracting.current = true;
            clearAutoSwipeTimer();
          }}
          onScrollEndDrag={() => {

            setTimeout(() => {
              if (componentMounted.current) {
                isUserInteracting.current = false;
                if (autoSwipeEnabled) {
                  startAutoSwipeTimer();
                }
              }
            }, 1000);
          }}
        >
          {}
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "timing",
              duration: 600,
              delay: 200,
            }}
            className="px-5 pt-6 pb-4"
          >
            <Text className="pb-1 pl-4 text-2xl font-bold text-gray-900">
              Welcome back,
            </Text>
            <Text className="pb-2 pl-4 text-base text-gray-600">
              {authState?.user?.fullName &&
              typeof authState.user.fullName === "string"
                ? authState.user.fullName
                : authState?.user?.email?.split("@")[0] || "User"}
            </Text>
          </MotiView>

          {}
          {accounts && accounts.length > 1 && (
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                type: "spring",
                damping: 15,
                stiffness: 100,
                delay: 300,
              }}
              className="flex-row items-center justify-center mb-3"
            >
              <TouchableOpacity
                onPress={toggleAutoSwipe}
                className="flex-row items-center px-4 py-2 bg-white border border-gray-200 rounded-full shadow-sm"
                activeOpacity={0.7}
              >
                <MotiView
                  animate={{
                    rotate:
                      autoSwipeEnabled && !isUserInteracting.current
                        ? "360deg"
                        : "0deg",
                  }}
                  transition={{
                    type: "timing",
                    duration: autoSwipeInterval,
                    loop: autoSwipeEnabled && !isUserInteracting.current,
                  }}
                >
                  <Ionicons
                    name={autoSwipeEnabled ? "pause" : "play"}
                    size={14}
                    color={autoSwipeEnabled ? "#EF4444" : "#10B981"}
                  />
                </MotiView>
                <Text
                  className={`text-xs font-medium ml-2 ${autoSwipeEnabled ? "text-red-600" : "text-green-600"}`}
                >
                  {autoSwipeEnabled ? "Auto-Playing" : "Paused"}
                </Text>
              </TouchableOpacity>
            </MotiView>
          )}

          {}
          <MotiView
            from={{ opacity: 0, translateY: 30 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 80,
              delay: 400,
            }}
            className="mb-4"
          >
            <AnimatedAccountCard
              accounts={accounts}
              currentIndex={currentAccountIndex}
              onSwipe={handleAccountSwipe}
            />
          </MotiView>

          {}
          <MotiView
            from={{ opacity: 0, translateY: 40 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 80,
              delay: 600,
            }}
          >
            <NavigationShortcuts onNavigate={handleNavigationShortcut} />
          </MotiView>

          {}
          <MotiView
            from={{ opacity: 0, translateY: 50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 80,
              delay: 800,
            }}
            className="px-5 mt-8"
          >
            <View className="flex-row items-center justify-between pl-4 mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                Recent Activity
              </Text>
              <TouchableOpacity
                onPress={() => handleNavigationShortcut("/(transaction)")}
                activeOpacity={0.7}
              >
                <Text className="pr-4 text-sm font-medium text-blue-600">
                  View All
                </Text>
              </TouchableOpacity>
            </View>
          </MotiView>

          {}
          <View className="items-center px-5 mt-8">
            <Text className="text-xs text-gray-600">SpendSight v1.0</Text>
            <Text className="mt-1 text-xs text-gray-600">
              All rights reserved By Developer : Chamath Dilshan
            </Text>
          </View>
        </ScrollView>

        {}
        {isDrawerVisible && (
          <NavigationDrawer
            isVisible={isDrawerVisible}
            onClose={closeDrawer}
            overlayAnimatedStyle={overlayAnimatedStyle}
            drawerAnimatedStyle={drawerAnimatedStyle}
          />
        )}
      </SafeAreaView>
    </>
  );
};

const Dashboard = () => {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
};

export default Dashboard;
