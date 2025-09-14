import React from "react";
import {
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../context/FirebaseAuthContext";
import { NavigationManager } from "../../utils/navigationManager";

const Dashboard = () => {
  const { authState, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    // Navigate back to auth and clear dashboard history
    NavigationManager.navigateToAuth();
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.container}>
        <Text style={styles.title}>Welcome to SpendSight</Text>
        <Text style={styles.subtitle}>
          Hello, {authState.user?.fullName || "User"}!
        </Text>
        <Text style={styles.email}>{authState.user?.email}</Text>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: "#cccccc",
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: "#888888",
    marginBottom: 40,
  },
  logoutButton: {
    backgroundColor: "#dc3545",
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
  },
  logoutText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Dashboard;
