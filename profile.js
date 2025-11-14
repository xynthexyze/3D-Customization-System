// profile.js
import { auth, db } from './firebaseconfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.error("No user logged in. Redirecting.");
    window.location.href = "login.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      console.error("User profile not found.");
      alert("Profile not found. Please sign up.");
      return;
    }

    const userData = userDoc.data();
    console.log("Profile data loaded:", userData);

    // Populate form
    document.getElementById('profile-name').value = userData.name || '';
    document.getElementById('profile-email').value = userData.email || '';
    document.getElementById('profile-role').value = userData.role || 'Customer';

    // Update profile
    document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('profile-name').value;
      const email = document.getElementById('profile-email').value;

      try {
        await updateDoc(doc(db, "users", user.uid), { name, email });
        console.log("Profile updated.");
        alert("Profile updated successfully!");
      } catch (error) {
        console.error("Update error:", error);
        alert("Update failed: " + error.message);
      }
    });
  } catch (error) {
    console.error("Error loading profile:", error);
    alert("Failed to load profile: " + error.message);
  }
});