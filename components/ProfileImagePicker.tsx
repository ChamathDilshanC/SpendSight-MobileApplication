import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { UserProfileService } from "../services/UserProfileService";

interface ProfileImagePickerProps {
  userId: string;
  onImageUploaded: (imageUrl: string) => void;
  onError?: (error: string) => void;
  children: React.ReactNode;
}

export const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({
  userId,
  onImageUploaded,
  onError,
  children,
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [uploading, setUploading] = useState(false);

  const requestPermissions = async () => {

    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      Alert.alert(
        "Camera Permission Required",
        "Please grant camera permission to take photos.",
        [{ text: "OK" }]
      );
      return false;
    }


    const mediaPermission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!mediaPermission.granted) {
      Alert.alert(
        "Media Library Permission Required",
        "Please grant media library permission to select photos.",
        [{ text: "OK" }]
      );
      return false;
    }

    return true;
  };

  const handleImagePicker = async (source: "camera" | "gallery") => {
    setModalVisible(false);

    console.log("📱 Starting image picker for:", source);

    const hasPermissions = await requestPermissions();
    if (!hasPermissions) {
      console.log("❌ Permissions not granted");
      return;
    }

    console.log("✅ Permissions granted, launching picker...");

    try {
      let result;

      if (source === "camera") {
        console.log("📷 Launching camera...");
        result = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
      } else {
        console.log("📂 Launching image library...");
        result = await ImagePicker.launchImageLibraryAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });
      }

      console.log("📱 Image picker result:", {
        canceled: result.canceled,
        hasAssets: result.assets ? result.assets.length : 0,
      });

      if (!result.canceled && result.assets[0]) {
        console.log("✅ Image selected:", {
          uri: result.assets[0].uri,
          width: result.assets[0].width,
          height: result.assets[0].height,
          fileSize: result.assets[0].fileSize,
        });
        await uploadImage(result.assets[0].uri);
      } else {
        console.log("📱 User cancelled image selection");
      }
    } catch (error) {
      console.error("❌ Error picking image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to pick image";
      onError?.(errorMessage);
      Alert.alert("Error", errorMessage);
    }
  };

  const uploadImage = async (imageUri: string) => {
    try {
      setUploading(true);


      const validation = UserProfileService.validateImage(imageUri);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      console.log("📸 Uploading profile image...");


      const uploadResult = await UserProfileService.uploadProfileImage(
        userId,
        imageUri
      );

      if (uploadResult.success && uploadResult.imageUrl) {
        console.log("✅ Profile image uploaded successfully");
        onImageUploaded(uploadResult.imageUrl);
        Alert.alert("Success", "Profile image updated successfully!");
      } else {
        throw new Error(uploadResult.error || "Upload failed");
      }
    } catch (error) {
      console.error("❌ Error uploading image:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to upload image";
      onError?.(errorMessage);
      Alert.alert("Upload Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const showImageOptions = () => {
    console.log("🖼️ Profile image picker triggered");
    setModalVisible(true);
  };

  return (
    <>
      {}
      <TouchableOpacity
        onPress={showImageOptions}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {children}

        {}
        {uploading && (
          <View className="absolute inset-0 items-center justify-center bg-black bg-opacity-50 rounded-full">
            <ActivityIndicator size="small" color="#ffffff" />
          </View>
        )}
      </TouchableOpacity>

      {}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          console.log("📱 Modal close requested");
          setModalVisible(false);
        }}
      >
        <View className="justify-end flex-1 bg-black bg-opacity-50">
          <View className="bg-white rounded-t-3xl">
            {}
            <View className="items-center p-4 border-b border-gray-200">
              <View className="w-12 h-1 mb-4 bg-gray-300 rounded-full" />
              <Text className="text-lg font-semibold text-gray-900">
                Update Profile Photo
              </Text>
            </View>

            {}
            <View className="p-6">
              <TouchableOpacity
                className="flex-row items-center p-4 mb-3 rounded-xl bg-gray-50"
                onPress={() => {
                  console.log("📷 Camera button pressed");
                  handleImagePicker("camera");
                }}
                activeOpacity={0.7}
              >
                <View className="items-center justify-center w-12 h-12 mr-4 bg-blue-100 rounded-full">
                  <Ionicons name="camera" size={24} color="#3B82F6" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    Take Photo
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Use camera to take a new photo
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center p-4 mb-6 rounded-xl bg-gray-50"
                onPress={() => {
                  console.log("📂 Gallery button pressed");
                  handleImagePicker("gallery");
                }}
                activeOpacity={0.7}
              >
                <View className="items-center justify-center w-12 h-12 mr-4 bg-green-100 rounded-full">
                  <Ionicons name="images" size={24} color="#10B981" />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-medium text-gray-900">
                    Choose from Gallery
                  </Text>
                  <Text className="text-sm text-gray-500">
                    Select from your photo library
                  </Text>
                </View>
              </TouchableOpacity>

              {}
              <Pressable
                className="items-center justify-center w-full p-4 border border-gray-300 rounded-xl"
                onPress={() => {
                  console.log("❌ Cancel button pressed");
                  setModalVisible(false);
                }}
              >
                <Text className="text-base font-medium text-gray-700">
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};
