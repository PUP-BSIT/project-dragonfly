let currentAccount = "";
let currentName = "";
let currentAmount = 0;
let currentType = ""; // deposit or withdraw
let currentTeller = "";

// Navigate between steps
function goToStep(stepId) {
  document.querySelectorAll(".step").forEach(step => step.classList.remove("active"));
  document.getElementById(stepId).classList.add("active");

  // Fill values for confirm and receipt
  if (stepId === "step-confirm") {
    document.getElementById("confirm-account").textContent = currentAccount;
    document.getElementById("confirm-name").textContent = currentName;
    document.getElementById("confirm-amount").textContent = currentAmount.toFixed(2);
    document.getElementById("confirm-type").textContent = currentType.charAt(0).toUpperCase() + currentType.slice(1);
  }

  if (stepId === "step-receipt") {
    document.getElementById("receipt-account").textContent = currentAccount;
    document.getElementById("receipt-name").textContent = currentName;
    document.getElementById("receipt-amount").textContent = currentAmount.toFixed(2);
    document.getElementById("receipt-type").textContent = currentType.charAt(0).toUpperCase() + currentType.slice(1);
    document.getElementById("receipt-date").textContent = new Date().toLocaleString();

    saveTransaction();
  }

  if (stepId === "step-history") {
    displayHistory();
  }
}

// Login
function loginTeller() {
  const tellerID = document.getElementById("login-teller-id").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (tellerID && password) {
    currentTeller = tellerID;
    goToStep("step-home");
  } else {
    alert("Please enter both Teller ID and Password.");
  }
}

// Simulate account search
function mockSearch(type) {
  const acc = document.getElementById(`account-number-${type}`).value;
  const name = document.getElementById(`customer-name-${type}`).value;

  if (acc || name) {
    currentAccount = acc || "123456";
    currentName = name || "Juan Dela Cruz";
    currentType = type;

    if (type === "deposit") {
      document.getElementById("account-display-deposit").textContent = currentAccount;
      document.getElementById("name-display-deposit").textContent = currentName;
      goToStep("step-deposit");
    } else {
      document.getElementById("account-display-withdraw").textContent = currentAccount;
      document.getElementById("name-display-withdraw").textContent = currentName;
      goToStep("step-withdraw");
    }
  } else {
    alert("Please enter account number or name.");
  }
}

function cancelConfirm() {
  if (currentType === "deposit") {
    goToStep("step-deposit");
  } else {
    goToStep("step-withdraw");
  }
}


// Move to confirm step after entering amount
function confirmTransaction(type) {
  const amount = parseFloat(document.getElementById(`${type}-amount`).value);
  if (isNaN(amount) || amount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  currentAmount = amount;
  currentType = type;
  goToStep("step-confirm");
}

// Save transaction to localStorage
function saveTransaction() {
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

// Show transaction history for current teller
function displayHistory() {
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
