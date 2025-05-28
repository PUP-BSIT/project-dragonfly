// Login functionality
function loginTeller() {
  const tellerID = document.getElementById("login-teller-id").value.trim();
  const password = document.getElementById("login-password").value.trim();

  if (tellerID && password) {
    // Store current teller in localStorage for use across pages
    localStorage.setItem("currentTeller", tellerID);
    // Navigate to home page
    window.location.href = "home.html";
  } else {
    alert("Please enter both Teller ID and Password.");
  }
}