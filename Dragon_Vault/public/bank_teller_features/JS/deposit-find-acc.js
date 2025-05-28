window.onload = function() {
  const currentTeller = localStorage.getItem("currentTeller");
  if (!currentTeller) {
    window.location.href = "login.html";
  }
};

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

// Search account for deposit
function searchAccount() {
  const acc = document.getElementById("account-number-deposit").value.trim();
  const name = document.getElementById("customer-name-deposit").value.trim();

  if (acc || name) {
    const currentAccount = acc || "Account not provided";
    const currentName = name || "Name not provided";

    localStorage.setItem("currentAccount", currentAccount);
    localStorage.setItem("currentName", currentName);
    localStorage.setItem("currentType", "deposit");
    
    window.location.href = "deposit-details.html";
  } else {
    alert("Please enter account number or name.");
  }
}