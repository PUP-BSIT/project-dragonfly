const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/manager/"
  : "https://dragonvault.site/Dragon_Vault/api/manager/";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login_form");
    const errorDiv = document.getElementById("login_error");

    function handleLogin(username, password) {
        return fetch(API_BASE + "login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        }).then((response) => response.json());
    }

    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const username = document.getElementById("login_username").value.trim();
            const password = document.getElementById("login_password").value;
            handleLogin(username, password)
                .then((result) => {
                    if (result.success) {
                        window.location.href = "dashboard.html";
                    } else {
                        errorDiv.style.display = "block";
                        errorDiv.textContent = result.message || result.error || "Invalid credentials.";
                    }
                })
                .catch((error) => {
                    errorDiv.style.display = "block";
                    errorDiv.textContent = "An error occurred during login.";
                });
        });
    }
}); 