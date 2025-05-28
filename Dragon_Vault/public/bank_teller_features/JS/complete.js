// Check if user is logged in
window.onload = function() {
  const currentTeller = localStorage.getItem("currentTeller");
  if (!currentTeller) {
    window.location.href = "login.html";
    return;
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

// Return home and clear transaction data
function returnHome() {
  // Clear current transaction data but keep teller logged in
  localStorage.removeItem("currentAccount");
  localStorage.removeItem("currentName");
  localStorage.removeItem("currentAmount");
  localStorage.removeItem("currentType");
  
  window.location.href = "home.html";
}