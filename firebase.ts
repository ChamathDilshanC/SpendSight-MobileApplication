
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
  // your firebase config
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
