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
import { useTabBackButton } from "../../hooks/useBackButton";

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

  // Force enable back button hook for help screen
  useTabBackButton(true);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const openEmail = () => {
    const email = "support@spendsight.com";
    const subject = "SpendSight Support Request";
    const body = "Hi SpendSight Team,\n\nI need help with:\n\n";

    Linking.openURL(
      `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    ).catch(() => {
      Alert.alert(
        "Email App Not Found",
        `Please send your support request to: ${email}`,
        [
          {
            text: "Copy Email",
            onPress: () => {
              // In a real app, you would copy to clipboard
              Alert.alert("Email Copied", email);
            },
          },
          { text: "OK" },
        ]
      );
    });
  };

  const openPhone = () => {
    const phoneNumber = "+1-555-SPEND-24";
    Alert.alert(
      "Contact Support",
      `Call our support team at:\n${phoneNumber}\n\nBusiness Hours:\nMonday - Friday: 9 AM - 6 PM EST\nWeekends: 10 AM - 4 PM EST`,
      [
        {
          text: "Call Now",
          onPress: () => {
            Linking.openURL(`tel:${phoneNumber.replace(/[^0-9+]/g, "")}`).catch(
              () => Alert.alert("Error", "Could not open phone app")
            );
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const openWebsite = () => {
    const url = "https://www.spendsight.com/support";
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open website. Please try again later.");
    });
  };

  const openChat = () => {
    Alert.alert(
      "Live Chat",
      "Our live chat feature is coming soon! For immediate assistance, please email us at support@spendsight.com",
      [{ text: "OK" }]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader title="Help & Support" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {/* Header */}
        <View className="px-6 py-6 bg-white border-b border-gray-200">
          <View className="items-center mb-4">
            <View className="items-center justify-center w-16 h-16 mb-3 bg-blue-500 rounded-full">
              <Ionicons name="help-circle" size={32} color="white" />
            </View>
            <Text className="mb-2 text-2xl font-bold text-gray-900">
              SpendSight Support
            </Text>
            <Text className="text-base text-center text-gray-600">
              We're here to help you manage your finances better
            </Text>
          </View>
        </View>

        <View className="px-6 pt-6">
          {/* Quick Actions */}
          <Text className="mb-4 text-lg font-semibold text-gray-900">
            Get Help Now
          </Text>

          <ContactOption
            icon="mail"
            title="Email Support"
            subtitle="Get detailed help via email"
            action={openEmail}
            color="#10B981"
          />

          <ContactOption
            icon="call"
            title="Phone Support"
            subtitle="Speak with our support team"
            action={openPhone}
            color="#3B82F6"
          />

          <ContactOption
            icon="globe"
            title="Visit Our Website"
            subtitle="Browse our online help center"
            action={openWebsite}
            color="#8B5CF6"
          />

          <ContactOption
            icon="chatbubbles"
            title="Live Chat"
            subtitle="Chat with us in real-time"
            action={openChat}
            color="#F59E0B"
          />

          {/* FAQ Sections */}
          <Text className="mt-8 mb-4 text-lg font-semibold text-gray-900">
            Frequently Asked Questions
          </Text>

          <HelpSection
            title="Getting Started"
            isExpanded={expandedSections.includes("getting-started")}
            onToggle={() => toggleSection("getting-started")}
          >
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">
                Q: How do I create my first budget?
              </Text>
              {"\n"}A: After signing up, you'll be prompted to enter your
              monthly salary. SpendSight will automatically create 6 accounts
              with recommended budget allocations:
            </Text>
            <View className="mb-3 ml-4">
              <Text className="text-gray-600">• Main Account (35%)</Text>
              <Text className="text-gray-600">• Savings (20%)</Text>
              <Text className="text-gray-600">• Expenses (25%)</Text>
              <Text className="text-gray-600">• Investment (10%)</Text>
              <Text className="text-gray-600">• Emergency Fund (5%)</Text>
              <Text className="text-gray-600">• Goals (5%)</Text>
            </View>
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">
                Q: How do I add transactions?
              </Text>
              {"\n"}A: Use the + button on your dashboard to quickly add income
              or expenses. Choose the appropriate category and account for
              accurate tracking.
            </Text>
          </HelpSection>

          <HelpSection
            title="Managing Categories"
            isExpanded={expandedSections.includes("categories")}
            onToggle={() => toggleSection("categories")}
          >
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">
                Q: Can I create custom categories?
              </Text>
              {"\n"}A: Yes! Go to Categories from the menu and tap the + button
              to create custom expense or income categories. You can also edit
              or delete custom categories anytime.
            </Text>
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">
                Q: What are default categories?
              </Text>
              {"\n"}A: SpendSight provides 14 pre-built categories (10 expense,
              4 income) that cover most common financial activities. These
              cannot be deleted but you can create additional custom ones.
            </Text>
          </HelpSection>

          <HelpSection
            title="Account Management"
            isExpanded={expandedSections.includes("accounts")}
            onToggle={() => toggleSection("accounts")}
          >
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">
                Q: How do I transfer money between accounts?
              </Text>
              {"\n"}A: Use the transfer feature in your accounts section to move
              money between your different budget accounts while maintaining
              accurate records.
            </Text>
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">
                Q: Can I modify my budget allocation?
              </Text>
              {"\n"}A: Yes, you can adjust the percentage allocation between
              your accounts based on your changing financial goals and needs.
            </Text>
          </HelpSection>

          <HelpSection
            title="Security & Privacy"
            isExpanded={expandedSections.includes("security")}
            onToggle={() => toggleSection("security")}
          >
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">
                Q: Is my financial data secure?
              </Text>
              {"\n"}A: Absolutely! SpendSight uses bank-level encryption and
              secure Firebase authentication to protect your data. We never
              store sensitive banking credentials.
            </Text>
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">Q: Can I export my data?</Text>
              {"\n"}A: Yes, you can export your transaction history and reports
              in various formats for backup or tax purposes.
            </Text>
          </HelpSection>

          <HelpSection
            title="Troubleshooting"
            isExpanded={expandedSections.includes("troubleshooting")}
            onToggle={() => toggleSection("troubleshooting")}
          >
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">
                Q: The app won't load my data
              </Text>
              {"\n"}A: Check your internet connection and try refreshing by
              pulling down on your dashboard. If issues persist, please contact
              support.
            </Text>
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">Q: I forgot my password</Text>
              {"\n"}A: Use the "Forgot Password" link on the login screen to
              reset your password via email.
            </Text>
          </HelpSection>

          {/* About Section */}
          <View className="p-6 mt-8 bg-white border border-gray-100 shadow-sm rounded-xl">
            <Text className="mb-3 text-lg font-semibold text-gray-900">
              About SpendSight
            </Text>
            <Text className="mb-3 text-gray-700">
              SpendSight is your personal finance companion designed to help you
              take control of your money with intelligent budgeting, expense
              tracking, and financial insights.
            </Text>
            <Text className="mb-3 text-gray-700">
              <Text className="font-semibold">Our Mission:</Text> To make
              personal finance management simple, accessible, and effective for
              everyone.
            </Text>
            <Text className="mb-4 text-gray-700">
              <Text className="font-semibold">Version:</Text> 1.0.0
            </Text>

            <View className="pt-4 border-t border-gray-200">
              <Text className="mb-2 text-sm text-gray-500">
                Contact Information:
              </Text>
              <Text className="text-sm text-gray-600">
                📧 support@spendsight.com
              </Text>
              <Text className="text-sm text-gray-600">📞 +1-555-SPEND-24</Text>
              <Text className="text-sm text-gray-600">
                🌐 www.spendsight.com
              </Text>
            </View>
          </View>

          {/* Footer */}
          <View className="p-4 mt-8 bg-gray-100 rounded-xl">
            <Text className="mb-2 text-sm text-center text-gray-600">
              Need more help?
            </Text>
            <Text className="text-xs text-center text-gray-500">
              Our support team typically responds within 24 hours
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Help;
