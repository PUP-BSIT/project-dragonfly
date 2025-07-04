const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
  const requiredFields = [
    "account_number", "customer_name", "withdraw_amount",
    "previous_balance", "new_balance", "transaction_id", "teller_id"
  ];

  for (const field of requiredFields) {
    if (!sessionStorage.getItem(field)) {
      alert("Missing receipt data. Redirecting to withdraw page.");
      return;
    }
  }

  const now = new Date();
  document.getElementById("date").textContent = now.toLocaleDateString();
  document.getElementById("time").textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  document.getElementById("account_number").textContent = sessionStorage.getItem("account_number");
  document.getElementById("customer_name").textContent = sessionStorage.getItem("customer_name");
  document.getElementById("withdraw_amount").textContent = "₱" + parseFloat(sessionStorage.getItem("withdraw_amount")).toFixed(2);
  document.getElementById("previous_balance").textContent = "₱" + parseFloat(sessionStorage.getItem("previous_balance")).toFixed(2);
  document.getElementById("new_balance").textContent = "₱" + parseFloat(sessionStorage.getItem("new_balance")).toFixed(2);
  document.getElementById("transaction_id").textContent = sessionStorage.getItem("transaction_id");
  document.getElementById("teller_id").textContent = sessionStorage.getItem("teller_id");

  document.getElementById("print_btn").addEventListener("click", () => window.print());
  document.getElementById("new_transaction_btn").addEventListener("click", () => {
    sessionStorage.removeItem("withdraw_amount");
    sessionStorage.setItem("balance", sessionStorage.getItem("new_balance") || "");
    window.location.href = "teller_withdraw.html";
  });
  document.getElementById("switch_to_deposit_btn").addEventListener("click", () => {
    sessionStorage.setItem("account_number", sessionStorage.getItem("account_number"));
    sessionStorage.setItem("customer_name", sessionStorage.getItem("customer_name"));
    sessionStorage.setItem("account_type", sessionStorage.getItem("account_type") || "");
    sessionStorage.setItem("balance", sessionStorage.getItem("new_balance") || "");
    sessionStorage.removeItem("deposit_amount");
    window.location.href = "../deposit/teller_deposit.html";
  });
  document.getElementById("dashboard_btn").addEventListener("click", () => {
    window.location.href = "../teller_dashboard.html";
  });
});
