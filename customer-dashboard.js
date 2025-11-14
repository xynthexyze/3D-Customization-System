import { db, auth } from './firebaseconfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { collection, query, where, onSnapshot, getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.error("No user logged in.");
    window.location.href = "login.html";
    return;
  }

  try {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    const role = userDoc.exists() ? userDoc.data().role : null;
    if (role !== "Customer") {
      console.error("Access denied for non-customers.");
      window.location.href = "login.html";
      return;
    }
    console.log("Customer dashboard loaded for:", user.email);
    loadCustomerOrders(user.uid);
  } catch (error) {
    console.error("Error in customer dashboard:", error);
    alert("Failed to load dashboard: " + error.message);
  }
});

function loadCustomerOrders(userId) {
  const tableBody = document.getElementById("order-table-body");
  if (!tableBody) {
    console.error("Customer orders table not found.");
    return;
  }

  const ordersQuery = query(
    collection(db, "orders"),
    where("userId", "==", userId)
  );

  onSnapshot(ordersQuery, (snapshot) => {
    console.log("Customer orders snapshot. Empty?", snapshot.empty);
    tableBody.innerHTML = "";
    
    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">No orders found.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const order = docSnap.data();
      const statusText = getStatusText(order.status);
      const statusClass = getStatusClass(order.status);
      const dimension = order.length && order.width ? 
        `${order.length} x ${order.width} ${order.unit}` : "Custom";
      
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${order.material || "N/A"}</td>
        <td>${dimension}</td>
        <td>₱${order.totalCost || "0.00"}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      `;
      tableBody.appendChild(row);
    });
  }, (error) => {
    console.error("Error fetching customer orders:", error);
    alert("Failed to load orders: " + error.message);
  });
}

function getStatusText(status) {
  switch(status) {
    case "pending_admin": return "Waiting Confirmation";
    case "pending": return "In Production";
    case "completed": return "Completed";
    case "rejected": return "Rejected";
    default: return "Pending";
  }
}

function getStatusClass(status) {
  switch(status) {
    case "pending_admin": return "pending";
    case "pending": return "in-progress";
    case "completed": return "completed";
    case "rejected": return "rejected";
    default: return "pending";
  }
}