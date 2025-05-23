document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register_form");

    // Named function to register user
    function registerUser(data) {
        return fetch("/Dragon_Vault/api/auth/register.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then((response) => response.json());
    }

    // Named function to create bank account for an account holder
    function createBankAccount(accountHolderId) {
        return fetch("/Dragon_Vault/api/account/create_account.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ account_holder_id: accountHolderId }),
        }).then((response) => response.json());
    }

    // Named function to handle login (for auto-login after registration)
    function handleLogin(username, password) {
        return fetch("/Dragon_Vault/api/auth/login.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        }).then((response) => response.json());
    }

    // Register form submit event
    if (registerForm) {
        registerForm.addEventListener("submit", (e) => {
            e.preventDefault();

            const data = {
                first_name: document.getElementById("first_name").value.trim(),
                last_name: document.getElementById("last_name").value.trim(),
                middle_initial:
                    document.getElementById("middle_initial").value.trim() ||
                    null,
                phone_number: document
                    .getElementById("phone_number")
                    .value.trim(),
                email: document.getElementById("email").value.trim(),
                username: document
                    .getElementById("register_username")
                    .value.trim(),
                password: document.getElementById("register_password").value,
            };

            const confirmPassword =
                document.getElementById("confirm_password").value;

            if (data.password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            registerUser(data)
                .then((result) => {
                    if (!result.success) {
                        throw new Error(
                            result.message || "Registration failed."
                        );
                    }
                    return createBankAccount(result.account_holder_id);
                })
                .then((accountResult) => {
                    if (!accountResult.success) {
                        throw new Error(
                            accountResult.message ||
                                "Failed to create bank account."
                        );
                    }
                    return handleLogin(data.username, data.password);
                })
                .then((loginResult) => {
                    if (loginResult.success) {
                        window.location.href = "dashboard.html";
                    } else {
                        alert("Account created, but login failed.");
                    }
                })
                .catch((error) => {
                    console.error("Registration failed:", error);
                    alert(
                        error.message ||
                            "An error occurred during registration."
                    );
                });
        });
    }
});
