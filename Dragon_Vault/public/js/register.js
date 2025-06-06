const API_BASE = "/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register_form");
    const passwordInput = document.getElementById("register_password");
    const confirmPasswordInput = document.getElementById("confirm_password");

    // Password visibility toggle function
    window.togglePasswordVisibility = function(inputId, btn) {
        const input = document.getElementById(inputId);
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        if (btn) btn.textContent = isPassword ? "Hide" : "Show";
    };

    // Real-time password requirement checking
    function checkPasswordRequirements(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        const uppercaseStatus = document.getElementById("req-uppercase").querySelector('.req-status');
        const lowercaseStatus = document.getElementById("req-lowercase").querySelector('.req-status');
        const numberStatus = document.getElementById("req-number").querySelector('.req-status');
        const specialStatus = document.getElementById("req-special").querySelector('.req-status');
        const lengthStatus = document.getElementById("req-length").querySelector('.req-status');

        const uppercaseLi = document.getElementById("req-uppercase");
        const lowercaseLi = document.getElementById("req-lowercase");
        const numberLi = document.getElementById("req-number");
        const specialLi = document.getElementById("req-special");
        const lengthLi = document.getElementById("req-length");

        uppercaseStatus.textContent = hasUpperCase ? "Met" : "Not met";
        lowercaseStatus.textContent = hasLowerCase ? "Met" : "Not met";
        numberStatus.textContent = hasNumbers ? "Met" : "Not met";
        specialStatus.textContent = hasSpecialChar ? "Met" : "Not met";
        lengthStatus.textContent = isLongEnough ? "Met" : "Not met";

        uppercaseLi.classList.toggle('met', hasUpperCase);
        uppercaseLi.classList.toggle('not-met', !hasUpperCase);
        lowercaseLi.classList.toggle('met', hasLowerCase);
        lowercaseLi.classList.toggle('not-met', !hasLowerCase);
        numberLi.classList.toggle('met', hasNumbers);
        numberLi.classList.toggle('not-met', !hasNumbers);
        specialLi.classList.toggle('met', hasSpecialChar);
        specialLi.classList.toggle('not-met', !hasSpecialChar);
        lengthLi.classList.toggle('met', isLongEnough);
        lengthLi.classList.toggle('not-met', !isLongEnough);

        return {
            isValid: hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough,
            errors: []
        };
    }

    // Add input event listeners for real-time password checking
    if (passwordInput) {
        passwordInput.addEventListener("input", (e) => {
            checkPasswordRequirements(e.target.value);
        });
    }

    // Password validation function
    function validatePassword(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;

        const errors = [];
        if (!hasUpperCase) errors.push("uppercase letter");
        if (!hasLowerCase) errors.push("lowercase letter");
        if (!hasNumbers) errors.push("number");
        if (!hasSpecialChar) errors.push("special character");
        if (!isLongEnough) errors.push("at least 8 characters");

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Named function to register user
    function registerUser(data) {
        return fetch(API_BASE + "auth/register.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        }).then((response) => response.json());
    }

    // Named function to handle login (for auto-login after registration)
    function handleLogin(username, password) {
        return fetch(API_BASE + "auth/login.php", {
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
                middle_initial: document.getElementById("middle_initial").value.trim() || null,
                phone_number: document.getElementById("phone_number").value.trim(),
                email: document.getElementById("email").value.trim(),
                username: document.getElementById("register_username").value.trim(),
                password: document.getElementById("register_password").value,
            };

            const confirmPassword = document.getElementById("confirm_password").value;

            // Validate password
            const passwordValidation = validatePassword(data.password);
            if (!passwordValidation.isValid) {
                alert(`Password must contain: ${passwordValidation.errors.join(", ")}`);
                return;
            }

            if (data.password !== confirmPassword) {
                alert("Passwords do not match.");
                return;
            }

            registerUser(data)
                .then((result) => {
                    if (!result.success) {
                        throw new Error(result.message || "Registration failed.");
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
                    alert(error.message || "An error occurred during registration.");
                });
        });
    }
});
