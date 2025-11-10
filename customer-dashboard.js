// customer-dashboard.js

import { db, auth } from './firebaseconfig.js';
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const tableBody = document.getElementById("order-table-body");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  const ordersRef = collection(db, "orders");
  const q = query(ordersRef, where("userId", "==", user.uid));

  onSnapshot(q, (snapshot) => {
    tableBody.innerHTML = ""; // Clear existing rows
    if (snapshot.empty) {
      const noDataRow = document.createElement("tr");
      noDataRow.innerHTML = `<td colspan="3">No orders found.</td>`;
      tableBody.appendChild(noDataRow);
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${data.material || "N/A"}</td>
        <td>${data.length}ft x ${data.width}ft</td>
        <td>${data.status || "Pending"}</td>
      `;
      tableBody.appendChild(row);
    });
  });
});
