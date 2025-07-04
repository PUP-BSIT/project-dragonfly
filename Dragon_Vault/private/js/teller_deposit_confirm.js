const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
  if (!sessionStorage.getItem("account_number") || !sessionStorage.getItem("deposit_amount")) {
    alert("Missing transaction data. Redirecting to deposit page.");
    window.location.href = "teller_deposit.html";
    return;
  }

  document.getElementById("acc_num").textContent = sessionStorage.getItem("account_number");
  document.getElementById("cust_name").textContent = sessionStorage.getItem("customer_name");
  document.getElementById("acc_type").textContent = sessionStorage.getItem("account_type");
  document.getElementById("bal").textContent = sessionStorage.getItem("balance");
  document.getElementById("deposit_amt").textContent = sessionStorage.getItem("deposit_amount");

  document.getElementById("confirm_btn").addEventListener("click", () => {
    fetch(API_BASE + "transactions/deposit_confirm.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        account_number: sessionStorage.getItem("account_number"),
        amount: sessionStorage.getItem("deposit_amount"),
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

        window.location.href = "teller_deposit_receipt.html";
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

console.log(sessionStorage.getItem("account_number"));
console.log(sessionStorage.getItem("deposit_amount"));
