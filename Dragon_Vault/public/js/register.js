let currentRegScreen = 1;
let registrationPhoneNumber = "";
let resendRegTimer = 0;
let resendRegInterval;

const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

// Screen navigation
function showRegScreen(screenNum) {
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active");
    });
    if (screenNum === 1) {
        document.getElementById("registrationScreen").classList.add("active");
    } else if (screenNum === 2) {
        document.getElementById("otpVerificationScreen").classList.add("active");
    }
    currentRegScreen = screenNum;
    updateRegProgressBar();
}

function updateRegProgressBar() {
    const progress = (currentRegScreen / 2) * 100; // 2 screens for registration flow
    document.getElementById("progressFillReg").style.width = `${progress}%`;
}

// Phone number masking
function maskPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");
}

// OTP input handling
function setupOtpInputs(containerId) {
    const otpInputs = document.querySelectorAll(`#${containerId} .otp-input`);

    otpInputs.forEach((input, index) => {
        input.addEventListener("input", function (e) {
            if (e.target.value.length === 1) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            } else if (e.target.value.length === 0 && e.inputType === 'deleteContentBackward') {
                if (index > 0) {
                    otpInputs[index - 1].focus();
                }
            }
        });

        input.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && e.target.value === "" && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
}

function getOtpValue(containerId) {
    const otpInputs = document.querySelectorAll(`#${containerId} .otp-input`);
    return Array.from(otpInputs)
        .map((input) => input.value)
        .join("");
}

function clearOtpInputs(containerId) {
    document.querySelectorAll(`#${containerId} .otp-input`).forEach((input) => {
        input.value = "";
    });
    document.querySelector(`#${containerId} .otp-input`).focus();
}

// Resend timer
function startResendTimer(timerElementId, resendLinkId, intervalVarName) {
    const timerElement = document.getElementById(timerElementId);
    const resendLink = document.getElementById(resendLinkId);
    resendRegTimer = 60;
    resendLink.classList.add("disabled");

    window[intervalVarName] = setInterval(() => {
        timerElement.textContent = `(${resendRegTimer}s)`;
        resendRegTimer--;

        if (resendRegTimer < 0) {
            clearInterval(window[intervalVarName]);
            resendLink.classList.remove("disabled");
            timerElement.textContent = "";
        }
    }, 1000);
}

// API calls
async function verifyRegistrationOtp(phone, otp) {
    try {
        const response = await fetch(`${API_BASE}auth/verify_registration_otp.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ phone_number: phone, otp: otp })
        });
        const data = await response.json();
        return { success: data.success, message: data.message };
    } catch (error) {
        console.error('Error verifying registration OTP:', error);
        return { success: false, message: 'Failed to verify OTP.' };
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const registerForm = document.getElementById("register_form");
    const passwordInput = document.getElementById("register_password");
    const confirmPasswordInput = document.getElementById("confirm_password");
    const signUpBtn = document.querySelector(".primary-btn");

    // Password visibility toggle function
    window.togglePasswordVisibility = function(inputId, btn) {
        const input = document.getElementById(inputId);
        const isPassword = input.type === "password";
        input.type = isPassword ? "text" : "password";
        if (btn) btn.textContent = isPassword ? "Hide" : "Show";
    };

    // Real-time password requirement checking
    function checkPasswordRequirements() {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
        const isLongEnough = password.length >= 8;
        const passwordsMatch = password === confirmPassword && password.length > 0;

        // Update requirement indicators
        document.getElementById("req-uppercase").className = `requirement ${
            hasUpperCase ? "valid" : "invalid"
        }`;
        document.getElementById("req-lowercase").className = `requirement ${
            hasLowerCase ? "valid" : "invalid"
        }`;
        document.getElementById("req-number").className = `requirement ${
            hasNumbers ? "valid" : "invalid"
        }`;
        document.getElementById("req-special").className = `requirement ${
            hasSpecialChar ? "valid" : "invalid"
        }`;
        document.getElementById("req-length").className = `requirement ${
            isLongEnough ? "valid" : "invalid"
        }`;
        document.getElementById("matchReqReg").className = `requirement ${
            passwordsMatch ? "valid" : "invalid"
        }`;

        const allValid = hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough && passwordsMatch;
        signUpBtn.disabled = !allValid;
    }

    // Add input event listeners for real-time password checking
    if (passwordInput) {
        passwordInput.addEventListener("input", checkPasswordRequirements);
    }
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener("input", checkPasswordRequirements);
    }

    // Password validation function (kept for initial form submission validation)
    function validatePassword(password) {
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?\":{}|<>]/.test(password);
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

    // Register form submit event
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
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

            // Send registration data to initiate OTP process
            const registerBtn = document.querySelector(".primary-btn");
            registerBtn.disabled = true;
            registerBtn.textContent = "Sending OTP...";

            try {
                // Use the registerUser function which calls auth/register.php directly
                const result = await registerUser(data);
                if (result.success) {
                    registrationPhoneNumber = data.phone_number;
                    document.getElementById("maskedPhoneForReg").textContent = maskPhoneNumber(registrationPhoneNumber);
                    showRegScreen(2); // Show OTP verification screen
                    startResendTimer("regTimer", "resendRegOtpLink", "resendRegInterval");
                    setupOtpInputs("otp_form");
                    clearOtpInputs("otp_form");
                } else {
                    alert(result.message || "Registration failed. Please try again.");
                }
            } catch (error) {
                console.error("Registration initiation failed:", error);
                alert("An error occurred during registration. Please try again.");
            } finally {
                registerBtn.disabled = false;
                registerBtn.textContent = "Sign Up";
            }
        });
    }

    // OTP form submission for registration
    const otpForm = document.getElementById("otp_form");
    if (otpForm) {
        otpForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const otp = getOtpValue("otp_form");

            if (otp.length !== 6) {
                alert("Please enter the complete 6-digit verification code.");
                return;
            }

            const verifyBtn = document.getElementById("verifyRegOtpBtn");
            verifyBtn.disabled = true;
            verifyBtn.textContent = "Verifying...";

            try {
                const result = await verifyRegistrationOtp(registrationPhoneNumber, otp);
                if (result.success) {
                    alert(result.message || "Registration successful! You can now log in.");
                    window.location.href = "login.html"; // Redirect to login page
                } else {
                    alert(result.message || "Invalid verification code. Please try again.");
                    clearOtpInputs("otp_form");
                }
            } catch (error) {
                console.error("OTP verification failed:", error);
                alert("An error occurred during OTP verification. Please try again.");
            } finally {
                verifyBtn.disabled = false;
                verifyBtn.textContent = "Verify Code";
            }
        });
    }

    // Back to Registration button
    const backToRegFormBtn = document.getElementById("backToRegFormBtn");
    if (backToRegFormBtn) {
        backToRegFormBtn.addEventListener("click", () => {
            clearInterval(resendRegInterval);
            showRegScreen(1);
            clearOtpInputs("otp_form");
            // Re-check password requirements when returning to registration screen
            checkPasswordRequirements();
        });
    }

    // Resend Registration OTP
    const resendRegOtpLink = document.getElementById("resendRegOtpLink");
    if (resendRegOtpLink) {
        resendRegOtpLink.addEventListener("click", async () => {
            if (resendRegOtpLink.classList.contains("disabled")) return;

            resendRegOtpLink.classList.add("disabled");
            startResendTimer("regTimer", "resendRegOtpLink", "resendRegInterval");

            try {
                // Only send phone number for resend OTP
                const result = await fetch(`${API_BASE}auth/register.php`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ phone_number: registrationPhoneNumber, resend: true })
                }).then(response => response.json());

                if (result.success) {
                    alert("New verification code sent!");
                    clearOtpInputs("otp_form");
                } else {
                    alert(result.message || "Failed to resend code. Please try again.");
                }
            } catch (error) {
                alert("An error occurred while resending code. Please try again.");
            }
        });
    }

    // Initialize password requirements check on load
    checkPasswordRequirements();
});
