// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, initializeAuth, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB79mMkUoyI6zvVZi5sUrRikKLbAah6q5Y",
  authDomain: "spendsightmobileapp.firebaseapp.com",
  projectId: "spendsightmobileapp",
  storageBucket: "spendsightmobileapp.firebasestorage.app",
  messagingSenderId: "45937352137",
  appId: "1:45937352137:web:bfd20d237f26ad87335c18",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
// Note: Firebase v12 may not support getReactNativePersistence in this build
// Using getAuth as fallback - AsyncStorage should be automatically used in React Native
let auth: Auth;
try {
  // Try to initialize with React Native specific settings if available
  auth = initializeAuth(app);
} catch (error) {
  // Fallback to regular auth initialization
  auth = getAuth(app);
}
const db = getFirestore(app);
const storage = getStorage(app);

// Export services
export { auth, db, storage };
export default app;
