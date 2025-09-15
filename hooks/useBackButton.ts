import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { BackHandler } from "react-native";

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
