document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login_form");
    const registerForm = document.getElementById("register_form");

    // Handle login
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const username = document.getElementById("login_username").value;
        const password = document.getElementById("login_password").value;

        try {
            const response = await fetch("/Dragon_Vault/api/auth/login.php", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (result.success) {
                window.location.href = "dashboard.html";
            } else {
                alert(result.message || "Invalid credentials.");
            }
        } catch (error) {
            console.error("Login failed:", error);
            alert("An error occurred during login.");
        }
    });

    // Handle registration
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const data = {
            first_name: document.getElementById("first_name").value,
            last_name: document.getElementById("last_name").value,
            middle_initial:
                document.getElementById("middle_initial").value || null,
            phone_number: document.getElementById("phone_number").value,
            email: document.getElementById("email").value,
            username: document.getElementById("register_username").value,
            password: document.getElementById("register_password").value,
        };

        const confirmPassword =
            document.getElementById("confirm_password").value;

        if (data.password !== confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {
            const response = await fetch(
                "/Dragon_Vault/api/auth/register.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                }
            );

            const result = await response.json();

            if (result.success) {
                alert("Account created! You can now log in.");
                registerForm.reset();
            } else {
                alert(result.message || "Registration failed.");
            }
        } catch (error) {
            console.error("Registration failed:", error);
            alert("An error occurred during registration.");
        }
    });
});
