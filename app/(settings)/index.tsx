import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDashboardBackButton } from "../../hooks/useBackButton";

import AppHeader from "../../components/AppHeader";
import { ProfileImagePicker } from "../../components/ProfileImagePicker";
import { useAuth } from "../../context/FirebaseAuthContext";
import { UserProfileService } from "../../services/UserProfileService";

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  rightComponent?: React.ReactNode;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  showChevron = true,
  rightComponent,
}) => (
  <TouchableOpacity
    className="flex-row items-center px-6 py-4 bg-white border-b border-gray-100"
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }}
    activeOpacity={0.7}
  >
    <View className="items-center justify-center w-10 h-10 mr-4 bg-gray-100 rounded-full">
      <Ionicons name={icon} size={20} color="#6B7280" />
    </View>

    <View className="flex-1">
      <Text className="text-base font-medium text-gray-900">{title}</Text>
      {subtitle && (
        <Text className="text-sm text-gray-500 mt-0.5">{subtitle}</Text>
      )}
    </View>

    {rightComponent}

    {showChevron && (
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    )}
  </TouchableOpacity>
);

export default function SettingsScreen() {
  useDashboardBackButton(true);
  const { authState, logout, updateUser } = useAuth();
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    const loadProfileImage = async () => {
      if (authState?.user?.id) {
        try {
          const existingImage =
            authState.user.profileImage || authState.user.profilePicture;
          if (existingImage) {
            setProfileImage(existingImage);
            return;
          }

          const imageUrl = await UserProfileService.getUserProfileImage(
            authState.user.id
          );

          if (imageUrl) {
            setProfileImage(imageUrl);
          } else {
            setProfileImage(null);
          }
        } catch (error) {
          console.error("Failed to load profile image:", error);
          setProfileImage(null);
        }
      }
    };

    loadProfileImage();
  }, [authState?.user?.id, authState?.user?.profileImage]);

  const handleProfileImageUpload = (imageUrl: string) => {
    setProfileImage(imageUrl);

    updateUser({ profileImage: imageUrl });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      console.log("Profile image state after upload:", profileImage);
    }, 100);
  };

  const handleProfileImageError = (error: string) => {
    console.error("Profile image upload error in settings:", error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert("Upload Error", error);
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  const getInitials = (
    fullName: string | undefined,
    email: string | undefined
  ): string => {
    if (fullName) {
      const nameParts = fullName.trim().split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0]?.toUpperCase() || "";
    }

    if (email) {
      return email[0]?.toUpperCase() || "U";
    }

    return "U";
  };

  if (!authState?.user) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <AppHeader title="Settings" />
        <View className="items-center justify-center flex-1">
          <Text className="text-gray-500">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader title="Settings" />
      <ScrollView className="flex-1 bg-gray-50">
        {}
        <View className="px-6 py-8 bg-white">
          <View className="flex-row items-center">
            {}
            <ProfileImagePicker
              userId={authState.user.id}
              onImageUploaded={handleProfileImageUpload}
              onError={handleProfileImageError}
            >
              <View className="relative">
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    className="w-20 h-20 rounded-full"
                    style={styles.profileImage}
                  />
                ) : (
                  <View className="items-center justify-center w-20 h-20 rounded-full bg-emerald-500">
                    <Text className="text-2xl font-bold text-white">
                      {getInitials(
                        authState.user.fullName,
                        authState.user.email
                      )}
                    </Text>
                  </View>
                )}

                {}
                <View className="absolute bottom-0 right-0 p-1 bg-white border-2 border-gray-100 rounded-full">
                  <Ionicons name="camera" size={14} color="#6B7280" />
                </View>
              </View>
            </ProfileImagePicker>

            {}
            <View className="flex-1 ml-4">
              <Text className="text-xl font-bold text-gray-900">
                {authState.user.fullName || "User Name"}
              </Text>
              <Text className="mt-1 text-base text-gray-600">
                {authState.user.email || "email@example.com"}
              </Text>
            </View>
          </View>

          {}
          <Text className="mt-4 text-sm text-center text-gray-500">
            Tap profile photo to change
          </Text>
        </View>

        {}
        <View className="mt-6">
          <Text className="px-6 py-2 text-sm font-medium tracking-wide text-gray-500 uppercase">
            Account
          </Text>
          <SettingItem
            icon="person-circle-outline"
            title="Edit Profile"
            subtitle="Update your personal information"
            onPress={() => {
              router.push("/(settings)/edit-profile");
            }}
          />
          <SettingItem
            icon="notifications-outline"
            title="Notifications"
            subtitle="Manage your notification preferences"
            onPress={() => {
              Alert.alert("Coming Soon", "Notification settings coming soon!");
            }}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy & Security"
            subtitle="Manage your privacy settings"
            onPress={() => {
              Alert.alert("Coming Soon", "Privacy settings coming soon!");
            }}
          />
        </View>

        <View className="mt-6">
          <Text className="px-6 py-2 text-sm font-medium tracking-wide text-gray-500 uppercase">
            App Settings
          </Text>

          <SettingItem
            icon="color-palette-outline"
            title="Appearance"
            subtitle="Dark mode, themes, and display options"
            onPress={() => {
              Alert.alert("Coming Soon", "Appearance settings coming soon!");
            }}
          />

          <SettingItem
            icon="language-outline"
            title="Language"
            subtitle="English"
            onPress={() => {
              Alert.alert("Coming Soon", "Language settings coming soon!");
            }}
          />

          <SettingItem
            icon="cash-outline"
            title="Change Currency"
            subtitle="Change your default currency"
            onPress={() => {
              router.push("/(settings)/currency-selector");
            }}
          />
        </View>

        <View className="mt-6">
          <Text className="px-6 py-2 text-sm font-medium tracking-wide text-gray-500 uppercase">
            Support
          </Text>

          <SettingItem
            icon="help-circle-outline"
            title="Help & Support"
            subtitle="Get help and contact support"
            onPress={() => {
              router.push("/(help)");
            }}
          />

          <SettingItem
            icon="information-circle-outline"
            title="About"
            subtitle="App version and information"
            onPress={() => {
              Alert.alert(
                "SpendSight",
                "Version 1.0.0\n\nA comprehensive expense tracking and financial management app.",
                [{ text: "OK" }]
              );
            }}
          />
        </View>

        {}
        <View className="mt-6 mb-8">
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            onPress={handleLogout}
            showChevron={false}
            rightComponent={
              <Ionicons name="log-out-outline" size={16} color="#EF4444" />
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileImage: {
    resizeMode: "cover" as const,
  },
});
