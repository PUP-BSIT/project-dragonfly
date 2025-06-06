// State management
let currentScreen = 1;
let phoneNumber = "";
let resendTimer = 0;
let resendInterval;

const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

// Screen navigation
function showScreen(screenNum) {
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active");
    });
    document.getElementById(`screen${screenNum}`).classList.add("active");
    currentScreen = screenNum;
    updateProgressBar();
}

function updateProgressBar() {
    const progress = (currentScreen / 3) * 100;
    document.getElementById("progressFill").style.width = `${progress}%`;
}

// Phone number validation
function validatePhoneNumber(phone) {
    const phoneRegex = /^(\+63|0)?[9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
}

function maskPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, "");
    return cleaned.replace(/(\d{3})\d{4}(\d{3})/, "$1****$2");
}

// OTP input handling
function setupOtpInputs() {
    const otpInputs = document.querySelectorAll(".otp-input");

    otpInputs.forEach((input, index) => {
        input.addEventListener("input", function (e) {
            if (e.target.value.length === 1) {
                if (index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
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

function getOtpValue() {
    const otpInputs = document.querySelectorAll(".otp-input");
    return Array.from(otpInputs)
        .map((input) => input.value)
        .join("");
}

function clearOtpInputs() {
    document.querySelectorAll(".otp-input").forEach((input) => {
        input.value = "";
    });
    document.querySelector(".otp-input").focus();
}

// Resend timer
function startResendTimer() {
    resendTimer = 60;
    const resendLink = document.getElementById("resendLink");
    const timer = document.getElementById("timer");

    resendLink.classList.add("disabled");

    resendInterval = setInterval(() => {
        timer.textContent = `(${resendTimer}s)`;
        resendTimer--;

        if (resendTimer < 0) {
            clearInterval(resendInterval);
            resendLink.classList.remove("disabled");
            timer.textContent = "";
        }
    }, 1000);
}

// Password validation
function validatePassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
    };
}

function updatePasswordRequirements() {
    const password = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const validation = validatePassword(password);

    // Update requirement indicators
    document.getElementById("lengthReq").className = `requirement ${
        validation.length ? "valid" : "invalid"
    }`;
    document.getElementById("uppercaseReq").className = `requirement ${
        validation.uppercase ? "valid" : "invalid"
    }`;
    document.getElementById("lowercaseReq").className = `requirement ${
        validation.lowercase ? "valid" : "invalid"
    }`;
    document.getElementById("numberReq").className = `requirement ${
        validation.number ? "valid" : "invalid"
    }`;

    const passwordsMatch = password === confirmPassword && password.length > 0;
    document.getElementById("matchReq").className = `requirement ${
        passwordsMatch ? "valid" : "invalid"
    }`;

    // Enable/disable submit button
    const allValid =
        Object.values(validation).every((v) => v) && passwordsMatch;
    document.getElementById("resetPasswordBtn").disabled = !allValid;
}

// API simulation (replace with actual API calls)
async function sendOtp(phone) {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`OTP sent to ${phone}`);
            resolve({ success: true });
        }, 1000);
    });
}

async function verifyOtp(phone, otp) {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            const isValid = otp === "123456"; // Demo OTP
            resolve({ success: isValid });
        }, 1000);
    });
}

async function resetPassword(phone, newPassword) {
    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`Password reset for ${phone}`);
            resolve({ success: true });
        }, 1000);
    });
}

// Event listeners
document.addEventListener("DOMContentLoaded", function () {
    updateProgressBar();
    setupOtpInputs();

    // Phone form submission
    document
        .getElementById("phoneForm")
        .addEventListener("submit", async function (e) {
            e.preventDefault();

            const phone = document.getElementById("phoneNumber").value.trim();

            if (!validatePhoneNumber(phone)) {
                alert("Please enter a valid Philippine phone number.");
                return;
            }

            const sendBtn = document.getElementById("sendOtpBtn");
            sendBtn.disabled = true;
            sendBtn.textContent = "Sending...";

            try {
                const result = await sendOtp(phone);
                if (result.success) {
                    phoneNumber = phone;
                    document.getElementById("maskedPhone").textContent =
                        maskPhoneNumber(phone);
                    showScreen(2);
                    startResendTimer();
                    clearOtpInputs();
                } else {
                    alert("Failed to send OTP. Please try again.");
                }
            } catch (error) {
                alert("An error occurred. Please try again.");
            } finally {
                sendBtn.disabled = false;
                sendBtn.textContent = "Send OTP Code";
            }
        });

    // OTP form submission
    document
        .getElementById("otpForm")
        .addEventListener("submit", async function (e) {
            e.preventDefault();

            const otp = getOtpValue();

            if (otp.length !== 6) {
                alert("Please enter the complete 6-digit verification code.");
                return;
            }

            const verifyBtn = document.getElementById("verifyOtpBtn");
            verifyBtn.disabled = true;
            verifyBtn.textContent = "Verifying...";

            try {
                const result = await verifyOtp(phoneNumber, otp);
                if (result.success) {
                    showScreen(3);
                } else {
                    alert("Invalid verification code. Please try again.");
                    clearOtpInputs();
                }
            } catch (error) {
                alert("An error occurred. Please try again.");
            } finally {
                verifyBtn.disabled = false;
                verifyBtn.textContent = "Verify Code";
            }
        });

    // Password form submission
    document
        .getElementById("passwordForm")
        .addEventListener("submit", async function (e) {
            e.preventDefault();

            const newPassword = document.getElementById("newPassword").value;
            const resetBtn = document.getElementById("resetPasswordBtn");

            resetBtn.disabled = true;
            resetBtn.textContent = "Resetting...";

            try {
                const result = await resetPassword(phoneNumber, newPassword);
                if (result.success) {
                    alert(
                        "Password reset successfully! You can now login with your new password."
                    );
                    window.location.href = "login.html";
                } else {
                    alert("Failed to reset password. Please try again.");
                }
            } catch (error) {
                alert("An error occurred. Please try again.");
            } finally {
                resetBtn.disabled = false;
                resetBtn.textContent = "Reset Password";
            }
        });

    // Back to phone button
    document
        .getElementById("backToPhoneBtn")
        .addEventListener("click", function () {
            clearInterval(resendInterval);
            showScreen(1);
            clearOtpInputs();
        });

    // Resend OTP
    document
        .getElementById("resendLink")
        .addEventListener("click", async function () {
            if (this.classList.contains("disabled")) return;

            try {
                const result = await sendOtp(phoneNumber);
                if (result.success) {
                    startResendTimer();
                    clearOtpInputs();
                    alert("New verification code sent!");
                }
            } catch (error) {
                alert("Failed to resend code. Please try again.");
            }
        });

    // Password validation
    document
        .getElementById("newPassword")
        .addEventListener("input", updatePasswordRequirements);
    document
        .getElementById("confirmPassword")
        .addEventListener("input", updatePasswordRequirements);
});
