import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDSXFdTOIPNqC0NPtAqVNLsMIN7FVec7Lk",
  authDomain: "peliculasweb-13eb9.firebaseapp.com",
  projectId: "peliculasweb-13eb9",
  storageBucket: "peliculasweb-13eb9.firebasestorage.app",
  messagingSenderId: "846536591275",
  appId: "1:846536591275:web:cbc2de194475a0263074ee",
  measurementId: "G-WWBDQ9TJFK"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
