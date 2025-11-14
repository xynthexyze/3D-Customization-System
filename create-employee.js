import { db, auth } from "./firebaseconfig.js";
import {
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const createEmployeeForm = document.getElementById("create-employee-form");
if (createEmployeeForm) {
  createEmployeeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const firstName = document.getElementById("first_name").value.trim();
    const lastName = document.getElementById("last_name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirm = document.getElementById("confirm").value.trim();
    const contact = document.getElementById("contact").value.trim();
    const address = document.getElementById("address").value.trim();

    if (password !== confirm) {
      alert("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save to Firestore > users
      await setDoc(doc(db, "users", user.uid), {
        firstName,
        lastName,
        email,
        contactNumber: contact,
        address,
        role: "Employee",
        verified: true,
        createdAt: serverTimestamp()
      });

      // Save to Firestore > employees
      await setDoc(doc(db, "employees", user.uid), {
        fullName: `${firstName} ${lastName}`,
        email,
        contactNumber: contact,
        address,
        verified: true
      });

      alert("✅ Employee account created successfully!");
      createEmployeeForm.reset();
      
    } catch (error) {
      console.error("❌ Error creating employee:", error);
      alert("❌ Failed to create employee:\n" + error.message);
    }
  });
}