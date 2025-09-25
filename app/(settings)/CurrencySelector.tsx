import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Modal, Text, TouchableOpacity, View } from "react-native";
import { CURRENCIES, CurrencyCode } from "../../utils/currencyUtils";

interface CurrencySelectorProps {
  currentCurrency: CurrencyCode;
  onCurrencyChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  currentCurrency,
  onCurrencyChange,
  disabled = false,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleCurrencySelect = (currency: CurrencyCode) => {
    if (currency !== currentCurrency) {
      Alert.alert(
        "Change Currency",
        `Switch to ${CURRENCIES[currency].name}? This will update all your account balances and transactions.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Change",
            onPress: () => {
              onCurrencyChange(currency);
              setIsModalVisible(false);
            },
          },
        ]
      );
    } else {
      setIsModalVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity
        className={`flex-row items-center px-4 py-3 bg-white border border-gray-300 rounded-xl ${
          disabled ? "opacity-50" : ""
        }`}
        onPress={() => !disabled && setIsModalVisible(true)}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <View className="flex-1">
          <Text className="text-sm font-medium text-gray-700">Currency</Text>
          <Text className="text-lg font-semibold text-gray-900">
            {CURRENCIES[currentCurrency].symbol}{" "}
            {CURRENCIES[currentCurrency].name}
          </Text>
        </View>

        {!disabled && (
          <Ionicons name="chevron-down" size={20} color="#6B7280" />
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="items-center justify-center flex-1 bg-black/50">
          <View className="p-6 mx-6 bg-white rounded-2xl w-80">
            <Text className="mb-4 text-xl font-bold text-center text-gray-900">
              Select Currency
            </Text>

            {Object.values(CURRENCIES).map((currency) => (
              <TouchableOpacity
                key={currency.code}
                className={`flex-row items-center p-4 rounded-xl mb-2 ${
                  currentCurrency === currency.code
                    ? "bg-blue-50 border-2 border-blue-500"
                    : "bg-gray-50 border border-gray-200"
                }`}
                onPress={() => handleCurrencySelect(currency.code)}
                activeOpacity={0.7}
              >
                <View className="flex-1">
                  <Text
                    className={`text-lg font-semibold ${
                      currentCurrency === currency.code
                        ? "text-blue-700"
                        : "text-gray-900"
                    }`}
                  >
                    {currency.symbol} {currency.name}
                  </Text>
                  <Text
                    className={`text-sm ${
                      currentCurrency === currency.code
                        ? "text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {currency.code}
                  </Text>
                </View>

                {currentCurrency === currency.code && (
                  <Ionicons name="checkmark-circle" size={24} color="#3B82F6" />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              className="p-4 mt-4 bg-gray-100 rounded-xl"
              onPress={() => setIsModalVisible(false)}
              activeOpacity={0.7}
            >
              <Text className="font-semibold text-center text-gray-700">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
};
