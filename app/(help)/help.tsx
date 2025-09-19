import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";

interface HelpSectionProps {
  title: string;
  children: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const HelpSection: React.FC<HelpSectionProps> = ({
  title,
  children,
  isExpanded = false,
  onToggle,
}) => (
  <View className="mb-4 overflow-hidden bg-white border border-gray-100 shadow-sm rounded-xl">
    <TouchableOpacity
      className="flex-row items-center justify-between p-4 active:bg-gray-50"
      onPress={onToggle}
      activeOpacity={0.7}
    >
      <Text className="flex-1 mr-3 text-base font-semibold text-gray-900">
        {title}
      </Text>
      <Ionicons
        name={isExpanded ? "chevron-up" : "chevron-down"}
        size={20}
        color="#6B7280"
      />
    </TouchableOpacity>
    {isExpanded && (
      <View className="px-4 pt-2 pb-4 border-t border-gray-100">
        {children}
      </View>
    )}
  </View>
);

interface ContactOptionProps {
  icon: string;
  title: string;
  subtitle: string;
  action: () => void;
  color?: string;
}

const ContactOption: React.FC<ContactOptionProps> = ({
  icon,
  title,
  subtitle,
  action,
  color = "#3B82F6",
}) => (
  <TouchableOpacity
    className="flex-row items-center p-4 mb-3 bg-white border border-gray-100 shadow-sm rounded-xl active:bg-gray-50"
    onPress={action}
    activeOpacity={0.7}
  >
    <View
      className="items-center justify-center w-12 h-12 mr-4 rounded-full"
      style={{ backgroundColor: `${color}20` }}
    >
      <Ionicons name={icon as any} size={24} color={color} />
    </View>
    <View className="flex-1">
      <Text className="text-base font-semibold text-gray-900">{title}</Text>
      <Text className="mt-1 text-sm text-gray-500">{subtitle}</Text>
    </View>
    <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
  </TouchableOpacity>
);

const Help = () => {
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const openEmail = () => {
    Linking.openURL("mailto:support@financeapp.com").catch(() => {
      Alert.alert("Error", "Could not open email app");
    });
  };

  const openPhone = () => {
    Linking.openURL("tel:+1234567890").catch(() => {
      Alert.alert("Error", "Could not open phone app");
    });
  };

  const openWebsite = () => {
    Linking.openURL("https://financeapp.com/support").catch(() => {
      Alert.alert("Error", "Could not open website");
    });
  };

  const openFAQ = () => {
    Linking.openURL("https://financeapp.com/faq").catch(() => {
      Alert.alert("Error", "Could not open FAQ page");
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader title="Help & Support" />

      <ScrollView className="flex-1 px-4 py-6">
        <HelpSection
          title="Getting Started"
          isExpanded={expandedSections.includes("getting-started")}
          onToggle={() => toggleSection("getting-started")}
        >
          <Text className="text-sm leading-6 text-gray-600">
            Welcome to your finance app! Start by adding your accounts, setting
            up categories, and recording your first transaction. You can also
            set financial goals to track your progress.
          </Text>
        </HelpSection>

        <HelpSection
          title="Managing Accounts"
          isExpanded={expandedSections.includes("accounts")}
          onToggle={() => toggleSection("accounts")}
        >
          <Text className="text-sm leading-6 text-gray-600">
            Add different types of accounts like checking, savings, or credit
            cards. You can transfer money between accounts and track balances in
            real-time.
          </Text>
        </HelpSection>

        <HelpSection
          title="Tracking Transactions"
          isExpanded={expandedSections.includes("transactions")}
          onToggle={() => toggleSection("transactions")}
        >
          <Text className="text-sm leading-6 text-gray-600">
            Record income and expenses with detailed categories. Use the camera
            to capture receipts and add notes for better organization.
          </Text>
        </HelpSection>

        <HelpSection
          title="Setting Goals"
          isExpanded={expandedSections.includes("goals")}
          onToggle={() => toggleSection("goals")}
        >
          <Text className="text-sm leading-6 text-gray-600">
            Create savings goals with target amounts and dates. Track your
            progress and set up automatic transfers to reach your goals faster.
          </Text>
        </HelpSection>

        <HelpSection
          title="Categories & Budgets"
          isExpanded={expandedSections.includes("categories")}
          onToggle={() => toggleSection("categories")}
        >
          <Text className="text-sm leading-6 text-gray-600">
            Organize your spending with custom categories. Set monthly budgets
            and receive notifications when you're close to your limits.
          </Text>
        </HelpSection>

        <View className="mt-8 mb-4">
          <Text className="mb-4 text-xl font-bold text-gray-900">
            Contact Support
          </Text>

          <ContactOption
            icon="mail"
            title="Email Support"
            subtitle="Get help via email within 24 hours"
            action={openEmail}
            color="#3B82F6"
          />

          <ContactOption
            icon="call"
            title="Phone Support"
            subtitle="Speak with our support team"
            action={openPhone}
            color="#10B981"
          />

          <ContactOption
            icon="globe"
            title="Help Center"
            subtitle="Browse our comprehensive guides"
            action={openWebsite}
            color="#8B5CF6"
          />

          <ContactOption
            icon="help-circle"
            title="FAQ"
            subtitle="Find answers to common questions"
            action={openFAQ}
            color="#F59E0B"
          />
        </View>

        <View className="p-4 mt-6 bg-white border border-gray-100 shadow-sm rounded-xl">
          <Text className="mb-2 text-base font-semibold text-gray-900">
            App Information
          </Text>
          <Text className="text-sm text-gray-600">Version: 1.0.0</Text>
          <Text className="text-sm text-gray-600">
            Last Updated: January 2025
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Help;
