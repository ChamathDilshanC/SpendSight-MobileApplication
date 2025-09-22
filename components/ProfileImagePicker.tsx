import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Platform,
  TouchableOpacity,
} from "react-native";
import { UserProfileService } from "../services/UserProfileService";

interface ProfileImagePickerProps {
  userId: string;
  onImageUploaded: (imageUrl: string) => void;
  onError: (error: string) => void;
  children: React.ReactNode;
}

export const ProfileImagePicker: React.FC<ProfileImagePickerProps> = ({
  userId,
  onImageUploaded,
  onError,
  children,
}) => {
  const [isUploading, setIsUploading] = useState(false);

  const requestPermissions = async () => {
    try {
      const cameraPermission =
        await ImagePicker.requestCameraPermissionsAsync();
      const libraryPermission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (
        cameraPermission.status !== "granted" ||
        libraryPermission.status !== "granted"
      ) {
        Alert.alert(
          "Permissions Required",
          "Please grant camera and photo library permissions to upload profile pictures.",
          [{ text: "OK" }]
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error requesting permissions:", error);
      onError("Failed to request permissions. Please try again.");
      return false;
    }
  };

  const pickImage = async (source: "camera" | "library") => {
    try {
      setIsUploading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const hasPermissions = await requestPermissions();
      if (!hasPermissions) {
        setIsUploading(false);
        return;
      }

      let result;

      const imagePickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        exif: false,
      };

      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync(imagePickerOptions);
      } else {
        result = await ImagePicker.launchImageLibraryAsync(imagePickerOptions);
      }

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsUploading(false);
        return;
      }

      const imageUri = result.assets[0].uri;


      const validation = UserProfileService.validateImage(imageUri);
      if (!validation.valid) {
        onError(validation.error || "Invalid image selected");
        setIsUploading(false);
        return;
      }


      const uploadResult = await UserProfileService.uploadProfileImage(
        userId,
        imageUri
      );

      if (uploadResult.success && uploadResult.imageUrl) {
        onImageUploaded(uploadResult.imageUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        onError(uploadResult.error || "Upload failed");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      onError("Failed to select image. Please try again.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUploading(false);
    }
  };

  const showImagePicker = () => {
    if (isUploading) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Take Photo", "Choose from Library"],
          cancelButtonIndex: 0,
          title: "Select Profile Picture",
          message: "Choose how you'd like to update your profile picture",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            pickImage("camera");
          } else if (buttonIndex === 2) {
            pickImage("library");
          }
        }
      );
    } else {
      Alert.alert(
        "Select Profile Picture",
        "Choose how you'd like to update your profile picture",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Take Photo", onPress: () => pickImage("camera") },
          { text: "Choose from Library", onPress: () => pickImage("library") },
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      onPress={showImagePicker}
      disabled={isUploading}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );
};
