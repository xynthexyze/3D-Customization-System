import { db, auth } from './firebaseconfig.js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    console.error("No user logged in.");
    window.location.href = "login.html";
    return;
  }

  try {
    loadPendingInvoices(user.uid, user.email);
    loadPaymentHistory(user.uid, user.email);
    
  } catch (error) {
    console.error("Error in billing page:", error);
    alert("Failed to load billing information: " + error.message);
  }
});

async function loadPendingInvoices(userId, userEmail) {
  const pendingInvoices = document.getElementById('pendingInvoices');
  if (!pendingInvoices) return;
  
  const invoicesQuery = query(
    collection(db, "orders"),
    where("userId", "==", userId),
    where("status", "in", ["pending_admin", "pending", "completed"]),
    where("paid", "==", false)
  );

  onSnapshot(invoicesQuery, (snapshot) => {
    pendingInvoices.innerHTML = "";
    
    if (snapshot.empty) {
      pendingInvoices.innerHTML = '<p>No pending invoices found.</p>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const order = docSnap.data();
      const invoiceDiv = document.createElement('div');
      invoiceDiv.className = 'invoice-item';
      invoiceDiv.innerHTML = `
        <h4>Invoice: ${docSnap.id.slice(-8)}</h4>
        <p><strong>Project:</strong> ${order.material || "N/A"}</p>
        <p><strong>Amount Due:</strong> ₱${order.totalCost || "0.00"}</p>
        <p><strong>Status:</strong> ${getStatusText(order.status)}</p>
        <button class="pay-invoice-btn" data-id="${docSnap.id}" data-amount="${order.totalCost}">
          Pay Now
        </button>
      `;
      pendingInvoices.appendChild(invoiceDiv);
    });

    // Attach event listeners to pay buttons
    document.querySelectorAll('.pay-invoice-btn').forEach(button => {
      button.addEventListener('click', function() {
        const invoiceId = this.getAttribute('data-id');
        const amount = this.getAttribute('data-amount');
        processPayment(invoiceId, amount, userId, userEmail);
      });
    });
  });
}

async function loadPaymentHistory(userId, userEmail) {
  const paymentHistory = document.getElementById('paymentHistory');
  if (!paymentHistory) return;
  
  const paymentsQuery = query(
    collection(db, "payments"),
    where("userId", "==", userId),
    orderBy("timestamp", "desc")
  );

  onSnapshot(paymentsQuery, (snapshot) => {
    paymentHistory.innerHTML = "";
    
    if (snapshot.empty) {
      paymentHistory.innerHTML = '<p>No payment records found.</p>';
      return;
    }

    snapshot.forEach((docSnap) => {
      const payment = docSnap.data();
      const time = payment.timestamp?.toDate()?.toLocaleString() || "N/A";
      
      const div = document.createElement('div');
      div.style.borderBottom = "1px solid #ccc";
      div.style.padding = "10px 0";
      
      div.innerHTML = `
        <strong>Invoice ID:</strong> ${payment.invoiceId}<br>
        <strong>Amount:</strong> ₱${payment.amount}<br>
        <strong>Status:</strong> ${payment.status}<br>
        <strong>Date:</strong> ${time}<br>
        <strong>Payment Method:</strong> ${payment.method}
      `;
      paymentHistory.appendChild(div);
    });
  });
}

function processPayment(invoiceId, amount, userId, userEmail) {
  const paypalContainer = document.getElementById('paypal-button-container');
  if (!paypalContainer) return;
  
  const invoiceIdShort = invoiceId.slice(-8);
  
  paypalContainer.innerHTML = `
    <div class="payment-details">
      <h4>Payment Details</h4>
      <p><strong>Invoice:</strong> ${invoiceIdShort}</p>
      <p><strong>Amount:</strong> ₱${amount}</p>
      <p>Click the PayPal button below to complete your payment.</p>
      <div id="dynamic-paypal-buttons"></div>
    </div>
  `;

  // Render PayPal buttons
  if (window.paypal) {
    window.paypal.Buttons({
      style: {
        color: "gold",
        shape: "rect",
        label: "pay",
        height: 40
      },

      createOrder: function(data, actions) {
        return actions.order.create({
          purchase_units: [{
            reference_id: invoiceId,
            description: `Project Payment - Invoice ${invoiceIdShort}`,
            amount: {
              currency_code: "PHP",
              value: amount
            }
          }]
        });
      },

      onApprove: async function(data, actions) {
        try {
          const order = await actions.order.capture();
          console.log("Payment successful:", order);

          // Save payment record
          await addDoc(collection(db, "payments"), {
            userId: userId,
            userEmail: userEmail,
            invoiceId: invoiceId,
            amount: parseFloat(amount),
            method: "PayPal",
            status: "Paid",
            transactionId: order.id,
            payerName: order.payer.name.given_name + " " + order.payer.name.surname,
            payerEmail: order.payer.email_address,
            timestamp: serverTimestamp()
          });

          // Update order status to mark as paid
          await updateDoc(doc(db, "orders", invoiceId), {
            paid: true,
            paymentDate: serverTimestamp(),
            paymentMethod: "PayPal",
            transactionId: order.id
          });

          alert("✅ Payment successful! Thank you for your payment.");
          
          // Reload the page to show updated status
          setTimeout(() => {
            window.location.reload();
          }, 2000);
          
        } catch (error) {
          console.error("Error processing payment:", error);
          alert("❌ Payment processing failed: " + error.message);
        }
      },

      onCancel: function() {
        alert("⚠️ Payment cancelled by user.");
      },

      onError: function(err) {
        console.error("PayPal error:", err);
        alert("❌ Payment failed. Please try again later.");
      }
    }).render("#dynamic-paypal-buttons");
  }
}

function getStatusText(status) {
  switch(status) {
    case "pending_admin": return "Waiting Admin Confirmation";
    case "pending": return "In Production";
    case "completed": return "Ready for Pickup";
    default: return status;
  }
}