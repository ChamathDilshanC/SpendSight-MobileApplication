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

  // Use Reanimated shared values instead of Animated.Value
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
        <View className="flex-row items-center justify-between bg-white px-5 py-4 border-b border-gray-200">
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
        <View className="flex-1 justify-center items-center p-5">
          <Text className="text-3xl font-bold text-gray-900 mb-3">
            Welcome to SpendSight
          </Text>
          <Text className="text-lg text-gray-600 mb-1">
            Hello, {authState.user?.fullName || "User"}!
          </Text>
          <Text className="text-base text-gray-500 mb-10">
            {authState.user?.email}
          </Text>

          <TouchableOpacity
            className="bg-red-500 px-8 py-4 rounded-xl active:bg-red-600"
            onPress={handleLogout}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold">Logout</Text>
          </TouchableOpacity>

          {/* Temporary test button for drawer */}
          <TouchableOpacity
            className="bg-blue-500 px-8 py-4 rounded-xl mt-5 active:bg-blue-600"
            onPress={openDrawer}
            activeOpacity={0.8}
          >
            <Text className="text-white text-base font-semibold">
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
