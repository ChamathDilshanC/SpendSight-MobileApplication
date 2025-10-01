
import { initializeApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  type Auth,
  getReactNativePersistence,
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyB79mMkUoyI6zvVZi5sUrRikKLbAah6q5Y",
  authDomain: "spendsightmobileapp.firebaseapp.com",
  projectId: "spendsightmobileapp",
  storageBucket: "spendsightmobileapp.firebasestorage.app",
  messagingSenderId: "45937352137",
  appId: "1:45937352137:web:bfd20d237f26ad87335c18"
};


const app = initializeApp(firebaseConfig);

let auth: Auth;
try {

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {

  auth = getAuth(app);
}

const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
