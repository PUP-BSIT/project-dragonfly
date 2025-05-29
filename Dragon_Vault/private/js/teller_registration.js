document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("teller_register_form");

  // Register teller
  function registerTeller(data) {
    return fetch("/Dragon_Vault/api/auth/teller_registration.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }).then((response) => response.json());
  }

  // Auto-login teller after successful registration
  function loginTeller(username, password) {
    return fetch("/Dragon_Vault/api/auth/teller_login.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    }).then((response) => response.json());
  }

  if (registerForm) {
    registerForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = {
        first_name: document.getElementById("first_name").value,
        last_name: document.getElementById("last_name").value,
        branch: document.getElementById("branch").value,
        email: document.getElementById("email").value,
        username: document.getElementById("username").value,
        password: document.getElementById("password").value
      };

      registerTeller(formData)
        .then((result) => {
          if (!result.success) {
            throw new Error(result.message || "Registration failed.");
          }
          document.getElementById("success_message").textContent = "Registration successful. Logging in...";
          document.getElementById("error_message").textContent = "";

          return loginTeller(formData.username, formData.password);
        })
        .then((loginResult) => {
          if (loginResult.success) {
            window.location.href = "teller_dashboard.html";
          } else {
            document.getElementById("error_message").textContent = "Registration succeeded, but auto-login failed.";
          }
        })
        .catch((error) => {
          document.getElementById("error_message").textContent = error.message;
          document.getElementById("success_message").textContent = "";
          console.error("Error:", error);
        });
    });
  }
});
