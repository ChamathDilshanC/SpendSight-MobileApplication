import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/FirebaseAuthContext";
import { useTabBackButton, useDashboardBackButton } from "../../hooks/useBackButton";
import { CategoryService } from "../../services/CategoryService";
import { Category } from "../../types/finance";

const Categories = () => {
  const { authState } = useAuth();


  // Redirect hardware back button to dashboard
  useDashboardBackButton(true);

  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "expense" | "income"
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, [authState?.user?.id]);

  // Filter categories when search query or filter changes
  useEffect(() => {
    filterCategories();
  }, [categories, searchQuery, activeFilter]);

  const loadCategories = async () => {
    if (!authState?.user?.id) return;

    try {
      console.log("📂 Loading categories for user:", authState.user.id);
      const userCategories = await CategoryService.getUserCategories(
        authState.user.id
      );
      setCategories(userCategories);
      console.log("✅ Categories loaded:", userCategories.length);
    } catch (error) {
      console.error("❌ Error loading categories:", error);
      Alert.alert("Error", "Failed to load categories. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCategories();
    setRefreshing(false);
  }, [authState?.user?.id]);

  const filterCategories = () => {
    let filtered = categories;

    // Apply type filter
    if (activeFilter !== "all") {
      filtered = filtered.filter((category) => category.type === activeFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter((category) =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
  };

  const handleCreateCategory = () => {
    Alert.prompt(
      "Create New Category",
      "Enter the category name:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Next",
          onPress: (name?: string) => {
            if (name && name.trim()) {
              showCategoryTypeSelector(name.trim());
            } else {
              Alert.alert("Error", "Please enter a valid category name");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const showCategoryTypeSelector = (name: string) => {
    Alert.alert("Category Type", `Select the type for "${name}":`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Income",
        onPress: () => createCategory(name, "income"),
      },
      {
        text: "Expense",
        onPress: () => createCategory(name, "expense"),
      },
    ]);
  };

  const createCategory = async (name: string, type: "income" | "expense") => {
    if (!authState?.user?.id) return;

    try {
      // Generate random color and select appropriate icon
      const colors = [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#96CEB4",
        "#FECA57",
        "#FF9FF3",
        "#54A0FF",
        "#5F27CD",
      ];
      const icons =
        type === "expense"
          ? ["bag", "card", "storefront", "home", "build", "fitness"]
          : ["cash", "trending-up", "briefcase", "business"];

      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const randomIcon = icons[Math.floor(Math.random() * icons.length)];

      await CategoryService.createCategory(authState.user.id, {
        name,
        type,
        icon: randomIcon,
        color: randomColor,
        isDefault: false,
      });

      Alert.alert("Success", `${name} category created successfully!`);
      loadCategories(); // Refresh the list
    } catch (error) {
      console.error("❌ Error creating category:", error);
      Alert.alert("Error", "Failed to create category. Please try again.");
    }
  };

  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      Alert.alert("Info", "Default categories cannot be edited.");
      return;
    }

    Alert.prompt(
      "Edit Category",
      `Edit "${category.name}":`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Update",
          onPress: (newName?: string) => {
            if (newName && newName.trim() && newName.trim() !== category.name) {
              updateCategory(category.id, newName.trim());
            }
          },
        },
      ],
      "plain-text",
      category.name
    );
  };

  const updateCategory = async (categoryId: string, newName: string) => {
    try {
      await CategoryService.updateCategory(categoryId, { name: newName });
      Alert.alert("Success", "Category updated successfully!");
      loadCategories();
    } catch (error) {
      console.error("❌ Error updating category:", error);
      Alert.alert("Error", "Failed to update category. Please try again.");
    }
  };

  const handleDeleteCategory = (category: Category) => {
    console.log(
      "🗑️ Delete category requested for:",
      category.name,
      "isDefault:",
      category.isDefault
    );

    if (category.isDefault) {
      Alert.alert("Info", "Default categories cannot be deleted.");
      return;
    }

    Alert.alert(
      "Delete Category",
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            console.log(
              "🗑️ User confirmed deletion for category:",
              category.id
            );
            deleteCategory(category.id);
          },
        },
      ]
    );
  };

  const deleteCategory = async (categoryId: string) => {
    console.log("🗑️ Starting deletion process for category:", categoryId);

    try {
      console.log("🗑️ Calling CategoryService.deleteCategory...");
      await CategoryService.deleteCategory(categoryId);
      console.log("✅ Category service deletion successful");

      Alert.alert("Success", "Category deleted successfully!");
      console.log("🔄 Reloading categories...");
      await loadCategories();
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete category. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const CategoryItem = ({ category }: { category: Category }) => (
    <TouchableOpacity
      className="flex-row items-center p-4 mx-4 mb-3 bg-white border border-gray-100 shadow-sm rounded-xl"
      onPress={() => handleEditCategory(category)}
      activeOpacity={0.7}
    >
      {/* Category Icon */}
      <View
        className="items-center justify-center w-12 h-12 mr-4 rounded-full"
        style={{ backgroundColor: `${category.color}20` }}
      >
        <Ionicons
          name={category.icon as any}
          size={24}
          color={category.color}
        />
      </View>

      {/* Category Info */}
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="flex-1 text-base font-semibold text-gray-900">
            {category.name}
          </Text>
          {category.isDefault && (
            <View className="px-2 py-1 bg-blue-100 rounded-full">
              <Text className="text-xs font-medium text-blue-600">Default</Text>
            </View>
          )}
        </View>
        <Text className="mt-1 text-sm text-gray-500 capitalize">
          {category.type} Category
        </Text>
      </View>

      {/* Action Button */}
      <TouchableOpacity
        className="p-2 rounded-lg active:bg-gray-100"
        onPress={() => {
          Alert.alert(
            "Category Actions",
            `What would you like to do with "${category.name}"?`,
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Edit",
                onPress: () => handleEditCategory(category),
                style: "default",
              },
              {
                text: "Delete",
                onPress: () => handleDeleteCategory(category),
                style: "destructive",
              },
            ]
          );
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const FilterButton = ({
    label,
    value,
    count,
  }: {
    label: string;
    value: "all" | "expense" | "income";
    count: number;
  }) => (
    <TouchableOpacity
      className={`px-4 py-2 rounded-full mr-3 ${
        activeFilter === value ? "bg-blue-500" : "bg-gray-100"
      }`}
      onPress={() => setActiveFilter(value)}
      activeOpacity={0.7}
    >
      <Text
        className={`text-sm font-medium ${
          activeFilter === value ? "text-white" : "text-gray-600"
        }`}
      >
        {label} ({count})
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50">
        <AppHeader title="Categories" />
        <View className="items-center justify-center flex-1">
          <Text className="text-lg text-gray-600">Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const expenseCount = categories.filter((c) => c.type === "expense").length;
  const incomeCount = categories.filter((c) => c.type === "income").length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <AppHeader title="Categories" />

      {/* Search and Filter Section */}
      <View className="pb-4 bg-white border-b border-gray-200">
        <View className="px-4 pt-4">
          {/* Search Bar */}
          <View className="flex-row items-center px-4 py-3 mb-4 bg-gray-100 rounded-xl">
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Search categories..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
          >
            <FilterButton label="All" value="all" count={categories.length} />
            <FilterButton
              label="Expense"
              value="expense"
              count={expenseCount}
            />
            <FilterButton label="Income" value="income" count={incomeCount} />
          </ScrollView>
        </View>
      </View>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CategoryItem category={item} />}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
        ListEmptyComponent={
          <View className="items-center justify-center py-16">
            <Ionicons name="folder-open-outline" size={64} color="#D1D5DB" />
            <Text className="mt-4 text-lg font-medium text-gray-400">
              {searchQuery ? "No categories found" : "No categories yet"}
            </Text>
            {!searchQuery && (
              <Text className="px-8 mt-2 text-sm text-center text-gray-400">
                Create your first category to start organizing your expenses and
                income
              </Text>
            )}
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute items-center justify-center bg-blue-500 rounded-full shadow-lg bottom-8 right-6 w-14 h-14 active:bg-blue-600"
        onPress={handleCreateCategory}
        activeOpacity={0.8}
        style={{
          shadowColor: "#3B82F6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default Categories;
