import { db } from './firebaseconfig.js';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Form elements
const form = document.getElementById("addItemForm");
const materialSelect = document.getElementById("material");
const stockInput = document.getElementById("stock");
const unitSelect = document.getElementById("unit");
const tableBody = document.getElementById("inventoryTableBody");

const inventoryRef = collection(db, "inventory");

// Default material to unit mapping
const materialUnitMap = {
  "Panaflex": ["sq. ft."],
  "Tarpaulin": ["sq. ft."],
  "Metal Sheet": ["sq. ft."],
  "Acrylic": ["sq. ft."]
};

// Update unit dropdown when material changes
if (materialSelect) {
  materialSelect.addEventListener("change", () => {
    const selectedMaterial = materialSelect.value;
    unitSelect.innerHTML = '<option value="">Select Unit</option>';

    if (materialUnitMap[selectedMaterial]) {
      materialUnitMap[selectedMaterial].forEach((u) => {
        const opt = document.createElement("option");
        opt.value = u;
        opt.textContent = u;
        unitSelect.appendChild(opt);
      });
    }
  });
}

// Add new inventory item
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const selectedMaterial = materialSelect.value;
    const quantity = parseInt(stockInput.value);
    const selectedUnit = unitSelect.value;

    if (!selectedMaterial || isNaN(quantity) || quantity < 0 || !selectedUnit) {
      alert("Please fill in all fields correctly.");
      return;
    }

    const status = quantity <= 10 ? "LOW STOCK" : "IN STOCK";

    try {
      await addDoc(inventoryRef, {
        material: selectedMaterial,
        quantity: quantity,
        unit: selectedUnit,
        status: status,
        lastUpdated: new Date()
      });

      form.reset();
      unitSelect.innerHTML = '<option value="">Select Unit</option>';
      alert("Item added successfully!");
    } catch (error) {
      console.error("❌ Error adding item:", error);
      alert("Failed to add item.");
    }
  });
}

// Render inventory table live
if (tableBody) {
  onSnapshot(inventoryRef, (snapshot) => {
    tableBody.innerHTML = "";

    if (snapshot.empty) {
      tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;">No inventory items found.</td></tr>`;
      return;
    }

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const id = docSnap.id;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.material}</td>
        <td>
          <span class="qty-display">${item.quantity}</span>
          <input type="number" class="qty-input" min="0" value="${item.quantity}" style="display:none; width: 80px;">
        </td>
        <td>${item.unit}</td>
        <td><span class="status-text ${item.status === 'LOW STOCK' ? 'status-low-stock' : 'status-available'}">${item.status}</span></td>
        <td>
          <button class="edit-btn" data-id="${id}">Edit</button>
          <button class="save-btn" data-id="${id}" style="display:none;">Save</button>
          <button class="delete-btn" data-id="${id}">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });

    // Handle Delete
    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (confirm("Are you sure you want to delete this item?")) {
          try {
            await deleteDoc(doc(db, "inventory", id));
            alert("Item deleted successfully!");
          } catch (error) {
            console.error("❌ Delete failed:", error);
            alert("Could not delete item.");
          }
        }
      });
    });

    // Handle Edit
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const row = btn.closest("tr");
        row.querySelector(".qty-display").style.display = "none";
        row.querySelector(".qty-input").style.display = "inline-block";
        btn.style.display = "none";
        row.querySelector(".save-btn").style.display = "inline-block";
      });
    });

    // Handle Save
    document.querySelectorAll(".save-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        const row = btn.closest("tr");
        const input = row.querySelector(".qty-input");
        const newQty = parseInt(input.value);

        if (isNaN(newQty) || newQty < 0) {
          alert("Please enter a valid quantity.");
          return;
        }

        const status = newQty <= 10 ? "LOW STOCK" : "IN STOCK";

        try {
          await updateDoc(doc(db, "inventory", id), {
            quantity: newQty,
            status: status,
            lastUpdated: new Date()
          });

          row.querySelector(".qty-display").textContent = newQty;
          row.querySelector(".status-text").textContent = status;
          row.querySelector(".status-text").className = `status-text ${status === 'LOW STOCK' ? 'status-low-stock' : 'status-available'}`;
          row.querySelector(".qty-display").style.display = "inline";
          input.style.display = "none";
          row.querySelector(".edit-btn").style.display = "inline-block";
          btn.style.display = "none";
          
          alert("Item updated successfully!");
        } catch (error) {
          console.error("❌ Update failed:", error);
          alert("Failed to update item.");
        }
      });
    });
  });
}