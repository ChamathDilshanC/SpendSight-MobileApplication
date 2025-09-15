import { useFocusEffect, usePathname } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import { NavigationManager } from "../utils/navigationManager";

/**
 * Hook to disable hardware back button on specific screens
 * This prevents users from accidentally navigating back to previous screens
 * when they shouldn't be able to (like going back to auth from dashboard)
 */
export function useDisableBackButton(shouldDisable: boolean = true) {
  useFocusEffect(
    useCallback(() => {
      if (!shouldDisable) return;

      const onBackPress = () => {
        // Return true to prevent default back action
        console.log("🚫 Hardware back button disabled for this screen");
        return true;
      };

      // Add event listener
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      // Cleanup function
      return () => subscription.remove();
    }, [shouldDisable])
  );
}

/**
 * Hook to redirect all back navigation to dashboard
 * Use this on any screen where you want back button to go to dashboard instead of previous screen
 */
export function useDashboardBackButton(shouldRedirect: boolean = true) {
  useFocusEffect(
    useCallback(() => {
      if (!shouldRedirect) {
        console.log("📱 Dashboard back button hook disabled");
        return;
      }

      console.log("📱 Dashboard back button hook activated");

      const onBackPress = () => {
        console.log(
          "🔙 Hardware back button pressed - redirecting to dashboard"
        );
        try {
          NavigationManager.navigateToDashboard();
          return true; // Prevent default back action
        } catch (error) {
          console.error("❌ Error in dashboard back navigation:", error);
          return false; // Allow default back action as fallback
        }
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => {
        console.log("📱 Dashboard back button hook cleanup");
        subscription.remove();
      };
    }, [shouldRedirect])
  );
}

/**
 * Hook that redirects back button to dashboard when in main app sections
 * Automatically detects if current screen is a main section based on pathname
 */
/**
 * Hook that redirects back button to dashboard when in main app sections
 * Uses a more reliable approach by checking the component context
 */
export function useTabBackButton(forceEnable: boolean = false) {
  const pathname = usePathname();

  useFocusEffect(
    useCallback(() => {
      // Enhanced path detection logic to handle various pathname formats
      const isInMainSection =
        forceEnable || // Allow manual override
        // Check for grouped routes: /(account), /(goal), etc.
        pathname.includes("/(account)") ||
        pathname.includes("/(goal)") ||
        pathname.includes("/(transaction)") ||
        pathname.includes("/(categories)") ||
        pathname.includes("/(help)") ||
        // Check for direct routes: /account, /goal, etc.
        pathname.match(/^\/(account|goal|transaction|categories|help)/) ||
        // Check for specific known paths that should have back button redirection
        pathname === "/categories" ||
        pathname === "/account" ||
        pathname === "/goal" ||
        pathname === "/transaction" ||
        pathname === "/help";

      console.log(`📱 useTabBackButton - Current pathname: "${pathname}"`);
      console.log(`📱 useTabBackButton - Force enable: ${forceEnable}`);
      console.log(
        `📱 useTabBackButton - Is in main section: ${isInMainSection}`
      );

      if (!isInMainSection) {
        console.log(
          "📱 Not in a main section, back button hook disabled for:",
          pathname
        );
        return;
      }

      console.log("📱 Main section back button hook activated for:", pathname);

      const onBackPress = () => {
        console.log(
          "🔙 Back button pressed in main section - redirecting to dashboard"
        );
        console.log(`📱 Current path when back pressed: "${pathname}"`);
        try {
          NavigationManager.navigateToDashboard();
          return true; // Prevent default back action
        } catch (error) {
          console.error("❌ Error navigating to dashboard:", error);
          return false; // Allow default back action as fallback
        }
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => {
        console.log("📱 Main section back button hook cleanup");
        subscription.remove();
      };
    }, [pathname, forceEnable])
  );
}

/**
 * Hook to handle custom back button behavior
 * Useful when you want to replace default back action with custom logic
 */
export function useCustomBackButton(customBackAction: () => boolean | void) {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const result = customBackAction();
        // If customBackAction returns true, it means it handled the back action
        // If it returns false or undefined, allow default back behavior
        return result === true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => subscription.remove();
    }, [customBackAction])
  );
}
