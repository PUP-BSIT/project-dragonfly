document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login_form");

    // Named function to handle login
    function handleLogin(username, password) {
        return fetch("/Dragon_Vault/api/auth/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        }).then((response) => response.json());
    }

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
