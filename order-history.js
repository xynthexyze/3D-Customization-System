import { db, auth } from "./firebaseconfig.js";
import {
  collection,
  query,
  where,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const tableBody = document.getElementById("history-table-body");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    alert("Please login to view your order history.");
    window.location.href = "login.html";
    return;
  }

  const ordersRef = collection(db, "orders");
  const completedOrdersQuery = query(
    ordersRef,
    where("userId", "==", user.uid),
    where("status", "==", "completed")
  );

  onSnapshot(completedOrdersQuery, (snapshot) => {
    tableBody.innerHTML = "";

    if (snapshot.empty) {
      const noData = document.createElement("tr");
      noData.innerHTML = `<td colspan="5">No completed orders found.</td>`;
      tableBody.appendChild(noData);
      return;
    }

    snapshot.forEach((doc) => {
      const data = doc.data();
      const completedDate = data.completedAt?.toDate()?.toLocaleString() || "N/A";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${data.projectType || "N/A"}</td>
        <td>${data.material || "N/A"}</td>
        <td>${data.quantity || 0}</td>
        <td>₱${data.totalCost || "0.00"}</td>
        <td>${completedDate}</td>
      `;
      tableBody.appendChild(row);
    });
  });
});
