const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
  if (!sessionStorage.getItem("account_number") || !sessionStorage.getItem("withdraw_amount")) {
    alert("Missing transaction data. Redirecting to withdrawal page.");
    window.location.href = "teller_withdraw.html";
    return;
  }

  document.getElementById("acc_num").textContent = sessionStorage.getItem("account_number");
  document.getElementById("cust_name").textContent = sessionStorage.getItem("customer_name");
  document.getElementById("acc_type").textContent = sessionStorage.getItem("account_type");
  document.getElementById("bal").textContent = sessionStorage.getItem("balance");
  document.getElementById("withdraw_amt").textContent = sessionStorage.getItem("withdraw_amount");

  document.getElementById("confirm_btn").addEventListener("click", () => {
    fetch(API_BASE + "transactions/withdraw_confirm.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_number: sessionStorage.getItem("account_number"),
        amount: sessionStorage.getItem("withdraw_amount"),
      }),
    })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        sessionStorage.setItem("previous_balance", data.previous_balance);
        sessionStorage.setItem("new_balance", data.new_balance);
        sessionStorage.setItem("transaction_id", data.transaction_id);
        sessionStorage.setItem("teller_id", data.teller_id);
        sessionStorage.setItem("customer_name", data.customer_name);
        sessionStorage.setItem("account_type", data.account_type);

        window.location.href = "teller_withdraw_receipt.html";
      } else {
        alert(data.message);
      }
    })
    .catch((error) => {
      console.error("Fetch error:", error);
      alert("Server error. Please try again.");
    });
  });

  document.getElementById("cancel_btn").addEventListener("click", () => {
    history.back();
  });
});
