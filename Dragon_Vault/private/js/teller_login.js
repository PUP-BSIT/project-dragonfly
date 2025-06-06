const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

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
