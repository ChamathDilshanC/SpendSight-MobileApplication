import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { db } from "../firebase";

export interface ProfileImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class UserProfileService {
  private static storage = getStorage();

  static async uploadProfileImage(
    userId: string,
    imageUri: string
  ): Promise<ProfileImageUploadResult> {
    try {
      console.log("📸 Starting profile image upload for user:", userId);
      console.log("📷 Image URI:", imageUri);

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated. Please log in and try again.");
      }

      if (currentUser.uid !== userId) {
        throw new Error(
          "Authentication mismatch. Please log out and log back in."
        );
      }

      const timestamp = Date.now();
      const filename = `profile_${userId}_${timestamp}.jpg`;
      const storageRef = ref(this.storage, `profile-images/${filename}`);

      console.log(
        "📁 Storage reference created:",
        `profile-images/${filename}`
      );

      let response;
      try {
        console.log("🔄 Fetching image from URI...");
        response = await fetch(imageUri);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch image: ${response.status} ${response.statusText}`
          );
        }
      } catch (fetchError) {
        console.error("❌ Failed to fetch image URI:", fetchError);
        throw new Error(
          "Failed to read image file. Please try selecting another image."
        );
      }

      const blob = await response.blob();
      console.log("📦 Image blob created, size:", blob.size, "bytes");
      console.log("📦 Image blob type:", blob.type);

      const maxSize = 5 * 1024 * 1024;
      if (blob.size > maxSize) {
        throw new Error(
          "Image is too large. Please select an image smaller than 5MB."
        );
      }

      if (!blob.type.startsWith("image/")) {
        throw new Error("Selected file is not a valid image.");
      }

      console.log("📤 Uploading image to Firebase Storage...");

      const metadata = {
        contentType: blob.type || "image/jpeg",
        customMetadata: {
          userId: userId,
          uploadedAt: new Date().toISOString(),
          originalName: `profile_${userId}_${timestamp}`,
        },
      };

      let uploadResult;
      try {
        uploadResult = await uploadBytes(storageRef, blob, metadata);
        console.log("✅ Image uploaded to Firebase Storage successfully");
      } catch (storageError: any) {
        console.error("❌ Firebase Storage upload error:", storageError);

        if (storageError.code === "storage/unauthorized") {
          throw new Error(
            "Upload permission denied. Please check your account permissions."
          );
        } else if (storageError.code === "storage/quota-exceeded") {
          throw new Error("Storage quota exceeded. Please contact support.");
        } else if (storageError.code === "storage/unauthenticated") {
          throw new Error(
            "Authentication required. Please log in and try again."
          );
        } else {
          throw new Error(
            `Upload failed: ${storageError.message || "Unknown storage error"}`
          );
        }
      }

      let downloadURL;
      try {
        downloadURL = await getDownloadURL(uploadResult.ref);
        console.log("✅ Download URL obtained:", downloadURL);
      } catch (urlError) {
        console.error("❌ Failed to get download URL:", urlError);
        throw new Error(
          "Upload completed but failed to get image URL. Please try again."
        );
      }

      try {
        await this.updateUserProfileImage(userId, downloadURL);
      } catch (updateError) {
        console.error("❌ Failed to update user profile:", updateError);
        console.log("⚠️ Image uploaded but profile update failed");
      }

      return {
        success: true,
        imageUrl: downloadURL,
      };
    } catch (error: any) {
      console.error("❌ Profile image upload failed:", error);
      return {
        success: false,
        error: error.message || "Upload failed with unknown error",
      };
    }
  }

  static async updateUserProfileImage(
    userId: string,
    imageUrl: string
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        profileImage: imageUrl,
        profilePicture: imageUrl,
        updatedAt: new Date(),
      });
      console.log("✅ User profile image updated in Firestore");
    } catch (error) {
      console.error("❌ Failed to update user profile image:", error);
      throw error;
    }
  }

  static async getUserProfileImage(userId: string): Promise<string | null> {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.profileImage || userData.profilePicture || null;
      }

      return null;
    } catch (error) {
      console.error("❌ Failed to get user profile image:", error);
      return null;
    }
  }

  static async deleteProfileImage(imageUrl: string): Promise<void> {
    try {
      const urlParts = imageUrl.split("/");
      const filename = urlParts[urlParts.length - 1].split("?")[0];

      const storageRef = ref(this.storage, `profile-images/${filename}`);
      await deleteObject(storageRef);

      console.log("🗑️ Old profile image deleted from storage");
    } catch (error) {
      console.error("❌ Failed to delete old profile image:", error);
    }
  }

  static validateImage(imageUri: string): { valid: boolean; error?: string } {
    if (!imageUri || imageUri.trim() === "") {
      return { valid: false, error: "No image selected" };
    }

    const validExtensions = [".jpg", ".jpeg", ".png", ".webp"];
    const hasValidExtension = validExtensions.some((ext) =>
      imageUri.toLowerCase().includes(ext)
    );

    if (!hasValidExtension && !imageUri.startsWith("data:image/")) {
      return {
        valid: false,
        error: "Invalid image format. Please select a JPG, PNG, or WebP image.",
      };
    }

    return { valid: true };
  }

  static getDefaultAvatar(fullName?: string): string {
    if (!fullName) return "U";

    const names = fullName.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }

    return fullName.charAt(0).toUpperCase();
  }

  static async updateUserProfile(
    userId: string,
    userData: {
      fullName?: string;
      email?: string;
      profileImage?: string;
    }
  ): Promise<void> {
    try {
      console.log("🔄 Updating user profile for:", userId);
      console.log("📝 Update data:", userData);

      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("User not authenticated. Please log in and try again.");
      }

      if (currentUser.uid !== userId) {
        throw new Error(
          "Authentication mismatch. Please log out and log back in."
        );
      }

      const userRef = doc(db, "users", userId);
      const updateData: any = {
        updatedAt: new Date(),
      };

      // Only add fields that have valid values (not undefined)
      if (userData.fullName !== undefined && userData.fullName !== null) {
        updateData.fullName = userData.fullName.trim();
      }

      if (userData.email !== undefined && userData.email !== null) {
        updateData.email = userData.email.trim().toLowerCase();
      }

      if (
        userData.profileImage !== undefined &&
        userData.profileImage !== null
      ) {
        if (userData.profileImage === "") {
          // If empty string, set to null instead of undefined
          updateData.profileImage = null;
          updateData.profilePicture = null;
        } else {
          updateData.profileImage = userData.profileImage;
          updateData.profilePicture = userData.profileImage; // For backward compatibility
        }
      }

      console.log("📤 Final update data:", updateData);

      await updateDoc(userRef, updateData);

      console.log("✅ User profile updated successfully in Firestore");
    } catch (error: any) {
      console.error("❌ Error updating user profile:", error);

      if (error.code === "permission-denied") {
        throw new Error("You don't have permission to update this profile.");
      } else if (error.code === "not-found") {
        throw new Error("User profile not found. Please contact support.");
      } else if (error.code === "unavailable") {
        throw new Error("Service temporarily unavailable. Please try again.");
      } else {
        throw new Error(
          error.message || "Failed to update profile. Please try again."
        );
      }
    }
  }

  static async getUserProfile(userId: string): Promise<any> {
    try {
      const userRef = doc(db, "users", userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        return userDoc.data();
      }

      return null;
    } catch (error) {
      console.error("❌ Failed to get user profile:", error);
      throw new Error("Failed to load user profile. Please try again.");
    }
  }
}
