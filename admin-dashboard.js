// Import Firebase config
import { db } from './firebaseconfig.js';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ========== 1. PENDING ORDERS ==========
const tableBody = document.getElementById("pending-orders");

const pendingOrdersQuery = query(
  collection(db, "orders"),
  where("status", "==", "pending")
);

onSnapshot(pendingOrdersQuery, (snapshot) => {
  tableBody.innerHTML = "";

  if (snapshot.empty) {
    const noDataRow = document.createElement("tr");
    noDataRow.innerHTML = `<td colspan="6" style="text-align:center;">No pending orders found.</td>`;
    tableBody.appendChild(noDataRow);
    return;
  }

  snapshot.forEach((docSnap) => {
    const order = docSnap.data();
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${order.material || "N/A"}</td>
      <td>${order.quantity || 0}</td>
      <td>${order.unit || "N/A"}</td>
      <td>₱${order.totalCost || "0.00"}</td>
      <td>${order.status || "pending"}</td>
      <td><button type="button" class="complete-btn" data-id="${docSnap.id}">Complete</button></td>

    `;

    tableBody.appendChild(row);
  });

  // Attach event listener to all "Complete" buttons
  document.querySelectorAll(".complete-btn").forEach(button => {
  button.addEventListener("click", async (e) => {
    e.preventDefault(); // ✅ prevents page reload

    const orderId = button.getAttribute("data-id");
    const orderRef = doc(db, "orders", orderId);

    try {
      await updateDoc(orderRef, {
        status: "completed",
        completedAt: Timestamp.now()
      });
      console.log("Order marked as completed.");
    } catch (error) {
      console.error("Error updating order:", error);
    }
  });
});

});


// ========== 2. INVENTORY STATUS ==========
const inventoryTable = document.getElementById("inventory-status");

onSnapshot(collection(db, "inventory"), (snapshot) => {
  inventoryTable.innerHTML = "";

  if (snapshot.empty) {
    inventoryTable.innerHTML = `<tr><td colspan="3" style="text-align:center;">No inventory data found.</td></tr>`;
    return;
  }

  snapshot.forEach((doc) => {
    const item = doc.data();
    const status = item.quantity <= 5 ? "Low Stock" : "Available";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.material || "N/A"}</td>
      <td>${item.quantity || 0}</td>
      <td>${status}</td>
    `;
    inventoryTable.appendChild(row);
  });
});


// ========== 3. ORDER HISTORY ==========
const orderHistoryTable = document.getElementById("order-history");

const completedOrdersQuery = query(
  collection(db, "orders"),
  where("status", "==", "completed")
);

onSnapshot(completedOrdersQuery, (snapshot) => {
  orderHistoryTable.innerHTML = "";

  if (snapshot.empty) {
    orderHistoryTable.innerHTML = `<tr><td colspan="4" style="text-align:center;">No completed orders found.</td></tr>`;
    return;
  }

  snapshot.forEach((docSnap) => {
    const order = docSnap.data();
    const completedDate = order.completedAt?.toDate()?.toLocaleString() || "N/A";

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${order.material || "N/A"}</td>
      <td>${order.projectType || "N/A"}</td>
      <td>${order.customerName || "N/A"}</td>
      <td>${completedDate}</td>
    `;
    orderHistoryTable.appendChild(row);
  });
});
