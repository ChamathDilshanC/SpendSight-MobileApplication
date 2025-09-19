import { useFocusEffect, usePathname } from "expo-router";
import { useCallback } from "react";
import { BackHandler } from "react-native";
import { NavigationManager } from "../utils/navigationManager";

export function useDisableBackButton(shouldDisable: boolean = true) {
  useFocusEffect(
    useCallback(() => {
      if (!shouldDisable) return;

      const onBackPress = () => {
        console.log("🚫 Hardware back button disabled for this screen");
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      return () => subscription.remove();
    }, [shouldDisable])
  );
}

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
          return true;
        } catch (error) {
          console.error("❌ Error in dashboard back navigation:", error);
          return false;
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

export function useTabBackButton(forceEnable: boolean = false) {
  const pathname = usePathname();

  useFocusEffect(
    useCallback(() => {
      const isInMainSection =
        forceEnable ||
        pathname.includes("/(account)") ||
        pathname.includes("/(goal)") ||
        pathname.includes("/(transaction)") ||
        pathname.includes("/(categories)") ||
        pathname.includes("/(help)") ||
        pathname.match(/^\/(account|goal|transaction|categories|help)/) ||
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
          return true;
        } catch (error) {
          console.error("❌ Error navigating to dashboard:", error);
          return false;
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

export function useCustomBackButton(customBackAction: () => boolean | void) {
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        const result = customBackAction();
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

export function useNormalBackButton() {
  useFocusEffect(
    useCallback(() => {
      console.log("📱 Normal back button behavior enabled");
      return;
    }, [])
  );
}
