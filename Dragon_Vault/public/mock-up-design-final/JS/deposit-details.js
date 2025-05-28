// Check if user is logged in and load account details
window.onload = function() {
  const currentTeller = localStorage.getItem("currentTeller");
  if (!currentTeller) {
    window.location.href = "login.html";
    return;
  }

  // Load account details from localStorage
  const currentAccount = localStorage.getItem("currentAccount");
  const currentName = localStorage.getItem("currentName");
  
  if (!currentAccount || !currentName) {
    window.location.href = "deposit-find-acc.html";
    return;
  }

  // Display account information
  document.getElementById("account-display-deposit").textContent = currentAccount;
  document.getElementById("name-display-deposit").textContent = currentName;
};

// Navigation functions
function goHome() {
  window.location.href = "home.html";
}

function logout() {
  localStorage.removeItem("currentTeller");
  localStorage.removeItem("currentAccount");
  localStorage.removeItem("currentName");
  localStorage.removeItem("currentAmount");
  localStorage.removeItem("currentType");
  window.location.href = "login.html";
}

function goBack() {
  window.location.href = "deposit-find-acc.html";
}

// Confirm transaction and move to confirmation page
function confirmTransaction() {
  const amount = parseFloat(document.getElementById("deposit-amount").value);
  
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  // Store amount in localStorage
  localStorage.setItem("currentAmount", amount);
  
  // Navigate to confirmation page
  window.location.href = "confirm.html";
}