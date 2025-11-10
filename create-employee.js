import { db, auth } from "./firebaseconfig.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  doc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.getElementById("create-employee-form").addEventListener("submit", async (e) => {
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

  try {
    // ✅ Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // ✅ Send verification email
    await sendEmailVerification(user);

    // ✅ Save to Firestore > users (for security rules)
    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email,
      contact,
      address,
      role: "Employee", // must match Firestore rule check
      verified: false,
      createdAt: serverTimestamp()
    });

    // ✅ Save to Firestore > employees (for admin listing)
    await setDoc(doc(db, "employees", user.uid), {
      fullName: `${firstName} ${lastName}`,
      email,
      contact,
      address,
      verified: false
    });

    alert("✅ Employee account created.\n📨 A verification email has been sent.");
    window.location.href = "employee.html";

  } catch (error) {
    console.error("❌ Error creating employee:", error);
    alert("❌ Failed to create employee:\n" + error.message);
  }
});
