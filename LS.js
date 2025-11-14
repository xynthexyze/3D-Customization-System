// LS.js - Updated Login System
import { auth, db } from './firebaseconfig.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { 
  setDoc, 
  doc, 
  getDoc 
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ========== SIGNUP ==========
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const firstName = document.getElementById('first_name').value.trim();
    const lastName = document.getElementById('last_name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirm').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const address = document.getElementById('address').value.trim();

    // Validation
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters long!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // Save user data to Firestore with Customer role
      await setDoc(doc(db, "users", user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email,
        contactNumber: contact,
        address: address,
        role: "Customer",
        verified: false,
        createdAt: new Date()
      });

      console.log("Signup successful. Verification email sent.");
      alert("Signup successful! Please verify your email before logging in.");
      window.location.href = "login.html";
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed: " + error.message);
    }
  });
}

// ========== LOGIN ==========
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        alert("Please verify your email first.");
        await signOut(auth);
        return;
      }

      console.log("Login successful.");
      
      // Get user role from Firestore and redirect accordingly
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        alert("User data not found. Please contact administrator.");
        await signOut(auth);
        return;
      }

      const userData = userDoc.data();
      const role = userData.role;

      console.log("User role detected:", role);
      
      // Redirect based on role
      switch(role) {
        case "Admin":
          window.location.href = "admin-dashboard.html";
          break;
        case "Employee":
          window.location.href = "employee-dashboard.html";
          break;
        case "Customer":
          window.location.href = "customer-dashboard.html";
          break;
        default:
          alert("Unknown user role. Please contact administrator.");
          await signOut(auth);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Login failed: " + error.message);
    }
  });
}

// ========== AUTH STATE LISTENER ==========
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User is signed in:", user.email);
  } else {
    console.log("User is signed out.");
  }
});