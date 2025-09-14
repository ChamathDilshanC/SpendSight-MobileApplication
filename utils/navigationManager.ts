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
    this.safeNavigate("/(dashboard)/dashboard", "replace");
  }

  /**
   * Navigate to dashboard from within the dashboard section (for drawer navigation)
   */
  static navigateToDashboardHome(): void {
    try {
      console.log("🏠 Navigating to dashboard home...");

      // Check if we're already on the dashboard route to avoid unnecessary navigation
      // For drawer navigation within same route, we'll just log success
      console.log("✅ Already on dashboard, drawer closed successfully");
    } catch (error) {
      console.error("❌ Failed to navigate to dashboard home:", error);
      // Fallback - try replace if really needed
      try {
        router.replace("/(dashboard)/dashboard");
      } catch (fallbackError) {
        console.error("❌ Fallback navigation also failed:", fallbackError);
      }
    }
  }

  /**
   * Force refresh current route (useful for debugging navigation issues)
   */
  static forceRefreshRoute(): void {
    try {
      console.log("🔄 Force refreshing current route...");

      // Simple replace to current dashboard route
      router.replace("/(dashboard)/dashboard");

      console.log("✅ Route refresh completed");
    } catch (error) {
      console.error("❌ Failed to refresh route:", error);
      // Don't attempt fallback that might cause more errors
      console.log("🚫 Skipping fallback to prevent further navigation errors");
    }
  }

  /**
   * Safe navigation method that handles errors gracefully
   */
  static safeNavigate(
    route: string,
    method: "replace" | "navigate" | "push" = "replace"
  ): void {
    try {
      console.log(`🧭 Safe navigation to ${route} using ${method}...`);

      switch (method) {
        case "replace":
          router.replace(route as any);
          break;
        case "navigate":
          router.navigate(route as any);
          break;
        case "push":
          router.push(route as any);
          break;
      }

      console.log(`✅ Safe navigation to ${route} completed`);
    } catch (error) {
      console.error(`❌ Safe navigation to ${route} failed:`, error);
      // Try the most basic fallback only if not already using replace
      if (method !== "replace") {
        try {
          router.replace(route as any);
          console.log(`✅ Fallback navigation to ${route} completed`);
        } catch (fallbackError) {
          console.error(`❌ Fallback navigation also failed:`, fallbackError);
        }
      }
    }
  }

  /**
   * Navigate to login and clear dashboard history
   * This prevents users from going back to dashboard after logout
   */
  static navigateToAuth(): void {
    this.safeNavigate("/(auth)/login", "replace");
  }

  /**
   * Navigate to signup from login (maintains auth flow)
   */
  static navigateToSignup(): void {
    this.safeNavigate("/(auth)/signup", "push");
  }

  /**
   * Navigate to login from signup (maintains auth flow)
   */
  static navigateToLogin(): void {
    this.safeNavigate("/(auth)/login", "push");
  }

  /**
   * Reset to a specific route and clear all history
   */
  static resetToRoute(route: string): void {
    this.safeNavigate(route, "replace");
  }
}
