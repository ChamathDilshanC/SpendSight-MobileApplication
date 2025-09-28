import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AppHeader from "../../components/AppHeader";
import { ProfileImagePicker } from "../../components/ProfileImagePicker";
import { useAuth } from "../../context/FirebaseAuthContext";
import { UserProfileService } from "../../services/UserProfileService";
import { LoadingAnimation } from "@/components/LoadingAnimation";

export default function EditProfileScreen() {
  const { authState, updateUser } = useAuth();
  const [fullName, setFullName] = useState(authState?.user?.fullName || "");
  const [email] = useState(authState?.user?.email || "");
  const [profileImage, setProfileImage] = useState(
    authState?.user?.profileImage || authState?.user?.profilePicture || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    fullName?: string;
    general?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};


    if (!fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      if (!authState?.user?.id) {
        throw new Error("User ID not found");
      }


      const updatedUserData: {
        fullName?: string;
      } = {};


      if (fullName.trim() !== (authState.user.fullName || "")) {
        updatedUserData.fullName = fullName.trim();
      }

      console.log("📝 Data to update:", updatedUserData);


      if (Object.keys(updatedUserData).length > 0) {
        await UserProfileService.updateUserProfile(
          authState.user.id,
          updatedUserData
        );


        updateUser(updatedUserData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert("Success", "Your profile has been updated successfully!", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error("Failed to update profile:", error);

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update profile. Please try again.";

      setErrors({ general: errorMessage });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

const handleProfileImageUpload = async (imageUrl: string) => {
  setIsLoading(true);

  try {

    await new Promise((resolve) => setTimeout(resolve, 3000));





    setProfileImage(imageUrl);

    Alert.alert(
      "Success!",
      "Your profile picture has been updated successfully.",
      [
        {
          text: "OK",
          onPress: () => {
            updateUser({ profileImage: imageUrl });
          },
        },
      ]
    );
  } catch (error) {
    console.error("Upload failed:", error);
    Alert.alert("Upload Failed", "Something went wrong. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  const handleProfileImageError = (error: string) => {
    console.error("Profile image upload error:", error);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Alert.alert("Upload Error", error);
  };

  const handleEmailChangeRequest = () => {
    Alert.alert(
      "Email Change Request",
      "For security reasons, email changes require special verification. Please contact our support team to change your email address.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Contact Support",
          onPress: () => {
            Alert.alert(
              "Contact Support",
              "Please reach out to our support team at:\n\nsupport@spendsight.com\n\nInclude your current email and the new email you'd like to use."
            );
          },
        },
      ]
    );
  };

  const getInitials = (name: string, emailFallback: string): string => {
    if (name) {
      const nameParts = name.trim().split(" ");
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
      }
      return nameParts[0][0]?.toUpperCase() || "";
    }

    if (emailFallback) {
      return emailFallback[0]?.toUpperCase() || "U";
    }

    return "U";
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader title="Edit Profile" showBackButton={true} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="flex-1 bg-gray-50">
          {}
          <View className="px-6 py-8 bg-white">
            <View className="items-center">
              <ProfileImagePicker
                userId={authState?.user?.id || ""}
                onImageUploaded={handleProfileImageUpload}
                onError={handleProfileImageError}
              >
                <View className="relative w-24 h-24">
                  {isLoading ? (
                    <View className="items-center justify-center w-24 h-24 bg-gray-200 rounded-full">
                      <LoadingAnimation size={60} />
                    </View>
                  ) : profileImage ? (
                    <Image
                      source={{ uri: profileImage }}
                      className="w-24 h-24 rounded-full"
                      style={styles.profileImage}
                    />
                  ) : (
                    <View className="items-center justify-center w-24 h-24 rounded-full bg-emerald-500">
                      <Text className="text-2xl font-bold text-white">
                        {getInitials(fullName, email)}
                      </Text>
                    </View>
                  )}

                  {!isLoading && (
                    <>
                      <View className="absolute bottom-0 right-0 p-2 bg-blue-600 border-2 border-white rounded-full">
                        <Ionicons name="camera" size={16} color="white" />
                      </View>

                      {}
                      <View className="absolute top-0 right-0 px-2 py-1 bg-yellow-500 rounded-full">
                        <Ionicons name="star" size={12} color="white" />
                      </View>
                    </>
                  )}
                </View>
              </ProfileImagePicker>

              <Text className="mt-3 text-sm text-gray-500">
                Tap to change profile photo
              </Text>
              <Text className="mt-1 text-xs font-medium text-yellow-600">
                ⭐ Premium Feature
              </Text>
            </View>
          </View>

          {}
          <View className="px-6 py-6 mt-6 bg-white">
            <Text className="mb-6 text-lg font-semibold text-gray-900">
              Personal Information
            </Text>

            {}
            {errors.general && (
              <View className="p-4 mb-4 border border-red-200 rounded-lg bg-red-50">
                <Text className="text-sm text-red-600">{errors.general}</Text>
              </View>
            )}

            {}
            <View className="mb-6">
              <Text className="mb-2 text-sm font-medium text-gray-700">
                Full Name
              </Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="Enter your full name"
                className={`px-4 py-3 border rounded-lg bg-gray-50 text-gray-900 ${
                  errors.fullName ? "border-red-300" : "border-gray-200"
                }`}
                autoCapitalize="words"
                autoCorrect={false}
              />
              {errors.fullName && (
                <Text className="mt-1 text-sm text-red-600">
                  {errors.fullName}
                </Text>
              )}
            </View>

            {}
            <View className="mb-6">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm font-medium text-gray-700">
                  Email Address
                </Text>
                <TouchableOpacity
                  onPress={handleEmailChangeRequest}
                  className="flex-row items-center"
                >
                  <Ionicons name="create-outline" size={16} color="#6B7280" />
                  <Text className="ml-1 text-xs text-gray-500">Change</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                value={email}
                editable={false}
                className="px-4 py-3 text-gray-600 bg-gray-100 border border-gray-200 rounded-lg"
                style={{ color: "#6B7280" }}
              />
              <View className="p-3 mt-2 border border-blue-200 rounded-lg bg-blue-50">
                <View className="flex-row items-start">
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color="#3B82F6"
                  />
                  <Text className="flex-1 ml-2 text-xs text-blue-700">
                    For security reasons, email changes require verification
                    through our support team. Tap "Change" above to request an
                    email change.
                  </Text>
                </View>
              </View>
            </View>

            {}
            <TouchableOpacity
              onPress={handleSave}
              disabled={isLoading}
              className={`py-4 mt-4 bg-blue-600 rounded-lg ${
                isLoading ? "opacity-50" : ""
              }`}
            >
              <Text className="text-base font-semibold text-center text-white">
                {isLoading ? "Saving Changes..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          </View>

          {}
          <View className="px-6 py-6 mt-6 bg-white">
            <Text className="mb-4 text-lg font-semibold text-gray-900">
              Account Information
            </Text>

            <View className="flex-row items-center justify-between py-3">
              <Text className="text-sm text-gray-600">Email Address</Text>
              <View className="flex-row items-center">
                <Text className="mr-2 text-sm font-medium text-gray-900">
                  {email}
                </Text>
                <View className="w-2 h-2 bg-green-500 rounded-full" />
              </View>
            </View>

            <View className="flex-row items-center justify-between py-3">
              <Text className="text-sm text-gray-600">Member since</Text>
              <Text className="text-sm font-medium text-gray-900">
                {authState?.user?.dateJoined
                  ? new Date(authState.user.dateJoined).toLocaleDateString()
                  : "Unknown"}
              </Text>
            </View>

            <View className="flex-row items-center justify-between py-3">
              <Text className="text-sm text-gray-600">Account status</Text>
              <View className="flex-row items-center">
                <View className="w-2 h-2 mr-2 bg-green-500 rounded-full" />
                <Text className="text-sm font-medium text-green-600">
                  Active
                </Text>
              </View>
            </View>

            <View className="flex-row items-center justify-between py-3">
              <Text className="text-sm text-gray-600">Plan</Text>
              <View className="flex-row items-center">
                <Text className="mr-2 text-sm font-medium text-gray-900">
                  Free
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Alert.alert(
                      "Upgrade to Premium",
                      "🌟 Premium Benefits:\n\n• Custom profile pictures\n• Unlimited cloud storage\n• Advanced analytics\n• Export data in multiple formats\n• Priority support\n• Ad-free experience\n\nUpgrade today!"
                    );
                  }}
                  className="px-2 py-1 bg-yellow-100 rounded-md"
                >
                  <Text className="text-xs font-medium text-yellow-700">
                    Upgrade
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {}
          <View className="px-6 py-6 mt-6 bg-white">
            <View className="flex-row items-center mb-3">
              <Ionicons name="shield-checkmark" size={20} color="#059669" />
              <Text className="ml-2 text-lg font-semibold text-gray-900">
                Account Security
              </Text>
            </View>

            <Text className="mb-4 text-sm text-gray-600">
              Your account security is important to us. Some changes require
              additional verification:
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text className="flex-1 ml-3 text-sm text-gray-700">
                  Name changes - Available instantly
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="mail" size={16} color="#F59E0B" />
                <Text className="flex-1 ml-3 text-sm text-gray-700">
                  Email changes - Requires support verification
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="key" size={16} color="#F59E0B" />
                <Text className="flex-1 ml-3 text-sm text-gray-700">
                  Password changes - Available in settings
                </Text>
              </View>
            </View>
          </View>

          {}
          <View className="px-6 py-6 mx-6 mt-6 mb-8 border border-yellow-200 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50">
            <View className="flex-row items-center mb-4">
              <Ionicons name="star" size={24} color="#F59E0B" />
              <Text className="ml-2 text-lg font-bold text-gray-900">
                Premium Features
              </Text>
            </View>

            <Text className="mb-4 text-sm text-gray-700">
              Upgrade to unlock powerful features that enhance your experience:
            </Text>

            <View className="space-y-3">
              <View className="flex-row items-center">
                <Ionicons name="camera" size={18} color="#059669" />
                <Text className="flex-1 ml-3 text-sm text-gray-700">
                  Upload custom profile pictures
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="cloud-upload" size={18} color="#059669" />
                <Text className="flex-1 ml-3 text-sm text-gray-700">
                  Unlimited cloud storage for your data
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="analytics" size={18} color="#059669" />
                <Text className="flex-1 ml-3 text-sm text-gray-700">
                  Advanced analytics and insights
                </Text>
              </View>
              <View className="flex-row items-center">
                <Ionicons name="headset" size={18} color="#059669" />
                <Text className="flex-1 ml-3 text-sm text-gray-700">
                  Priority customer support
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Coming Soon!",
                  "Premium subscriptions will be available soon. Stay tuned for updates!"
                );
              }}
              className="py-3 mt-4 bg-yellow-500 rounded-lg"
            >
              <Text className="font-semibold text-center text-white">
                Learn More About Premium
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  profileImage: {
    resizeMode: "cover" as const,
  },
});
