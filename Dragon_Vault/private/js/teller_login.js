const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

// Password toggle functionality
const passwordInput = document.getElementById("password_input");
const passwordToggle = document.getElementById("password_toggle");

// Show/hide eye icon based on input
passwordInput.addEventListener("input", function() {
  if (passwordInput.value.length > 0) {
    passwordToggle.style.display = "block";
  } else {
    passwordToggle.style.display = "none";
  }
});

// Toggle password visibility
passwordToggle.addEventListener("click", function() {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    passwordToggle.src = "../assets/unhide.png";
    passwordToggle.alt = "Hide Password";
  } else {
    passwordInput.type = "password";
    passwordToggle.src = "../assets/hide.png";
    passwordToggle.alt = "Show Password";
  }
});

// Login form functionality
document.getElementById("teller_login_form").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username_input").value;
  const password = document.getElementById("password_input").value;

  fetch(API_BASE + "auth/teller_login.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        window.location.href = "teller_dashboard.html";
      } else {
        document.getElementById("error_message").textContent = data.message;
      }
    })
    .catch(error => {
      document.getElementById("error_message").textContent = "Login error.";
      console.error("Error:", error);
    });
});
