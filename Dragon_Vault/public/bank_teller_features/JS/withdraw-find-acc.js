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

// Search account for withdraw
function searchAccount() {
  const acc = document.getElementById("account-number-withdraw").value.trim();
  const name = document.getElementById("customer-name-withdraw").value.trim();

  if (acc || name) {
    const currentAccount = acc || "Account not provided";
    const currentName = name || "Name not provided";
    
    localStorage.setItem("currentAccount", currentAccount);
    localStorage.setItem("currentName", currentName);
    localStorage.setItem("currentType", "withdraw");
    
    window.location.href = "withdraw-details.html";
  } else {
    alert("Please enter account number or name.");
  }
}