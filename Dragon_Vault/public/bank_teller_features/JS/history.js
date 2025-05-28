// Check if user is logged in and display history
window.onload = function() {
  const currentTeller = localStorage.getItem("currentTeller");
  if (!currentTeller) {
    window.location.href = "login.html";
    return;
  }

  // Display transaction history
  displayHistory();
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

// Show transaction history for current teller
function displayHistory() {
  const currentTeller = localStorage.getItem("currentTeller");
  const historyList = document.getElementById("history-list");
  historyList.innerHTML = "";

  const history = JSON.parse(localStorage.getItem("transactions") || "[]");
  const filtered = history.filter(tx => tx.teller === currentTeller);

  if (filtered.length === 0) {
    historyList.innerHTML = "<li>No transactions found.</li>";
    return;
  }

  filtered.reverse().forEach(tx => {
    const li = document.createElement("li");
    li.textContent = `[${tx.date}] ${tx.type.toUpperCase()} - ₱${tx.amount.toFixed(2)} to ${tx.name} (${tx.account})`;
    historyList.appendChild(li);
  });
}