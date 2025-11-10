import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyB2oVwhM8eI8kF8fl86_3AIWjCnlmTbSnU",
  authDomain: "vaernisignage.firebaseapp.com",
  projectId: "vaernisignage",
  storageBucket: "vaernisignage.appspot.com",
  messagingSenderId: "909456652985",
  appId: "1:909456652985:web:488fe8a87131ea5fa13968"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Wait for auth user
onAuthStateChanged(auth, async (user) => {
  if (user) {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = userSnap.data();

        // Fill profile data
        document.getElementById("profile-name").textContent = `${userData.firstName} ${userData.lastName}`;
        document.getElementById("profile-address").textContent = userData.address || "N/A";
        document.getElementById("profile-contact").textContent = userData.contactNumber || "N/A";
        document.getElementById("profile-email").textContent = userData.email || "N/A";
        document.getElementById("profile-role").textContent = userData.role || "N/A";
      } else {
        alert("User data not found.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
    }
  } else {
    // Not logged in
    window.location.href = "index.html"; // redirect to login
  }
});
