const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
  const requiredFields = [
    "account_number", "customer_name", "new_balance"
  ];

  for (const field of requiredFields) {
    if (!sessionStorage.getItem(field)) {
      alert("Missing transaction data. Redirecting to dashboard.");
      window.location.href = "../teller_dashboard.html";
      return;
    }
  }

  // Display current account information
  document.getElementById("account_number").textContent = sessionStorage.getItem("account_number");
  document.getElementById("customer_name").textContent = sessionStorage.getItem("customer_name");
  document.getElementById("current_balance").textContent = parseFloat(sessionStorage.getItem("new_balance")).toFixed(2);

  // Continue withdrawal on same account
  document.getElementById("repeat_withdraw_btn").addEventListener("click", () => {
    // Clear the previous withdrawal amount but keep account info
    sessionStorage.removeItem("withdraw_amount");
    sessionStorage.setItem("balance", sessionStorage.getItem("new_balance") || "");
    window.location.href = "teller_withdraw.html";
  });

  // Switch to deposit with same account
  document.getElementById("switch_deposit_btn").addEventListener("click", () => {
    sessionStorage.setItem("account_number", sessionStorage.getItem("account_number"));
    sessionStorage.setItem("customer_name", sessionStorage.getItem("customer_name"));
    sessionStorage.setItem("account_type", sessionStorage.getItem("account_type") || "");
    sessionStorage.setItem("balance", sessionStorage.getItem("new_balance") || "");
    sessionStorage.removeItem("deposit_amount");
    window.location.href = "../deposit/teller_deposit.html";
  });

  // Back to dashboard
  document.getElementById("back_dashboard_btn").addEventListener("click", () => {
    // Clear all session storage related to transaction
    sessionStorage.removeItem("account_number");
    sessionStorage.removeItem("customer_name");
    sessionStorage.removeItem("account_type");
    sessionStorage.removeItem("balance");
    sessionStorage.removeItem("withdraw_amount");
    sessionStorage.removeItem("previous_balance");
    sessionStorage.removeItem("new_balance");
    sessionStorage.removeItem("transaction_id");
    sessionStorage.removeItem("teller_id");
    
    window.location.href = "../teller_dashboard.html";
  });
});