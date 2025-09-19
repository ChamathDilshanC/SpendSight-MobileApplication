import { Ionicons } from "@expo/vector-icons";
import { MotiView } from "moti";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { NavigationManager } from "../utils/navigationManager";

interface NavigationShortcut {
  id: string;
  title: string;
  icon: string;
  color: string;
  route: string;
  description: string;
}

const shortcuts: NavigationShortcut[] = [
  {
    id: "transactions",
    title: "Transactions",
    icon: "list",
    color: "#3B82F6",
    route: "/(transaction)",
    description: "View all",
  },
  {
    id: "categories",
    title: "Categories",
    icon: "apps",
    color: "#10B981",
    route: "/(categories)",
    description: "Manage",
  },
  {
    id: "goals",
    title: "Goals",
    icon: "flag",
    color: "#8B5CF6",
    route: "/(goal)",
    description: "Track",
  },
  {
    id: "accounts",
    title: "Accounts",
    icon: "wallet",
    color: "#F59E0B",
    route: "/(account)/account",
    description: "Manage",
  },
];

interface NavigationShortcutsProps {
  onNavigate?: (route: string) => void;
}

export const NavigationShortcuts: React.FC<NavigationShortcutsProps> = ({
  onNavigate,
}) => {
  const handleShortcutPress = (shortcut: NavigationShortcut) => {
    console.log(`🚀 Shortcut pressed: ${shortcut.title}`);

    if (onNavigate) {
      onNavigate(shortcut.route);
    } else {
  // Use push so user can go back to dashboard
  NavigationManager.navigateToMainSection(shortcut.route, "push");
    }
  };

  return (
    <View className="px-5 mt-8">
      <Text className="mb-4 text-lg font-semibold text-gray-900">
        Quick Actions
      </Text>

      <View className="flex-row justify-between">
        {shortcuts.map((shortcut, index) => (
          <MotiView
            key={shortcut.id}
            from={{ opacity: 0, translateY: 20, scale: 0.9 }}
            animate={{ opacity: 1, translateY: 0, scale: 1 }}
            transition={{
              type: "spring",
              damping: 15,
              stiffness: 100,
              delay: index * 100,
            }}
            className="flex-1 mx-1"
          >
            <TouchableOpacity
              className="items-center p-4 bg-white shadow-sm rounded-xl"
              onPress={() => handleShortcutPress(shortcut)}
              activeOpacity={0.7}
              style={{
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              {/* Icon Container */}
              <MotiView
                from={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{
                  type: "spring",
                  damping: 10,
                  delay: index * 100 + 200,
                }}
                className="items-center justify-center w-12 h-12 mb-2 rounded-full"
                style={{ backgroundColor: `${shortcut.color}15` }}
              >
                <Ionicons
                  name={shortcut.icon as any}
                  size={24}
                  color={shortcut.color}
                />
              </MotiView>

              {/* Title */}
              <Text
                className="text-sm font-medium text-gray-900"
                numberOfLines={1}
              >
                {shortcut.title}
              </Text>

              {/* Description */}
              <Text className="text-xs text-gray-500" numberOfLines={1}>
                {shortcut.description}
              </Text>
            </TouchableOpacity>
          </MotiView>
        ))}
      </View>
    </View>
  );
};
