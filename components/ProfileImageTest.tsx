import React from "react";
import { Alert, StyleSheet, Text, View } from "react-native";

import { useAuth } from "../context/FirebaseAuthContext";
import { ProfileImagePicker } from "./ProfileImagePicker";

export const ProfileImageTest: React.FC = () => {
  const { authState } = useAuth();

  if (!authState?.user) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>User not authenticated</Text>
      </View>
    );
  }

  const handleImageUploaded = (imageUrl: string) => {
    console.log("🧪 Test: Image uploaded successfully:", imageUrl);
    Alert.alert(
      "Test Success",
      `Image uploaded!\n${imageUrl.substring(0, 50)}...`
    );
  };

  const handleImageError = (error: string) => {
    console.error("🧪 Test: Image upload error:", error);
    Alert.alert("Test Error", error);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile Image Upload Test</Text>
      <Text style={styles.subtitle}>User: {authState.user.email}</Text>

      <ProfileImagePicker
        userId={authState.user.id}
        onImageUploaded={handleImageUploaded}
        onError={handleImageError}
      >
        <View style={styles.testButton}>
          <Text style={styles.testButtonText}>Tap to Test Image Upload</Text>
        </View>
      </ProfileImagePicker>

      <Text style={styles.instructions}>
        This will test:{"\n"}• Permission requests{"\n"}• Modal display{"\n"}•
        Image selection{"\n"}• Firebase upload{"\n"}• Success/error handling
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  testButton: {
    backgroundColor: "#10B981",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  testButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
  },
  instructions: {
    fontSize: 14,
    color: "#666",
    textAlign: "left",
    lineHeight: 20,
  },
  text: {
    fontSize: 16,
    color: "#333",
  },
});
