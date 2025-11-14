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
    alert("Please log in first.");
    window.location.href = "login.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) {
      console.error("User doc missing in Firestore.");
      alert("User data not found. Please contact administrator.");
      return;
    }
    
    const userData = userDoc.data();
    const role = userData.role;
    
    if (role !== "Admin") {
      console.error("Access denied. Admin role required.");
      alert("Access denied. Admin privileges required.");
      window.location.href = "login.html";
      return;
    }

    // If authenticated and role is valid, proceed to load data
    console.log("Loading admin dashboard data...");
    loadPendingOrders();
    loadInventory();
    
  } catch (error) {
    console.error("Error in role check:", error);
    alert("Failed to verify role: " + error.message);
  }
});

// ========== 1. PENDING ORDERS (Waiting for Admin Confirmation) ==========
function loadPendingOrders() {
  const tableBody = document.getElementById("pending-orders");
  if (!tableBody) {
    console.error("Pending orders table not found.");
    return;
  }

  const pendingOrdersQuery = query(
    collection(db, "orders"),
    where("status", "==", "pending_admin")
  );

  onSnapshot(pendingOrdersQuery, (snapshot) => {
    console.log("Pending orders snapshot received. Empty?", snapshot.empty);
    tableBody.innerHTML = "";
    
    if (snapshot.empty) {
      const noDataRow = document.createElement("tr");
      noDataRow.innerHTML = `<td colspan="6" style="text-align:center;">No orders waiting for confirmation.</td>`;
      tableBody.appendChild(noDataRow);
      return;
    }

    snapshot.forEach((docSnap) => {
      const order = docSnap.data();
      console.log("Pending order data:", order);
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.material || "N/A"}</td>
        <td>${order.quantity || 0}</td>
        <td>${order.unit || "N/A"}</td>
        <td>₱${order.totalCost || "0.00"}</td>
        <td><span class="status-badge pending">Waiting Confirmation</span></td>
        <td>
          <button type="button" class="confirm-btn" data-id="${docSnap.id}">Confirm</button>
          <button type="button" class="reject-btn" data-id="${docSnap.id}">Reject</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Attach event listeners for buttons
    attachOrderActionListeners();
  }, (error) => {
    console.error("Error fetching pending orders:", error);
    alert("Failed to load pending orders: " + error.message);
  });
}

// ========== ORDER ACTION HANDLERS ==========
function attachOrderActionListeners() {
  // Confirm Order buttons
  document.querySelectorAll(".confirm-btn").forEach(button => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      const orderId = button.getAttribute("data-id");
      await updateOrderStatus(orderId, "pending", "Order confirmed and sent to employees!");
    });
  });

  // Reject Order buttons
  document.querySelectorAll(".reject-btn").forEach(button => {
    button.addEventListener("click", async (e) => {
      e.preventDefault();
      const orderId = button.getAttribute("data-id");
      await updateOrderStatus(orderId, "rejected", "Order has been rejected.");
    });
  });
}

async function updateOrderStatus(orderId, status, message) {
  try {
    await updateDoc(doc(db, "orders", orderId), {
      status: status,
      updatedAt: Timestamp.now(),
      ...(status === "pending" && { confirmedAt: Timestamp.now() })
    });
    console.log(`Order ${status}:`, orderId);
    alert(message);
  } catch (error) {
    console.error("Error updating order:", error);
    alert("Failed to update order: " + error.message);
  }
}

// ========== 2. INVENTORY STATUS ==========
function loadInventory() {
  const inventoryTable = document.getElementById("inventory-status");
  if (!inventoryTable) {
    console.error("Inventory table not found.");
    return;
  }

  onSnapshot(collection(db, "inventory"), (snapshot) => {
    console.log("Inventory snapshot received. Empty?", snapshot.empty);
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
  }, (error) => {
    console.error("Error fetching inventory:", error);
    alert("Failed to load inventory: " + error.message);
  });
}