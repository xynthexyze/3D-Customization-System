// employeeList.js - Fixed
import { db } from './firebaseconfig.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const employeeTableBody = document.querySelector("tbody");

const q = query(collection(db, "users"), where("role", "==", "Employee"));

onSnapshot(q, (snapshot) => {
  employeeTableBody.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.firstName} ${data.lastName}</td>
      <td>${data.email}</td>
      <td>${data.contactNumber || "N/A"}</td>
      <td>${data.address || "N/A"}</td>
      <td>${data.verified ? "✔️ Verified" : "❌ Unverified"}</td>
    `;
    employeeTableBody.appendChild(row);
  });
});