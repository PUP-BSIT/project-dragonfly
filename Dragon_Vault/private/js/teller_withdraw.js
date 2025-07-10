const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

let WITHDRAWAL_LIMIT = 250000; // Default, will be updated from backend

function fetchWithdrawalLimit() {
  fetch(API_BASE + "config/limits.php")
    .then(res => res.json())
    .then(data => {
      if (data.success && data.withdrawal_limit) {
        WITHDRAWAL_LIMIT = parseFloat(data.withdrawal_limit);
        const limitSpan = document.getElementById('withdrawal_limit_display');
        if (limitSpan) {
          limitSpan.textContent = WITHDRAWAL_LIMIT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
        }
      }
    })
    .catch(() => {
      // Use default if fetch fails
    });
}

document.addEventListener('DOMContentLoaded', function() {
  // Fetch withdrawal limit from backend
  fetchWithdrawalLimit();

  // Pre-fill logic for repeat/switch
  if (sessionStorage.getItem('account_number') && sessionStorage.getItem('customer_name')) {
    document.getElementById('account_number').value = sessionStorage.getItem('account_number');
    if (sessionStorage.getItem('account_type') && sessionStorage.getItem('balance')) {
      document.getElementById('account_details').style.display = 'block';
      document.getElementById('customer_name').textContent = sessionStorage.getItem('customer_name');
      document.getElementById('account_type').textContent = sessionStorage.getItem('account_type');
      document.getElementById('account_balance').textContent = sessionStorage.getItem('balance');
      if (sessionStorage.getItem('withdraw_amount')) {
        document.getElementById('withdraw_amount').value = sessionStorage.getItem('withdraw_amount');
      }
    }
  }

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

  document.getElementById("withdrawForm").addEventListener("submit", function(e) {
    e.preventDefault();
    const amount = parseFloat(document.getElementById("withdraw_amount").value);
    if (isNaN(amount) || amount < 1) {
      document.getElementById("error_message").textContent = "Please enter a valid withdrawal amount.";
      return;
    }
    if (amount > WITHDRAWAL_LIMIT) {
      document.getElementById("error_message").textContent = `Maximum withdrawal amount is PHP ${WITHDRAWAL_LIMIT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
      return;
    }
    sessionStorage.setItem("withdraw_amount", amount);
    window.location.href = "teller_withdraw_confirm.html";
  });
  
  document.getElementById('back_btn').addEventListener('click', function () {
    window.location.href = "../teller_dashboard.html"; 
  });

  function goToHome() {
    window.location.href = "../teller_dashboard.html";
  }
});