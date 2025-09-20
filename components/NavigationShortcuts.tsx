import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import * as Haptics from "expo-haptics";
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (onNavigate) {
      onNavigate(shortcut.route);
    } else {
      // Use push so user can go back to dashboard
      NavigationManager.navigateToMainSection(shortcut.route, "push");
    }
  };

  return (
    <View className="px-5 mt-8">
      <Text className="pl-4 mb-4 text-lg font-semibold text-gray-900">
        Quick Actions
      </Text>

      <View className="gap-3 p-4">
        {/* First Row */}
        <View className="flex-row gap-3">
          {shortcuts.slice(0, 2).map((shortcut) => (
            <View key={shortcut.id} className="flex-1">
              <TouchableOpacity
                className="items-center p-5 bg-white shadow-sm rounded-xl active:scale-95"
                onPress={() => handleShortcutPress(shortcut)}
                activeOpacity={0.8}
                style={{
                  shadowColor: shortcut.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {/* Icon Container */}
                <View
                  className="items-center justify-center mb-3 w-14 h-14 rounded-xl"
                  style={{
                    backgroundColor: `${shortcut.color}15`,
                    shadowColor: shortcut.color,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                >
                  <Ionicons
                    name={shortcut.icon as any}
                    size={28}
                    color={shortcut.color}
                  />
                </View>

                {/* Title */}
                <Text
                  className="text-base font-bold text-center text-gray-900"
                  numberOfLines={2}
                >
                  {shortcut.title}
                </Text>

                {/* Description */}
                <Text
                  className="mt-1 text-sm font-medium text-center text-gray-500"
                  numberOfLines={1}
                >
                  {shortcut.description}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Second Row */}
        <View className="flex-row gap-3">
          {shortcuts.slice(2, 4).map((shortcut) => (
            <View key={shortcut.id} className="flex-1">
              <TouchableOpacity
                className="items-center p-5 bg-white shadow-sm rounded-xl active:scale-95"
                onPress={() => handleShortcutPress(shortcut)}
                activeOpacity={0.8}
                style={{
                  shadowColor: shortcut.color,
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 3,
                }}
              >
                {/* Icon Container */}
                <View
                  className="items-center justify-center mb-3 w-14 h-14 rounded-xl"
                  style={{
                    backgroundColor: `${shortcut.color}15`,
                    shadowColor: shortcut.color,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                  }}
                >
                  <Ionicons
                    name={shortcut.icon as any}
                    size={28}
                    color={shortcut.color}
                  />
                </View>

                {/* Title */}
                <Text
                  className="text-base font-bold text-center text-gray-900"
                  numberOfLines={2}
                >
                  {shortcut.title}
                </Text>

                {/* Description */}
                <Text
                  className="mt-1 text-sm font-medium text-center text-gray-500"
                  numberOfLines={1}
                >
                  {shortcut.description}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};
