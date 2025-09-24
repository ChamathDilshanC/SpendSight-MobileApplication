import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, AppStateStatus } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { FinanceProvider } from "../context/FinanceContext";
import { AuthProvider, useAuth } from "../context/FirebaseAuthContext";
import { GoalNotificationService } from "../services/GoalNotificationService";
import { NotificationService } from "../services/NotificationService";

// Add this import back for your styles
import "../global.css";

export const unstable_settings = {
  anchor: "(tabs)",
};

function NotificationInitializer() {
  const { authState } = useAuth();
  const [notificationsReady, setNotificationsReady] = useState(false);

  useEffect(() => {
    let notificationListener: Notifications.Subscription | null = null;
    let responseListener: Notifications.Subscription | null = null;

    const initNotifications = async () => {
      try {
        const success = await NotificationService.initialize();

        if (success) {
          console.log("✅ Notifications initialized successfully");
          setNotificationsReady(true);

          if (authState.isAuthenticated && authState.user?.id) {
            console.log(
              "🚀 Setting up auto-notifications for user:",
              authState.user.id
            );

            await NotificationService.scheduleDailyReminder(18, 0);

            try {
              await GoalNotificationService.scheduleWeeklyReminder(
                authState.user.id
              );
              console.log("✅ Weekly goal reminder scheduled");
            } catch (error) {
              console.log("⚠️ Goal reminder scheduling skipped:", error);
            }

            try {
              await GoalNotificationService.checkGoalDeadlines(
                authState.user.id
              );
              console.log("✅ Goal deadlines checked");
            } catch (error) {
              console.log("⚠️ Goal deadline check skipped:", error);
            }

            try {
              await GoalNotificationService.sendProgressSummary(
                authState.user.id
              );
              console.log("✅ Goals progress summary sent");
            } catch (error) {
              console.log("⚠️ Progress summary skipped:", error);
            }
          } else {
            console.log(
              "⏳ User not authenticated yet, skipping auto-notifications setup"
            );
          }

          notificationListener = Notifications.addNotificationReceivedListener(
            handleNotificationReceived
          );

          responseListener =
            Notifications.addNotificationResponseReceivedListener(
              handleNotificationResponse
            );
        } else {
          console.log("❌ Notification initialization failed");
          setNotificationsReady(false);
        }
      } catch (error) {
        console.error("❌ Error initializing notifications:", error);
        setNotificationsReady(false);
      }
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        nextAppState === "active" &&
        notificationsReady &&
        authState.user?.id
      ) {
        console.log("📱 App became active - checking for updates");

        GoalNotificationService.checkGoalDeadlines(authState.user.id).catch(
          (error) => console.log("⚠️ Goal deadline check failed:", error)
        );
      }
    };

    const appStateSubscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    initNotifications();

    return () => {
      if (notificationListener) {
        notificationListener.remove();
      }
      if (responseListener) {
        responseListener.remove();
      }
      appStateSubscription?.remove();
    };
  }, [authState.isAuthenticated, authState.user?.id]);

  const handleNotificationReceived = (
    notification: Notifications.Notification
  ) => {
    console.log(
      "🔔 Notification received:",
      notification.request.content.title
    );
  };

  const handleNotificationResponse = (
    response: Notifications.NotificationResponse
  ) => {
    console.log(
      "👆 Notification tapped:",
      response.notification.request.content.title
    );

    const notificationData = response.notification.request.content.data;
    if (notificationData) {
      handleNotificationNavigation(notificationData);
    }
  };

  const handleNotificationNavigation = (data: any) => {
    switch (data.type) {
      case "transaction":
        console.log("Navigate to transactions");
        break;
      case "goal_completed":
      case "goal_progress":
      case "goal_milestone":
      case "goal_update":
        console.log("Navigate to goals");
        break;
      case "daily_limit_warning":
      case "daily_limit_exceeded":
        console.log("Navigate to spending dashboard");
        break;
      case "balance_low":
      case "balance_critical":
      case "large_transaction":
        console.log("Navigate to accounts");
        break;
      case "budget_warning":
      case "budget_exceeded":
        console.log("Navigate to budget overview");
        break;
      default:
        console.log("Navigate to dashboard");
    }
  };

  return null;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <FinanceProvider>
          <NotificationInitializer />

          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#000000" },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen
              name="(getStarted)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="(dashboard)" options={{ headerShown: false }} />
            <Stack.Screen name="(account)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(categories)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(help)" options={{ headerShown: false }} />
            <Stack.Screen name="(goal)" options={{ headerShown: false }} />
            <Stack.Screen
              name="(transaction)"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="(history)" options={{ headerShown: false }} />
          </Stack>
        </FinanceProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
