import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/FirebaseAuthContext";
import { UserProfileService } from "../services/UserProfileService";
import { NavigationManager } from "../utils/navigationManager";
import { ProfileImagePicker } from "./ProfileImagePicker";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = SCREEN_WIDTH * 0.75;

interface NavigationDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  overlayAnimatedStyle: ViewStyle;
  drawerAnimatedStyle: ViewStyle;
}

interface DrawerItemProps {
  icon: string;
  title: string;
  onPress: () => void;
  isActive?: boolean;
}

const DrawerItem: React.FC<DrawerItemProps> = ({
  icon,
  title,
  onPress,
  isActive = false,
}) => (
  <TouchableOpacity
    className={
      isActive
        ? "flex-row items-center py-4 px-5 border-b border-emerald-100 min-h-[64px] bg-emerald-50"
        : "flex-row items-center py-4 px-5 border-b border-gray-100 min-h-[64px] active:bg-gray-50"
    }
    onPress={() => {
      console.log(`🎯 DrawerItem clicked: ${title}`);
      onPress();
    }}
    activeOpacity={0.7}
    style={{
      backgroundColor: isActive ? "#ECFDF5" : "transparent",
    }}
  >
    {/* Icon container with proper spacing */}
    <View className="items-center justify-center w-8 h-8 mr-4">
      <Ionicons
        name={icon as any}
        size={22}
        color={isActive ? "#10B981" : "#6B7280"}
      />
    </View>

    <Text
      className={
        isActive
          ? "text-base font-medium flex-1 text-emerald-700"
          : "text-base font-medium flex-1 text-gray-700"
      }
    >
      {title}
    </Text>

    {/* Chevron indicator */}
    <Ionicons
      name="chevron-forward-outline"
      size={16}
      color={isActive ? "#10B981" : "#D1D5DB"}
    />
  </TouchableOpacity>
);

