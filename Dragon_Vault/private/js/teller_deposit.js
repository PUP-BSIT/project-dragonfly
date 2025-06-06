// /Dragon_Vault/private/js/teller_deposit.js
const API_BASE = "/Dragon_Vault/api/";

document.getElementById("lookupForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const accountNumber = document.getElementById("account_number").value;

  fetch(API_BASE + 'transactions/fetch_account.php', {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ account_number: accountNumber })
  })
  .then(res => res.json())
  .then(data => {
    if (!data.success) throw new Error(data.message);
    document.getElementById("account_details").style.display = "block";
    document.getElementById("customer_name").textContent = data.full_name;
    document.getElementById("account_type").textContent = data.account_type;
    document.getElementById("account_balance").textContent = data.balance;
    sessionStorage.setItem("account_number", accountNumber);
    sessionStorage.setItem("customer_name", data.full_name);
    sessionStorage.setItem("account_type", data.account_type);
    sessionStorage.setItem("balance", data.balance);
  })
  .catch(err => {
    document.getElementById("error_message").textContent = err.message;
  });
});

document.getElementById("depositForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const amount = document.getElementById("deposit_amount").value;
  sessionStorage.setItem("deposit_amount", amount);
  window.location.href = "teller_deposit_confirm.html";
});

document.getElementById('back_btn').addEventListener('click', function () {
  window.location.href = 'teller_dashboard.html'; 
});

function goToHome() {
    window.location.href = "../teller_dashboard.html";
}