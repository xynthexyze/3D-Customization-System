import { db } from './firebaseconfig.js';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const customersTableBody = document.getElementById("customers-table-body");

const q = query(collection(db, "users"), where("role", "==", "Customer"));

onSnapshot(q, (snapshot) => {
  customersTableBody.innerHTML = ""; // clear before re-rendering
  snapshot.forEach((doc) => {
    const data = doc.data();
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${data.firstName} ${data.lastName}</td>
      <td>${data.email}</td>
      <td>${data.contactNo}</td>
      <td>${data.address}</td>
      <td>${data.verified ? "✔️ Verified" : "❌ Unverified"}</td>
    `;
    customersTableBody.appendChild(row);
  });
});
