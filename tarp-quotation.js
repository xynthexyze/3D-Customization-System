import { auth, db } from './firebaseconfig.js';
import {
  addDoc,
  collection,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

document.getElementById("addItemForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const length = parseFloat(document.getElementById("length").value);
  const width = parseFloat(document.getElementById("width").value);
  const quantity = parseInt(document.getElementById("quantity").value);
  const withLights = document.getElementById("withLights").checked;

  if (isNaN(length) || isNaN(width) || isNaN(quantity)) {
    alert("Please enter valid numeric values for length, width, and quantity.");
    return;
  }

  const area = length * width;
  if (area < 1) {
    alert("Minimum area is 1 sq. ft.");
    return;
  }

  // Pricing logic
  const basePrice = withLights ? 400 : 300;
  const lightCost = withLights ? 100 : 0;
  const unitCost = area * basePrice;
  const totalCost = (unitCost + lightCost) * quantity;

  const outputDiv = document.getElementById("quotationOutput");
  outputDiv.style.display = "block";
  outputDiv.innerHTML = `
    <p><strong>Material:</strong> Tarpaulin Signage</p>
    <p><strong>Dimensions:</strong> ${length} ft x ${width} ft</p>
    <p><strong>Total Area:</strong> ${area.toFixed(2)} sq. ft.</p>
    <p><strong>Quantity:</strong> ${quantity}</p>
    <p><strong>Includes Lights:</strong> ${withLights ? "Yes (+₱100)" : "No"}</p>
    <p><strong>Total Price:</strong> ₱${totalCost.toFixed(2)}</p>
    <button id="confirmOrderBtn" class="action-btn">Confirm Order</button>
  `;

  document.getElementById("confirmOrderBtn").addEventListener("click", () => {
    // Get current user safely with auth state listener
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        alert("You must be logged in to confirm an order.");
        return;
      }

      try {
        const orderData = {
          userId: user.uid,
          material: "Tarpaulin Signage",
          length,
          width,
          unit: "sqft",
          quantity,
          withLights,
          area: area.toFixed(2),
          totalCost: totalCost.toFixed(2),
          status: "pending",
          createdAt: serverTimestamp(),
        };

        await addDoc(collection(db, "orders"), orderData);
        alert("Order successfully submitted!");
        location.reload();
      } catch (error) {
        console.error("Error confirming order:", error);
        alert("Failed to submit order.");
      }
    });
  });
});
