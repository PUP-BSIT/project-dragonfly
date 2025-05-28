// Check if user is logged in and load transaction details
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

  // Display transaction information
  document.getElementById("confirm-account").textContent = currentAccount;
  document.getElementById("confirm-name").textContent = currentName;
  document.getElementById("confirm-amount").textContent = parseFloat(currentAmount).toFixed(2);
  document.getElementById("confirm-type").textContent = currentType.charAt(0).toUpperCase() + currentType.slice(1);
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
  const currentType = localStorage.getItem("currentType");
  if (currentType === "deposit") {
    window.location.href = "deposit-details.html";
  } else {
    window.location.href = "withdraw-details.html";
  }
}

// Process transaction and go to receipt
function processTransaction() {
  window.location.href = "receipt.html";
}