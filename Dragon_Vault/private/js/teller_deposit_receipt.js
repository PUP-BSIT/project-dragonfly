const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
  // Validate required session data
  const requiredFields = [
    "account_number", "customer_name", "deposit_amount",
    "previous_balance", "new_balance", "transaction_id", "teller_id"
  ];

  for (const field of requiredFields) {
    if (!sessionStorage.getItem(field)) {
      alert("Missing receipt data. Redirecting to deposit page.");
    //   window.location.href = "teller_deposit.html";
      return;
    }
  }

  // Display current date and time
  const now = new Date();
  document.getElementById("date").textContent = now.toLocaleDateString();
  document.getElementById("time").textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Populate receipt fields
  document.getElementById("account_number").textContent = sessionStorage.getItem("account_number");
  document.getElementById("customer_name").textContent = sessionStorage.getItem("customer_name");
  document.getElementById("deposit_amount").textContent = "₱" + parseFloat(sessionStorage.getItem("deposit_amount")).toFixed(2);
  document.getElementById("previous_balance").textContent = "₱" + parseFloat(sessionStorage.getItem("previous_balance")).toFixed(2);
  document.getElementById("new_balance").textContent = "₱" + parseFloat(sessionStorage.getItem("new_balance")).toFixed(2);
  document.getElementById("transaction_id").textContent = sessionStorage.getItem("transaction_id");
  document.getElementById("teller_id").textContent = sessionStorage.getItem("teller_id");

  // Button actions
  document.getElementById("print_btn").addEventListener("click", () => window.print());
  document.getElementById("new_transaction_btn").addEventListener("click", () => {
    window.location.href = "teller_deposit.html";
  });
  document.getElementById("dashboard_btn").addEventListener("click", () => {
    window.location.href = "/Dragon_Vault/private/teller_dashboard.html";
  });
});
