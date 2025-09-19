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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NavigationManager } from "../utils/navigationManager";
import NavigationDrawer from "./NavigationDrawer";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightComponent?: React.ReactNode;
  backgroundColor?: string;
  textColor?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = false,
  onBackPress,
  rightComponent,
  backgroundColor = "#ffffff",
  textColor = "#1f2937",
}) => {
  const insets = useSafeAreaInsets();
  const [isDrawerVisible, setIsDrawerVisible] = useState(false);

  // Animation values for drawer
  const slideAnim = useSharedValue(-DRAWER_WIDTH);
  const overlayAnim = useSharedValue(0);

  // Animated styles
  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayAnim.value,
  }));

  const drawerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideAnim.value }],
  }));

  const toggleDrawer = () => {
    console.log(
      "🍔 AppHeader: Toggling drawer, current state:",
      isDrawerVisible
    );

    if (isDrawerVisible) {
      closeDrawer();
    } else {
      openDrawer();
    }
  };

  const openDrawer = () => {
    console.log("🍔 AppHeader: Opening drawer");
    setIsDrawerVisible(true);

    slideAnim.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.ease),
    });
    overlayAnim.value = withTiming(1, {
      duration: 350,
      easing: Easing.out(Easing.ease),
    });
  };

  const closeDrawer = () => {
    console.log("🍔 AppHeader: Closing drawer");

    slideAnim.value = withTiming(-DRAWER_WIDTH, {
      duration: 300,
      easing: Easing.in(Easing.ease),
    });
    overlayAnim.value = withTiming(0, {
      duration: 300,
      easing: Easing.in(Easing.ease),
    });

    // Delay hiding the drawer component to allow animation to complete
    setTimeout(() => {
      setIsDrawerVisible(false);
    }, 300);
  };

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      // Default back behavior - go to dashboard
      console.log(
        "🔙 AppHeader: No custom back action, navigating to dashboard"
      );
      NavigationManager.navigateToDashboardSection();
    }
  };

  return (
    <>
      <View
        className="border-b border-gray-200 shadow-sm"
        style={{
          backgroundColor,
          paddingTop: insets.top + 8,
          paddingBottom: 12,
        }}
      >
        <StatusBar
          barStyle={
            backgroundColor === "#ffffff" ? "dark-content" : "light-content"
          }
          backgroundColor={backgroundColor}
        />

        <View className="flex-row items-center justify-between px-4">
          {/* Left Side - Hamburger or Back Button */}
          <TouchableOpacity
            className="p-2 -ml-2 rounded-lg active:bg-gray-100"
            onPress={showBackButton ? handleBackPress : toggleDrawer}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={showBackButton ? "arrow-back" : "menu"}
              size={24}
              color={textColor}
            />
          </TouchableOpacity>

          {/* Center - Title */}
          <Text
            className="flex-1 mx-4 text-lg font-semibold text-center"
            style={{ color: textColor }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>

          {/* Right Side - Optional Component */}
          <View className="items-center w-10">
            {rightComponent || <View />}
          </View>
        </View>
      </View>

      {/* Navigation Drawer */}
      {isDrawerVisible && (
        <NavigationDrawer
          isVisible={isDrawerVisible}
          onClose={closeDrawer}
          overlayAnimatedStyle={overlayAnimatedStyle}
          drawerAnimatedStyle={drawerAnimatedStyle}
        />
      )}
    </>
  );
};

export default AppHeader;
