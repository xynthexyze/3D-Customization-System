console.log("LS.js loaded!");

// Firebase imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import {
    getAuth,
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import {
    getFirestore,
    doc,
    setDoc,
    getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyB2oVwhM8eI8kF8fl86_3AIWjCnlmTbSnU",
    authDomain: "vaernisignage.firebaseapp.com",
    databaseURL: "https://vaernisignage-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "vaernisignage",
    storageBucket: "vaernisignage.firebasestorage.app",
    messagingSenderId: "909456652985",
    appId: "1:909456652985:web:488fe8a87131ea5fa13968"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// UI Toggle (Login/Register)
document.addEventListener("DOMContentLoaded", () => {
    const container = document.querySelector(".container");
    const registerbtn = document.querySelector(".register-btn");
    const loginbtn = document.querySelector(".login-btn");

    if (registerbtn && container) {
        registerbtn.addEventListener("click", () => container.classList.add("active"));
    }
    if (loginbtn && container) {
        loginbtn.addEventListener("click", () => container.classList.remove("active"));
    }

    // 🔹 Registration
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const firstName = registerForm["first_name"].value;
            const lastName = registerForm["last_name"].value;
            const contactNumber = registerForm["contact"].value;
            const address = registerForm["address"].value;
            const email = registerForm["email"].value;
            const password = registerForm["password"].value;
            const confirm = registerForm["confirm"].value;

            if (password !== confirm) {
                alert("Passwords do not match.");
                return;
            }

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await sendEmailVerification(user);

                await setDoc(doc(db, "users", user.uid), {
                    firstName,
                    lastName,
                    contactNumber,
                    address,
                    email,
                    role: "Customer",
                    verified: false,
                    createdAt: new Date()
                });

                await setDoc(doc(db, "customers", user.uid), {
                    name: `${firstName} ${lastName}`,
                    email,
                    address,
                    phone: contactNumber,
                });

                alert("Registration successful! Please check your email for verification.");
                registerForm.reset();
            } catch (error) {
                console.error("Error during registration:", error.message);
                alert(`Error: ${error.message}`);
            }
        });
    }

    // 🔹 Login
    const loginForm = document.getElementById("login-form");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = loginForm["email"].value;
        const password = loginForm["password"].value;

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // ✅ Wait until Firebase confirms user is authenticated
            onAuthStateChanged(auth, async (currentUser) => {
                if (currentUser && currentUser.uid === user.uid && currentUser.emailVerified) {
                    const userRef = doc(db, "users", currentUser.uid);
                    const userSnapshot = await getDoc(userRef);

                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();
                        console.log("✅ Firestore User Data:", userData);

                        if (!userData?.role) {
                            alert("No role assigned to your account.");
                            return;
                        }

                        const role = userData.role;
                        console.log("✅ Detected Role:", role);

                        if (role === "Admin") {
                            window.location.href = "admin-dashboard.html";
                        } else if (role === "Customer") {
                            window.location.href = "customer-dashboard.html";
                        } else if (role === "Employee") {
                            window.location.href = "employee-dashboard.html";
                        } else {
                            alert("Unrecognized role. Please contact support.");
                        }
                    } else {
                        alert("User data not found in Firestore.");
                    }
                } else {
                    alert("Please verify your email before continuing.");
                    await auth.signOut();
                }
            });

        } catch (error) {
            console.error("Error during login:", error.message);
            const code = error.code || "unknown";
            switch (code) {
                case "auth/user-not-found":
                case "auth/wrong-password":
                    alert("Invalid email or password.");
                    break;
                case "auth/too-many-requests":
                    alert("Too many failed attempts. Try again later.");
                    break;
                case "auth/invalid-email":
                    alert("Please enter a valid email address.");
                    break;
                case "auth/invalid-credential":
                    alert("Invalid credentials. Please check your email and password.");
                    break;
                default:
                    alert("Login failed: " + error.message);
            }
        }
    });
}

});

// 🔹 Update Firestore on email verification
onAuthStateChanged(auth, async (user) => {
    if (user && user.emailVerified) {
        try {
            const userRef = doc(db, "users", user.uid);
            await setDoc(userRef, { verified: true }, { merge: true });
            console.log("✅ User emailVerified status updated in Firestore.");
        } catch (error) {
            console.error("❌ Firestore update error:", error.message);
        }
    }
});
