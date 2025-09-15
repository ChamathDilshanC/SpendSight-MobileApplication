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

  /**
   * Upload profile image to Firebase Storage and update user document
   */
  static async uploadProfileImage(
    userId: string,
    imageUri: string
  ): Promise<ProfileImageUploadResult> {
    try {
      console.log("📸 Starting profile image upload for user:", userId);
      console.log("📷 Image URI:", imageUri);

      // Create a unique filename with timestamp
      const timestamp = Date.now();
      const filename = `profile_${userId}_${timestamp}.jpg`;
      const storageRef = ref(this.storage, `profile-images/${filename}`);

      console.log(
        "📁 Storage reference created:",
        `profile-images/${filename}`
      );

      // Convert image URI to blob with better error handling
      let response;
      try {
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

      // Check blob size (limit to 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (blob.size > maxSize) {
        throw new Error(
          "Image is too large. Please select an image smaller than 5MB."
        );
      }

      console.log("📤 Uploading image to Firebase Storage...");

      // Upload the image with metadata
      const metadata = {
        contentType: "image/jpeg",
        customMetadata: {
          userId: userId,
          uploadedAt: new Date().toISOString(),
        },
      };

      const uploadResult = await uploadBytes(storageRef, blob, metadata);
      console.log("✅ Image uploaded to Firebase Storage");

      // Get the download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);
      console.log("✅ Download URL obtained:", downloadURL);

      // Update the user document with the new profile image URL
      await this.updateUserProfileImage(userId, downloadURL);

      return {
        success: true,
        imageUrl: downloadURL,
      };
    } catch (error) {
      console.error("❌ Profile image upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Update user document with new profile image URL
   */
  static async updateUserProfileImage(
    userId: string,
    imageUrl: string
  ): Promise<void> {
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        profileImage: imageUrl,
        profilePicture: imageUrl, // Keep for backward compatibility
        updatedAt: new Date(),
      });
      console.log("✅ User profile image updated in Firestore");
    } catch (error) {
      console.error("❌ Failed to update user profile image:", error);
      throw error;
    }
  }

  /**
   * Get user profile image URL
   */
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

  /**
   * Delete old profile image from storage
   */
  static async deleteProfileImage(imageUrl: string): Promise<void> {
    try {
      // Extract filename from URL to create storage reference
      const urlParts = imageUrl.split("/");
      const filename = urlParts[urlParts.length - 1].split("?")[0]; // Remove query params

      const storageRef = ref(this.storage, `profile-images/${filename}`);
      await deleteObject(storageRef);

      console.log("🗑️ Old profile image deleted from storage");
    } catch (error) {
      console.error("❌ Failed to delete old profile image:", error);
      // Don't throw error here as it shouldn't block the upload process
    }
  }

  /**
   * Validate image file
   */
  static validateImage(imageUri: string): { valid: boolean; error?: string } {
    // Check if URI exists
    if (!imageUri || imageUri.trim() === "") {
      return { valid: false, error: "No image selected" };
    }

    // Check file extension (basic validation)
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

  /**
   * Generate default avatar with user's initials
   */
  static getDefaultAvatar(fullName?: string): string {
    if (!fullName) return "U";

    const names = fullName.trim().split(" ");
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }

    return fullName.charAt(0).toUpperCase();
  }
}
