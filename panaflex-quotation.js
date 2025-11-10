document.getElementById("addItemForm").addEventListener("submit", async function (e) {
  e.preventDefault();

  const material = "Panaflex Signage";
  const unit = "sqft";

  const length = parseFloat(document.getElementById("length").value);
  const width = parseFloat(document.getElementById("width").value);
  const quantity = parseInt(document.getElementById("quantity").value);
  const withLights = document.getElementById("withLights").checked;
  const faceType = document.querySelector('input[name="faceType"]:checked').value;

  if (isNaN(length) || isNaN(width) || isNaN(quantity)) {
    alert("Please enter valid numeric values.");
    return;
  }

  let area = length * width;
  if (area < 1) area = 1;

  let baseRate = faceType === "two" ? 800 : 500;
  if (withLights) baseRate += faceType === "two" ? 200 : 200;

  const pricePerItem = area * baseRate;
  const totalCost = pricePerItem * quantity;

  const outputDiv = document.getElementById("quotationOutput");
  outputDiv.style.display = "block";
  outputDiv.innerHTML = `
    <p><strong>Material:</strong> ${material}</p>
    <p><strong>Dimensions:</strong> ${length} x ${width} (${unit})</p>
    <p><strong>Face Type:</strong> ${faceType === "two" ? "Two-faced" : "One-faced"}</p>
    <p><strong>Includes Lights:</strong> ${withLights ? "Yes" : "No"}</p>
    <p><strong>Quantity:</strong> ${quantity}</p>
    <p><strong>Area (min 1 sq ft):</strong> ${area.toFixed(2)} sq ft</p>
    <p><strong>Price per Item:</strong> ₱${pricePerItem.toFixed(2)}</p>
    <p><strong>Total Price:</strong> ₱${totalCost.toFixed(2)}</p>
    <button id="confirmOrderBtn" class="action-btn">Confirm Order</button>
  `;

  document.getElementById("confirmOrderBtn").addEventListener("click", async () => {
    try {
      const { db, auth } = await import("./firebaseconfig.js");
      const { addDoc, collection, serverTimestamp } = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js");

      const user = auth.currentUser;
      if (!user) return alert("User not logged in");

      const orderData = {
        userId: user.uid,
        material,
        length,
        width,
        unit,
        area: area.toFixed(2),
        faceType,
        quantity,
        withLights,
        unitPrice: pricePerItem.toFixed(2),
        totalCost: totalCost.toFixed(2),
        status: "pending",
        createdAt: serverTimestamp()
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
