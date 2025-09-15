import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Dimensions,
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
import NavigationDrawer from "../../components/NavigationDrawer";
import { useAuth } from "../../context/FirebaseAuthContext";
import { NavigationManager } from "../../utils/navigationManager";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

const Dashboard = () => {
  const { authState, logout } = useAuth();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  // Use Reanimated shared values instead of Animated.Value - MUST be called before any returns
  const slideAnim = useSharedValue(-DRAWER_WIDTH);
  const overlayAnim = useSharedValue(0);

  // Create animated styles in parent component to avoid crashes
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

  // Safety check to prevent rendering issues - AFTER all hooks
  if (!authState || !authState.user) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="items-center justify-center flex-1">
          <Text className="text-lg text-gray-600">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleLogout = async () => {
    await logout();
    // Navigate back to auth and clear dashboard history
    NavigationManager.navigateToAuth();
  };

  const openDrawer = () => {
    setIsDrawerVisible(true);

    // Use Reanimated withTiming - simplified without callback
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

    // Use setTimeout instead of animation callback to avoid worklet issues
    setTimeout(() => {
      setIsDrawerVisible(false);
    }, 300);
  };

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <SafeAreaView className="flex-1 bg-white">
        {/* Header with hamburger menu */}
        <View className="flex-row items-center justify-between px-5 py-4 bg-white border-b border-gray-200">
          <TouchableOpacity
            className="p-3 rounded-lg min-w-[44px] min-h-[44px] justify-center items-center active:bg-gray-100"
            onPress={openDrawer}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="menu" size={28} color="#1f2937" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900">SpendSight</Text>
          <View className="w-11" /> {/* Spacer for balance */}
        </View>

        {/* Main content */}
        <View className="items-center justify-center flex-1 p-5">
          <Text className="mb-3 text-3xl font-bold text-gray-900">
            Welcome to SpendSight
          </Text>
          <Text className="mb-1 text-lg text-gray-600">
            Hello,{" "}
            {authState?.user?.fullName &&
            typeof authState.user.fullName === "string"
              ? authState.user.fullName
              : "User"}
            !
          </Text>
          <Text className="mb-10 text-base text-gray-500">
            {authState?.user?.email && typeof authState.user.email === "string"
              ? authState.user.email
              : "No email"}
          </Text>

          <TouchableOpacity
            className="px-8 py-4 bg-red-500 rounded-xl active:bg-red-600"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">Logout</Text>
          </TouchableOpacity>

          {/* Temporary test button for drawer */}
          <TouchableOpacity
            className="px-8 py-4 mt-5 bg-blue-500 rounded-xl active:bg-blue-600"
            onPress={openDrawer}
            activeOpacity={0.8}
          >
            <Text className="text-base font-semibold text-white">
              Test Drawer (Debug)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Drawer with error handling */}
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

export default Dashboard;
