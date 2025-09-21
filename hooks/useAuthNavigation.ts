import { useEffect } from "react";
import { useAuth } from "../context/FirebaseAuthContext";
import { NavigationManager } from "../utils/navigationManager";

export const useAuthNavigation = () => {
  const { authState } = useAuth();

  useEffect(() => {
    console.log("🔄 AuthNavigation Hook: Auth state changed", {
      isLoading: authState.isLoading,
      isAuthenticated: authState.isAuthenticated,
      hasUser: !!authState.user,
      userEmail: authState.user?.email,
    });

    if (!authState.isLoading) {
      if (authState.isAuthenticated && authState.user) {
        console.log(
          "🏠 AuthNavigation Hook: User authenticated, navigating to dashboard in 500ms"
        );

        setTimeout(() => {
          console.log(
            "🚀 AuthNavigation Hook: Executing navigation to dashboard"
          );
          NavigationManager.navigateToDashboard();
        }, 500);
      }

    }
  }, [authState.isLoading, authState.isAuthenticated]);
};
