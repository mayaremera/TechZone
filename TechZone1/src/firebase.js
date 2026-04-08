// Import Firebase functions
import { initializeApp } from "firebase/app";
import {
  getAuth,
  sendPasswordResetEmail,
  GoogleAuthProvider,
} from "firebase/auth";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4iDz1DON0PKky0at8eK5_fXw1w-dq39w",
  authDomain: "renting-website-1914f.firebaseapp.com",
  projectId: "renting-website-1914f",
  storageBucket: "renting-website-1914f.appspot.com",
  messagingSenderId: "976283593306",
  appId: "1:976283593306:web:23da6e99dd661dba5a4663",
  measurementId: "G-7NYK96VWLL",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Export Firebase functions
export { auth, provider, sendPasswordResetEmail };
