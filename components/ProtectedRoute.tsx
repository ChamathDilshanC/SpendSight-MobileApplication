import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/FirebaseAuthContext";
import { NavigationManager } from "../utils/navigationManager";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { authState } = useAuth();

  useEffect(() => {
    if (!authState.isLoading && !authState.isAuthenticated) {
      console.log("🚫 User not authenticated, redirecting to auth");
      NavigationManager.navigateToAuth();
    }
  }, [authState.isLoading, authState.isAuthenticated]);

  if (authState.isLoading) {
    return (
      <View className="flex-1 bg-[#1a1a1a] justify-center items-center">
        <ActivityIndicator size="large" color="#0077CC" />
      </View>
    );
  }

  if (!authState.isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
