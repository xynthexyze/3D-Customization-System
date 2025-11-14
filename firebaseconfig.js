import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyB2oVwhM8eI8kF8fl86_3AIWjCnlmTbSnU",
  authDomain: "vaernisignage.firebaseapp.com",
  projectId: "vaernisignage",
  storageBucket: "vaernisignage.appspot.com",
  messagingSenderId: "909456652985",
  appId: "1:909456652985:web:488fe8a87131ea5fa13968"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);

console.log("Firebase initialized successfully");