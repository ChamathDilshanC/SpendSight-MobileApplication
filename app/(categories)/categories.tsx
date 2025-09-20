import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { MotiText, MotiView } from "moti";
import { Skeleton } from "moti/skeleton";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "../../components/AppHeader";
import { useAuth } from "../../context/FirebaseAuthContext";
import { useDashboardBackButton } from "../../hooks/useBackButton";
import { CategoryService } from "../../services/CategoryService";
import { Category } from "../../types/finance";

interface NewCategoryForm {
  name: string;
  type: "income" | "expense";
  color: string;
  icon: string;
}

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
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategory, setNewCategory] = useState<NewCategoryForm>({
    name: "",
    type: "expense",
    color: "#6366F1",
    icon: "wallet-outline",
  });

  const categoryTypes = [
    {
      value: "expense" as const,
      label: "Expense",
      icon: "trending-down-outline",
      color: "#EF4444",
    },
    {
      value: "income" as const,
      label: "Income",
      icon: "trending-up-outline",
      color: "#10B981",
    },
  ];

  const availableIcons = [
    "wallet-outline",
    "card-outline",
    "home-outline",
    "car-outline",
    "restaurant-outline",
    "medical-outline",
    "fitness-outline",
    "school-outline",
    "briefcase-outline",
    "gift-outline",
    "airplane-outline",
    "musical-notes-outline",
    "game-controller-outline",
    "book-outline",
    "camera-outline",
    "build-outline",
    "storefront-outline",
    "bag-outline",
    "phone-portrait-outline",
    "tv-outline",
    "business-outline",
    "cash-outline",
    "trending-up-outline",
    "heart-outline",
  ];

  const availableColors = [
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#F97316",
    "#EAB308",
    "#22C55E",
    "#10B981",
    "#06B6D4",
    "#3B82F6",
    "#A855F7",
    "#D946EF",
    "#F59E0B",
    "#84CC16",
    "#059669",
    "#0891B2",
    "#1D4ED8",
    "#7C3AED",
    "#DC2626",
    "#16A34A",
  ];

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCategory(null);
    setNewCategory({
      name: "",
      type: "expense",
      color: "#6366F1",
      icon: "wallet-outline",
    });
    setShowCreateModal(true);
  };

  const openEditModal = (category: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCategory(category);
    setNewCategory({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon,
    });
    setShowCreateModal(true);
  };

  const handleSubmitCategory = async () => {
    if (!authState?.user?.id) return;

    if (!newCategory.name.trim()) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    try {
      setLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      if (editingCategory) {
        // Update existing category
        await CategoryService.updateCategory(editingCategory.id, {
          name: newCategory.name.trim(),
          color: newCategory.color,
          icon: newCategory.icon,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Category updated successfully!");
      } else {
        // Create new category
        await CategoryService.createCategory(authState.user.id, {
          name: newCategory.name.trim(),
          type: newCategory.type,
          icon: newCategory.icon,
          color: newCategory.color,
          isDefault: false,
        });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Success", "Category created successfully!");
      }

      setShowCreateModal(false);
      loadCategories();
    } catch (error) {
      console.error("❌ Error with category:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Failed to save category. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    if (category.isDefault) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Info", "Default categories cannot be edited.");
      return;
    }
    openEditModal(category);
  };

  const handleDeleteCategory = (category: Category) => {
    console.log(
      "🗑️ Delete category requested for:",
      category.name,
      "isDefault:",
      category.isDefault
    );

    if (category.isDefault) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Info", "Default categories cannot be deleted.");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Category deleted successfully!");
      console.log("🔄 Reloading categories...");
      await loadCategories();
    } catch (error) {
      console.error("❌ Error deleting category:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to delete category. Please try again.";
      Alert.alert("Error", errorMessage);
    }
  };

  const CategoryItem = ({
    category,
    index,
  }: {
    category: Category;
    index: number;
  }) => (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      delay={index * 100}
    >
      <TouchableOpacity
        className="flex-row items-center p-3 mb-3 bg-white shadow-sm rounded-xl"
        onPress={() => handleEditCategory(category)}
        activeOpacity={0.8}
        style={{
          shadowColor: category.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 2,
        }}
      >
        {/* Category Icon */}
        <View
          className="items-center justify-center w-10 h-10 mr-3 rounded-xl"
          style={{
            backgroundColor: category.color,
            shadowColor: category.color,
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
        >
          <Ionicons name={category.icon as any} size={20} color="white" />
        </View>

        {/* Category Info */}
        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {category.name}
              </Text>
              <Text
                className="mt-0.5 text-xs font-medium capitalize"
                style={{ color: category.color }}
              >
                {category.type} Category
              </Text>
            </View>

            <View className="flex-row items-center ml-3 space-x-2">
              {category.isDefault && (
                <View className="flex-row items-center px-2 py-1 bg-blue-100 rounded-full">
                  <Text className="text-xs font-medium text-blue-600">
                    Default
                  </Text>
                </View>
              )}

              {/* Action Button */}
              <TouchableOpacity
                className="p-2 ml-2 rounded-lg active:bg-gray-100"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                <Ionicons
                  name="ellipsis-horizontal"
                  size={18}
                  color="#6B7280"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );

  const CategorySkeleton = () => (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      className="p-3 mb-3 bg-white shadow-sm rounded-xl"
    >
      <View className="flex-row items-center">
        <Skeleton colorMode="light" width={40} height={40} radius={16} />
        <View className="flex-1 ml-3">
          <Skeleton colorMode="light" width="60%" height={18} radius={4} />
          <View className="mt-1">
            <Skeleton colorMode="light" width="40%" height={14} radius={4} />
          </View>
        </View>
        <View className="flex-row">
          <Skeleton colorMode="light" width={50} height={28} radius={8} />
          <View className="ml-2">
            <Skeleton colorMode="light" width={50} height={28} radius={8} />
          </View>
        </View>
      </View>
    </MotiView>
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
      <SafeAreaView
        className="flex-1"
        style={{ backgroundColor: "#f9fafb" }}
        edges={["top"]}
      >
        <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
        <AppHeader title="Categories" backgroundColor="#f9fafb" />
        <View className="px-4 pt-4">
          {[...Array(5)].map((_, index) => (
            <CategorySkeleton key={index} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  const expenseCount = categories.filter((c) => c.type === "expense").length;
  const incomeCount = categories.filter((c) => c.type === "income").length;

  return (
    <SafeAreaView
      className="flex-1"
      style={{ backgroundColor: "#f9fafb" }}
      edges={["top"]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <AppHeader title="Categories" backgroundColor="#f9fafb" />

      {/* Header Stats */}
      <MotiView
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        className="mx-4 mt-4 mb-2"
      >
        <View
          className="p-4 rounded-2xl"
          style={{
            backgroundColor: "#6366F1",
            shadowColor: "#667eea",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2,
            shadowRadius: 12,
            elevation: 4,
          }}
        >
          <MotiText
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            delay={200}
            className="mb-1 text-base font-medium text-white opacity-90"
          >
            Total Categories
          </MotiText>
          <MotiText
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            delay={400}
            className="mb-3 text-2xl font-bold text-white"
          >
            {categories.length}
          </MotiText>

          <View className="flex-row justify-between">
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              delay={600}
            >
              <Text className="text-sm text-white opacity-80">Expense</Text>
              <Text className="text-lg font-semibold text-white">
                {expenseCount}
              </Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0, translateX: 20 }}
              animate={{ opacity: 1, translateX: 0 }}
              delay={800}
            >
              <Text className="text-sm text-white opacity-80">Income</Text>
              <Text className="text-lg font-semibold text-white">
                {incomeCount}
              </Text>
            </MotiView>
            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              delay={1000}
            >
              <TouchableOpacity
                onPress={handleCreateCategory}
                className="flex-row items-center px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text className="ml-1 text-sm font-semibold text-white">
                  Add
                </Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </View>
      </MotiView>

      {/* Search and Filter Section */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        delay={300}
        className="mx-4 mb-4"
      >
        <View className="p-4 bg-white shadow-sm rounded-2xl">
          {/* Search Bar */}
          <View className="flex-row items-center px-4 py-3 mb-3 bg-gray-50 rounded-xl">
            <Ionicons name="search" size={18} color="#6B7280" />
            <TextInput
              className="flex-1 ml-3 text-base text-gray-900"
              placeholder="Search categories..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#6B7280" />
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
      </MotiView>

      {/* Categories List */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <CategoryItem category={item} index={index} />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
          />
        }
        ListEmptyComponent={
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="items-center justify-center py-12 mx-4"
          >
            <View
              className="items-center p-8 bg-white rounded-2xl"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 12,
                elevation: 2,
              }}
            >
              <Ionicons name="folder-open-outline" size={60} color="#D1D5DB" />
              <MotiText
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                delay={200}
                className="mt-4 text-xl font-bold text-gray-900"
              >
                {searchQuery ? "No categories found" : "No categories yet"}
              </MotiText>
              {!searchQuery && (
                <MotiText
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  delay={400}
                  className="px-4 mt-2 text-sm text-center text-gray-600"
                >
                  Create your first category to start organizing your expenses
                  and income
                </MotiText>
              )}
              {!searchQuery && (
                <MotiView
                  from={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  delay={600}
                >
                  <TouchableOpacity
                    onPress={handleCreateCategory}
                    className="flex-row items-center px-6 py-3 mt-4 rounded-xl"
                    style={{ backgroundColor: "#6366F1" }}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="add" size={20} color="white" />
                    <Text className="ml-2 text-base font-semibold text-white">
                      Create Category
                    </Text>
                  </TouchableOpacity>
                </MotiView>
              )}
            </View>
          </MotiView>
        }
      />

      {/* Create/Edit Category Modal */}
      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View className="justify-end flex-1 bg-black/50">
          <MotiView
            from={{ translateY: 400 }}
            animate={{ translateY: 0 }}
            className="p-6 bg-white rounded-t-3xl"
            style={{ maxHeight: "90%" }}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className="text-2xl font-bold text-gray-900">
                {editingCategory ? "Edit Category" : "Create Category"}
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(false)}
                className="p-2 bg-gray-100 rounded-full"
              >
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Category Name */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Category Name
                </Text>
                <TextInput
                  value={newCategory.name}
                  onChangeText={(text) =>
                    setNewCategory({ ...newCategory, name: text })
                  }
                  placeholder="Enter category name"
                  className="p-4 text-base border border-gray-200 rounded-xl"
                  style={{ backgroundColor: "#f9fafb" }}
                />
              </View>

              {/* Category Type */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Category Type
                </Text>
                <View className="flex-row gap-3">
                  {categoryTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      onPress={() =>
                        setNewCategory({ ...newCategory, type: type.value })
                      }
                      className={`flex-1 flex-row items-center justify-center px-4 py-3 rounded-xl border-2 ${
                        newCategory.type === type.value
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={20}
                        color={
                          newCategory.type === type.value
                            ? type.color
                            : "#6B7280"
                        }
                      />
                      <Text
                        className={`ml-2 font-medium ${
                          newCategory.type === type.value
                            ? "text-blue-700"
                            : "text-gray-700"
                        }`}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color Picker */}
              <View className="mb-4">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Choose Color
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableColors.map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => setNewCategory({ ...newCategory, color })}
                      className={`w-10 h-10 rounded-full border-4 ${
                        newCategory.color === color
                          ? "border-gray-800"
                          : "border-gray-200"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </View>
              </View>

              {/* Icon Picker */}
              <View className="mb-6">
                <Text className="mb-2 text-base font-semibold text-gray-700">
                  Choose Icon
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {availableIcons.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      onPress={() => setNewCategory({ ...newCategory, icon })}
                      className={`w-10 h-10 rounded-full items-center justify-center border-2 ${
                        newCategory.icon === icon
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <Ionicons
                        name={icon as any}
                        size={18}
                        color={
                          newCategory.icon === icon ? "#3B82F6" : "#6B7280"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 pt-4">
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-4 bg-gray-100 rounded-xl"
                >
                  <Text className="text-base font-semibold text-center text-gray-700">
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmitCategory}
                  className="flex-1 px-6 py-4 rounded-xl"
                  style={{ backgroundColor: "#6366F1" }}
                >
                  <Text className="text-base font-semibold text-center text-white">
                    {editingCategory ? "Update" : "Create"} Category
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </MotiView>
        </View>
      </Modal>
      {/* Floating Action Button */}
      <MotiView
        from={{ scale: 0, rotate: "180deg" }}
        animate={{ scale: 1, rotate: "0deg" }}
        delay={1000}
        className="absolute bottom-6 right-6"
      >
        <TouchableOpacity
          onPress={handleCreateCategory}
          className="items-center justify-center rounded-full shadow-lg w-14 h-14"
          style={{
            backgroundColor: "#6366F1",
            shadowColor: "#6366F1",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={28} color="white" />
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
};

export default Categories;
