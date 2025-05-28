// Check if user is logged in and load receipt details
window.onload = function() {
  const currentTeller = localStorage.getItem("currentTeller");
  if (!currentTeller) {
    window.location.href = "login.html";
    return;
  }

  // Load transaction details from localStorage
  const currentAccount = localStorage.getItem("currentAccount");
  const currentName = localStorage.getItem("currentName");
  const currentAmount = localStorage.getItem("currentAmount");
  const currentType = localStorage.getItem("currentType");
  
  if (!currentAccount || !currentName || !currentAmount || !currentType) {
    window.location.href = "home.html";
    return;
  }

  // Display receipt information
  document.getElementById("receipt-account").textContent = currentAccount;
  document.getElementById("receipt-name").textContent = currentName;
  document.getElementById("receipt-amount").textContent = parseFloat(currentAmount).toFixed(2);
  document.getElementById("receipt-type").textContent = currentType.charAt(0).toUpperCase() + currentType.slice(1);
  document.getElementById("receipt-date").textContent = new Date().toLocaleString();

  // Save transaction to history
  saveTransaction();
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
  window.location.href = "confirm.html";
}

// Save transaction to localStorage
function saveTransaction() {
  const currentTeller = localStorage.getItem("currentTeller");
  const currentAccount = localStorage.getItem("currentAccount");
  const currentName = localStorage.getItem("currentName");
  const currentAmount = parseFloat(localStorage.getItem("currentAmount"));
  const currentType = localStorage.getItem("currentType");

  const history = JSON.parse(localStorage.getItem("transactions") || "[]");
  history.push({
    teller: currentTeller,
    type: currentType,
    account: currentAccount,
    name: currentName,
    amount: currentAmount,
    date: new Date().toLocaleString()
  });
  localStorage.setItem("transactions", JSON.stringify(history));
}

// Complete transaction and go to completion page
function completeTransaction() {
  window.location.href = "complete.html";
}