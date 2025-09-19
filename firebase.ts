// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
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
// Firebase Auth will automatically use AsyncStorage for persistence in React Native
// when @react-native-async-storage/async-storage is installed
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Export services
export { auth, db, storage };
export default app;