const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isVisible,
  onClose,
  overlayAnimatedStyle,
  drawerAnimatedStyle,
}) => {
  const { authState, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Load user's profile image on component mount
  useEffect(() => {
    const loadProfileImage = async () => {
      if (authState?.user?.id) {
        try {
          // First check if user already has profileImage in authState
          const existingImage =
            authState.user.profileImage || authState.user.profilePicture;
          if (existingImage) {
            setProfileImage(existingImage);
            return;
          }

          // If not, fetch from Firestore
          const imageUrl = await UserProfileService.getUserProfileImage(
            authState.user.id
          );
          setProfileImage(imageUrl);
        } catch (error) {
          console.error("❌ Failed to load profile image:", error);
        }
      }
    };

    loadProfileImage();
  }, [authState?.user?.id, authState?.user?.profileImage]);

  // Add debugging for drawer visibility
  console.log("🎭 NavigationDrawer render - isVisible:", isVisible);

  // Safety check for authState
  if (!authState || !authState.user) {
    console.log("❌ NavigationDrawer: authState or user is missing");
    return null;
  }

  const handleLogout = async () => {
    onClose();
    await logout();
    NavigationManager.navigateToAuth();
  };

  const handleProfileImageUpload = (imageUrl: string) => {
    console.log("✅ Profile image uploaded successfully:", imageUrl);
    setProfileImage(imageUrl);

    // Optionally update the authState context if needed
    // This would require adding a method to update user profile in AuthContext
  };

  const handleProfileImageError = (error: string) => {
    console.error("❌ Profile image upload error:", error);
    Alert.alert("Upload Error", error);
  };

  const navigateToScreen = (screen: string) => {
    console.log(`🎯 NavigationDrawer: User clicked on ${screen}`);
    onClose();

    // Add a small delay to ensure drawer closes before navigation with smoother timing
    setTimeout(() => {
      switch (screen) {
        case "dashboard":
        case "expenses":
          // Navigate to main dashboard (replace current screen)
          console.log(`📱 Navigating to ${screen}...`);
          NavigationManager.navigateToDashboardSection();
          break;
        case "accounts":
          // Navigate to account management screen (replace current screen)
          console.log(`📱 Navigating to accounts...`);
          NavigationManager.navigateToAccountsSection();
          break;
        case "categories":
          // Navigate to categories screen (replace current screen)
          console.log(`📱 Navigating to categories...`);
          NavigationManager.navigateToCategoriesSection();
          break;
        case "help":
          // Navigate to help & support screen (replace current screen)
          console.log(`📱 Navigating to help...`);
          NavigationManager.navigateToHelpSection();
          break;
        case "transactions":
          // Navigate to transaction management screen
          console.log(`📱 Navigating to transactions...`);
          NavigationManager.navigateToTransactionSection();
          break;
        case "history":
          // Navigate to transaction history screen
          console.log(`📱 Navigating to history...`);
          NavigationManager.navigateToHistorySection();
          break;
        case "goals":
          // Navigate to goals management screen
          console.log(`📱 Navigating to goals...`);
          NavigationManager.navigateToGoalsSection();
          break;
        case "analytics":
        case "budget":
        case "notifications":
          // For now, these will show a coming soon message
          console.log(`Navigate to ${screen} - Feature coming soon!`);
          Alert.alert(
            "🚀 Coming Soon",
            `${screen.charAt(0).toUpperCase() + screen.slice(1)} feature is under development and will be available in a future update.`,
            [{ text: "OK", style: "default" }]
          );
          break;
        case "settings":
          // Navigate to settings screen
          console.log(`📱 Navigating to settings...`);
          NavigationManager.navigateToSettingsSection();
          break;
        default:
          console.log(`Navigate to ${screen} - Unknown route`);
          NavigationManager.navigateToDashboardHome();
      }
    }, 350); // Match the drawer close animation timing
  };

  if (!isVisible) {
    console.log("🚫 NavigationDrawer not visible, returning null");
    return null;
  }

  console.log("✅ NavigationDrawer is visible, rendering drawer");

  // Add safety check for animated styles
  if (!overlayAnimatedStyle || !drawerAnimatedStyle) {
    console.error("❌ Animated styles are missing!", {
      overlayAnimatedStyle,
      drawerAnimatedStyle,
    });
    return null;
  }

  try {
    return (
      <>
        {/* Overlay with smooth fade animation */}
        <Animated.View
          className="absolute inset-0 bg-black/50 z-[998]"
          style={overlayAnimatedStyle}
        >
          <TouchableOpacity
            className="flex-1"
            onPress={onClose}
            activeOpacity={1}
          />
        </Animated.View>

        {/* Drawer with enhanced border radius and drop shadow */}
        <Animated.View
          className="absolute top-0 left-0 bottom-0 bg-white z-[999]"
          style={[
            drawerAnimatedStyle,
            {
              width: DRAWER_WIDTH,
              // Enhanced border radius for modern look
              borderTopRightRadius: 24,
              borderBottomRightRadius: 24,
              // Professional drop shadow
              shadowColor: "#000",
              shadowOffset: { width: 8, height: 0 },
              shadowOpacity: 0.15,
              shadowRadius: 20,
              elevation: 16,
              // Subtle border for definition
              borderRightWidth: 1,
              borderRightColor: "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <StatusBar
            barStyle="light-content"
            backgroundColor="rgba(0,0,0,0.5)"
          />

          {/* Header with user info - Enhanced with rounded top and gradient */}
          <View
            className="px-5 pb-6 border-b border-gray-200"
            style={{
              paddingTop: insets.top + 20,
              backgroundColor: "#F8FAFC",
              borderTopRightRadius: 24, // Match drawer border radius
            }}
          >
            <View className="flex-row items-center">
              <ProfileImagePicker
                userId={authState.user.id}
                onImageUploaded={handleProfileImageUpload}
                onError={handleProfileImageError}
              >
                <View
                  className="relative items-center justify-center w-16 h-16 mr-4 rounded-full shadow-sm"
                  style={{
                    backgroundColor: profileImage ? "transparent" : "#10B981",
                    shadowColor: "#10B981",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  {profileImage ? (
                    <>
                      <Image
                        source={{ uri: profileImage }}
                        className="w-16 h-16 rounded-full"
                        style={{ resizeMode: "cover" }}
                      />
                      {/* Camera icon overlay for edit indication */}
                      <View className="absolute bottom-0 right-0 items-center justify-center w-5 h-5 bg-blue-500 border-2 border-white rounded-full">
                        <Ionicons name="camera" size={12} color="white" />
                      </View>
                    </>
                  ) : (
                    <>
                      <Text className="text-2xl font-bold text-white">
                        {UserProfileService.getDefaultAvatar(
                          authState?.user?.fullName
                        )}
                      </Text>
                      {/* Camera icon overlay for upload indication */}
                      <View className="absolute bottom-0 right-0 items-center justify-center w-5 h-5 bg-blue-500 border-2 border-white rounded-full">
                        <Ionicons name="add" size={12} color="white" />
                      </View>
                    </>
                  )}
                </View>
              </ProfileImagePicker>

              <View className="flex-1">
                <Text className="mb-1 text-lg font-semibold text-gray-800">
                  {authState?.user?.fullName || "User Name"}
                </Text>
                <Text className="text-sm text-gray-500">
                  {authState?.user?.email || "user@example.com"}
                </Text>
                <View className="mt-2">
                  <View className="w-8 h-1 rounded-full bg-emerald-400" />
                </View>
              </View>
            </View>
          </View>

          {/* Menu Items */}
          <View className="flex-1 pt-2">
            <DrawerItem
              icon="home-outline"
              title="Dashboard"
              onPress={() => navigateToScreen("dashboard")}
              isActive={true}
            />

            <DrawerItem
              icon="wallet-outline"
              title="My Accounts"
              onPress={() => navigateToScreen("accounts")}
              isActive={false}
            />

            <DrawerItem
              icon="bar-chart-outline"
              title="Transaction"
              onPress={() => navigateToScreen("transactions")}
              isActive={false}
            />

            <DrawerItem
              icon="trophy-outline"
              title="Goals"
              onPress={() => navigateToScreen("goals")}
              isActive={false}
            />

            <DrawerItem
              icon="receipt-outline"
              title="Transaction History"
              onPress={() => navigateToScreen("history")}
              isActive={false}
            />

            <DrawerItem
              icon="pie-chart-outline"
              title="Categories"
              onPress={() => navigateToScreen("categories")}
              isActive={false}
            />

            <DrawerItem
              icon="notifications-outline"
              title="Notifications"
              onPress={() => navigateToScreen("notifications")}
              isActive={false}
            />

            <DrawerItem
              icon="settings-outline"
              title="Settings"
              onPress={() => navigateToScreen("settings")}
              isActive={false}
            />

            <DrawerItem
              icon="help-circle-outline"
              title="Help & Support"
              onPress={() => navigateToScreen("help")}
              isActive={false}
            />
          </View>

          {/* Footer with enhanced styling and rounded bottom */}
          <View
            className="border-t border-gray-200 bg-gray-50/50"
            style={{
              borderBottomRightRadius: 24, // Match drawer border radius
            }}
          >
            <TouchableOpacity
              className="flex-row items-center px-5 py-4 transition-colors active:bg-red-50"
              onPress={handleLogout}
              activeOpacity={0.6}
            >
              {/* Icon container for logout with proper spacing */}
              <View className="items-center justify-center w-8 h-8 mr-4">
                <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              </View>
              <Text className="flex-1 text-base font-medium text-red-500">
                Logout
              </Text>
              <Ionicons
                name="chevron-forward-outline"
                size={16}
                color="#FECACA"
              />
            </TouchableOpacity>

            <View
              className="items-center py-4 border-t border-gray-100"
              style={{
                borderBottomRightRadius: 24, // Match drawer border radius
              }}
            >
              <Text className="text-xs font-medium text-gray-400">
                Powered by SpendSight
              </Text>
              <Text className="mt-1 text-xs text-gray-300">v1.0.0</Text>
            </View>
          </View>
        </Animated.View>
      </>
    );
  } catch (error) {
    console.error("❌ NavigationDrawer render error:", error);
    return null;
  }
};

export default NavigationDrawer;
