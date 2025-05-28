// Check if user is logged in
window.onload = function() {
  const currentTeller = localStorage.getItem("currentTeller");
  if (!currentTeller) {
    window.location.href = "login.html";
  }
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

function goToDeposit() {
  window.location.href = "deposit-find-acc.html";
}

function goToWithdraw() {
  window.location.href = "withdraw-find-acc.html";
}

function goToHistory() {
  window.location.href = "history.html";
}