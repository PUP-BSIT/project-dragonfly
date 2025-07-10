const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login_form");
    const passwordInput = document.getElementById("login_password");
    const passwordToggle = document.getElementById("password_toggle");

    // Named function to handle login
    function handleLogin(username, password) {
        return fetch(API_BASE + "auth/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        }).then((response) => response.json());
    }

    // Show/hide password toggle icon when user types
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

    // Login form submit event
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const username = document
                .getElementById("login_username")
                .value.trim();
            const password = document.getElementById("login_password").value;

            handleLogin(username, password)
                .then((result) => {
                    if (result.success) {
                        window.location.href = "dashboard.html";
                    } else {
                        alert(result.message || "Invalid credentials.");
                    }
                })
                .catch((error) => {
                    console.error("Login failed:", error);
                    alert("An error occurred during login.");
                });
        });
    }
});