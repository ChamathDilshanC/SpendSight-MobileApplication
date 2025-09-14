import { router } from "expo-router";

/**
 * Navigation utility for managing authentication flows and stack resets
 */
export class NavigationManager {
  /**
   * Navigate to dashboard and clear authentication history
   * This prevents users from going back to login/signup screens
   */
  static navigateToDashboard(): void {
    try {
      console.log("🧭 Navigating to dashboard and clearing auth history...");

      // Clear all previous navigation history
      router.dismissAll();

      // Navigate to dashboard
      router.replace("/(dashboard)/dashboard");

      console.log("✅ Navigation to dashboard completed");
    } catch (error) {
      console.error("❌ Failed to navigate to dashboard:", error);
      // Fallback navigation
      router.replace("/(dashboard)/dashboard");
    }
  }

  /**
   * Navigate to login and clear dashboard history
   * This prevents users from going back to dashboard after logout
   */
  static navigateToAuth(): void {
    try {
      console.log("🧭 Navigating to auth and clearing dashboard history...");

      // Clear all previous navigation history
      router.dismissAll();

      // Navigate to login
      router.replace("/(auth)/login");

      console.log("✅ Navigation to auth completed");
    } catch (error) {
      console.error("❌ Failed to navigate to auth:", error);
      // Fallback navigation
      router.replace("/(auth)/login");
    }
  }

  /**
   * Navigate to signup from login (maintains auth flow)
   */
  static navigateToSignup(): void {
    router.push("/(auth)/signup");
  }

  /**
   * Navigate to login from signup (maintains auth flow)
   */
  static navigateToLogin(): void {
    router.push("/(auth)/login");
  }

  /**
   * Reset to a specific route and clear all history
   */
  static resetToRoute(route: string): void {
    try {
      console.log(`🧭 Resetting navigation to ${route}...`);
      router.dismissAll();
      router.replace(route as any);
      console.log(`✅ Navigation reset to ${route} completed`);
    } catch (error) {
      console.error(`❌ Failed to reset navigation to ${route}:`, error);
      router.replace(route as any);
    }
  }
}
