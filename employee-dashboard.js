// Import Firebase config
import { db, auth } from './firebaseconfig.js';
import {
  collection,
  query,
  where,
  onSnapshot,
  updateDoc,
  doc,
  Timestamp,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ========== AUTHENTICATION AND ROLE CHECK ==========
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.error("No user logged in. Redirecting to login.");
    window.location.href = "login.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.exists() ? userDoc.data().role : null;
    
    if (role !== "Employee") {
      console.error("Access denied for non-employees.");
      window.location.href = "login.html";
      return;
    }

    console.log("Employee dashboard loaded for:", user.email);
    loadPendingOrders();
    loadInventory();
    
  } catch (error) {
    console.error("Error in employee dashboard:", error);
    alert("Failed to load dashboard: " + error.message);
  }
});

// ========== 1. PENDING ORDERS (Only confirmed orders) ==========
function loadPendingOrders() {
  const tableBody = document.getElementById("pending-orders");
  if (!tableBody) {
    console.error("Pending orders table not found.");
    return;
  }

  const pendingOrdersQuery = query(
    collection(db, "orders"),
    where("status", "==", "pending")
  );

  onSnapshot(pendingOrdersQuery, (snapshot) => {
    tableBody.innerHTML = "";

    if (snapshot.empty) {
      const noDataRow = document.createElement("tr");
      noDataRow.innerHTML = `<td colspan="6" style="text-align:center;">No confirmed orders available.</td>`;
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
        <td><span class="status-badge pending">Ready for Production</span></td>
        <td><button type="button" class="complete-btn" data-id="${docSnap.id}">Mark Complete</button></td>
      `;
      tableBody.appendChild(row);
    });

    // Attach event listener to all "Complete" buttons
    document.querySelectorAll(".complete-btn").forEach(button => {
      button.addEventListener("click", async (e) => {
        e.preventDefault();
        const orderId = button.getAttribute("data-id");
        
        try {
          await updateDoc(doc(db, "orders", orderId), {
            status: "completed",
            completedAt: Timestamp.now()
          });
          console.log("Order marked as completed:", orderId);
          alert("Order completed successfully!");
        } catch (error) {
          console.error("Error updating order:", error);
          alert("Failed to complete order: " + error.message);
        }
      });
    });
  });
}

// ========== 2. INVENTORY STATUS ==========
function loadInventory() {
  const inventoryTable = document.getElementById("inventory-status");
  if (!inventoryTable) {
    console.error("Inventory table not found.");
    return;
  }

  onSnapshot(collection(db, "inventory"), (snapshot) => {
    inventoryTable.innerHTML = "";

    if (snapshot.empty) {
      inventoryTable.innerHTML = `<tr><td colspan="3" style="text-align:center;">No inventory data found.</td></tr>`;
      return;
    }

    snapshot.forEach((doc) => {
      const item = doc.data();
      const status = item.quantity <= 5 ? "Low Stock" : "Available";
      const statusClass = item.quantity <= 5 ? "low-stock" : "available";
      
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.material || "N/A"}</td>
        <td>${item.quantity || 0}</td>
        <td><span class="status-badge ${statusClass}">${status}</span></td>
      `;
      inventoryTable.appendChild(row);
    });
  });
}