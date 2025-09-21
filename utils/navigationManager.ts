import { router } from "expo-router";

export class NavigationManager {
  static navigateToDashboard(): void {
    console.log("🏠 Navigating to dashboard...");
    this.navigateToMainSection("/(dashboard)/dashboard", "replace");
  }

  static navigateToDashboardHome(): void {
    try {
      console.log("🏠 Navigating to dashboard home...");
      console.log("✅ Already on dashboard, drawer closed successfully");
    } catch (error) {
      console.error("❌ Failed to navigate to dashboard home:", error);
      try {
        router.replace("/(dashboard)/dashboard");
      } catch (fallbackError) {
        console.error("❌ Fallback navigation also failed:", fallbackError);
      }
    }
  }

  static forceRefreshRoute(): void {
    try {
      console.log("🔄 Force refreshing current route...");
      router.replace("/(dashboard)/dashboard");
      console.log("✅ Route refresh completed");
    } catch (error) {
      console.error("❌ Failed to refresh route:", error);
      console.log("🚫 Skipping fallback to prevent further navigation errors");
    }
  }

  static safeNavigate(
    route: string,
    method: "replace" | "navigate" | "push" = "push"
  ): void {
    try {
      console.log(`🔄 Safe navigate to: ${route} using method: ${method}`);

      if (method === "replace") {
        router.replace(route);
      } else if (method === "push") {
        router.push(route);
      } else {
        router.navigate(route);
      }

      console.log(`✅ Navigation to ${route} successful using ${method}`);
    } catch (error) {
      console.error(`❌ Navigation to ${route} failed:`, error);

      try {
        console.log("🔄 Attempting fallback navigation...");
        router.replace(route);
        console.log("✅ Fallback navigation successful");
      } catch (fallbackError) {
        console.error("❌ Fallback navigation also failed:", fallbackError);
      }
    }
  }

  static navigateToMainSection(
    route: string,
    method: "replace" | "push" = "push"
  ): void {
    console.log(`🏗️ Navigating to main section: ${route} using ${method}`);
    this.safeNavigate(route, method);
  }

  static navigateToDashboardSection(): void {
    this.navigateToMainSection("/(dashboard)/dashboard");
  }

  static navigateToAccountsSection(): void {
    this.navigateToMainSection("/(account)/account");
  }

  static navigateToCategoriesSection(): void {
    this.navigateToMainSection("/(categories)/categories");
  }

  static navigateToHelpSection(): void {
    this.navigateToMainSection("/(help)/help");
  }

  static navigateToTransactionSection(): void {
    this.navigateToMainSection("/(transaction)");
  }

  static navigateToHistorySection(): void {
    this.navigateToMainSection("/(history)");
  }

  static navigateToGoalsSection(): void {
    this.navigateToMainSection("/(goal)");
  }

  static navigateToSettingsSection(): void {
    this.navigateToMainSection("/(settings)");
  }

  /**
   * Navigate to GetStarted screen and replace splash screen
   */
  static navigateToGetStarted(): void {
    this.safeNavigate("/(getStarted)/getStartedScreen", "replace");
  }

  /**
   * Navigate to auth screens from GetStarted (replace to prevent back to GetStarted)
   */
  static navigateToSignupFromGetStarted(): void {
    this.safeNavigate("/(auth)/signup", "replace");
  }

  static navigateToLoginFromGetStarted(): void {
    this.safeNavigate("/(auth)/login", "replace");
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

  static resetToRoute(route: string): void {
    this.safeNavigate(route, "replace");
  }

  static navigateToLoadingScreen(): void {
    this.safeNavigate("/(auth)/loading", "replace");
  }
}
