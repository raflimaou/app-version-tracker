import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCLa27eAb6Yk3WDb6UCF87-UpTHiA_SuVs",
  authDomain: "app-version-tracker-4098f.firebaseapp.com",
  projectId: "app-version-tracker-4098f",
  storageBucket: "app-version-tracker-4098f.firebasestorage.app",
  messagingSenderId: "656054560709",
  appId: "1:656054560709:web:e26ebe0753defd58270dac",
  measurementId: "G-M2GLNQRW0C",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
