const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

// Navigation module for handling screen transitions and navigation
const Navigation = {
    currentScreen: 4,

    showScreen(screenNumber) {
        // Hide all screens
        document.querySelectorAll(".screen").forEach((screen) => {
            screen.classList.remove("active");
        });

        // Show selected screen
        document.getElementById(`screen${screenNumber}`).classList.add("active");
        this.currentScreen = screenNumber;

        // Update receipt data if moving to screen 5
        if (screenNumber === 5) {
            UIHandlers.updateReceiptData();
        }
    },

    goBack() {
        if (this.currentScreen > 4) {
            this.currentScreen = this.currentScreen - 1;

            // Hide all screens
            document.querySelectorAll(".screen").forEach((screen) => {
                screen.classList.remove("active");
            });

            // Show previous screen
            document
                .getElementById(`screen${this.currentScreen}`)
                .classList.add("active");
        }
    },

    returnToHome() {
        window.location.href = "dashboard.html";
    }
};

// Validation module for handling form validations and error handling
const Validation = {
    validateScreen4() {
        const otpInputs = document.querySelectorAll(".otp-input");
        let otpValue = "";

        otpInputs.forEach((input) => {
            otpValue += input.value.trim();
        });

        if (otpValue.length !== 6) {
            otpInputs.forEach((input) => {
                input.classList.remove("error-field");
                if (!input.value.trim()) {
                    input.classList.add("error-field");
                }
            });

            this.showErrorMessage("Please enter the complete 6-digit OTP code");
            return false;
        }

        if (!/^\d{6}$/.test(otpValue)) {
            otpInputs.forEach((input) => {
                if (!/^\d$/.test(input.value)) {
                    input.classList.add("error-field");
                }
            });
            this.showErrorMessage("OTP must contain only numbers");
            return false;
        }

        return true;
    },

    showErrorMessage(message) {
        const existingError = document.getElementById("main-error-message");
        if (existingError) {
            existingError.remove();
        }

        const errorDiv = document.createElement("div");
        errorDiv.id = "main-error-message";
        errorDiv.className = "main-error-message";
        errorDiv.textContent = message;

        const activeCard = document.querySelector(".screen.active .card");
        const firstChild = activeCard.children[1];
        activeCard.insertBefore(errorDiv, firstChild);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 5000);
    }
};

// UI Handlers module for managing UI interactions and updates
const UIHandlers = {
    moveToNext(current, index) {
        current.value = current.value.replace(/[^0-9]/g, "");

        if (current.value.length === 1 && index < 5) {
            const otpInputs = document.querySelectorAll(".otp-input");
            otpInputs[index + 1].focus();
        }

        current.classList.remove("error-field");
    },

    updateReceiptData() {
        const transferDetails = JSON.parse(localStorage.getItem('transferDetails') || '{}');
        const accountNumber = transferDetails.recipient || "123456";
        const amount = transferDetails.amount || "500.00";
        const bankSelect = document.getElementById("bankSelect");
        const selectedBank = bankSelect ? bankSelect.options[bankSelect.selectedIndex].text : "Dragon Vault";

        const now = new Date();
        const dateStr = now.toLocaleDateString("en-US", {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        });
        const timeStr = now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });

        document.getElementById("receiptDate").textContent = dateStr;
        document.getElementById("receiptTime").textContent = timeStr;
        document.getElementById("receiptAccount").textContent = accountNumber;
        document.getElementById("receiptAmount").textContent = `P ${amount}`;

        const receiptBankRow = document.getElementById("receiptBankRow");
        if (transferDetails.type === "bank" && transferDetails.bank) {
            receiptBankRow.classList.add("active");
            document.getElementById("receiptBank").textContent = selectedBank;
        } else {
            receiptBankRow.classList.remove("active");
        }
    },

    printReceipt() {
        window.print();
    }
};

// API Service module for handling API calls and data fetching
const ApiService = {
    verifyOtp() {
        if (!Validation.validateScreen4()) {
            return;
        }

        const otpInputs = document.querySelectorAll(".otp-input");
        const enteredOtp = Array.from(otpInputs)
            .map(input => input.value)
            .join("");

        const transferDetails = JSON.parse(localStorage.getItem('transferDetails') || '{}');
        const sourceAccount = localStorage.getItem('accountNumber');

        // Log the data being sent
        console.log('Sending OTP verification request:', {
            otp: enteredOtp,
            sourceAccount,
            transferDetails
        });

        const submitButton = document.querySelector('#screen4 .btn-primary');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;

        fetch(API_BASE + "transfer/verify-otp.php", {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded" 
            },
            body: `otp=${encodeURIComponent(enteredOtp)}&source_account_no=${encodeURIComponent(sourceAccount)}&recipient_account_no=${encodeURIComponent(transferDetails.recipient)}&transaction_amount=${encodeURIComponent(transferDetails.amount)}`
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('OTP verification response:', data);
            if (data.success) {
                // Store transaction ID for receipt
                if (data.transaction_id) {
                    document.getElementById("receiptTxnId").textContent = data.transaction_id;
                }
                Navigation.showScreen(5);
            } else {
                alert(data.error || "OTP verification failed");
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Network error. Please check your connection and try again.");
        })
        .finally(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        });
    },

    resendOtp() {
        const transferDetails = JSON.parse(localStorage.getItem('transferDetails') || '{}');
        const sourceAccount = localStorage.getItem('accountNumber');

        fetch(API_BASE + "transfer/resend-otp.php", {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded" 
            },
            body: `source_account_no=${encodeURIComponent(sourceAccount)}&recipient_account_no=${encodeURIComponent(transferDetails.recipient)}&transaction_amount=${encodeURIComponent(transferDetails.amount)}`
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert("OTP has been resent to your registered mobile number");
                // Clear OTP inputs
                document.querySelectorAll(".otp-input").forEach(input => {
                    input.value = "";
                });
                document.querySelector(".otp-input").focus();
            } else {
                alert(data.error || "Failed to resend OTP");
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Network error. Please check your connection and try again.");
        });
    }
};

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Set up OTP input handling
    const otpInputs = document.querySelectorAll(".otp-input");
    otpInputs.forEach((input, index) => {
        input.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener("input", function () {
            input.classList.remove("error-field");
        });
    });

    // Set up global event handlers
    window.showScreen = (screenNumber) => Navigation.showScreen(screenNumber);
    window.goBack = () => Navigation.goBack();
    window.returnToHome = () => Navigation.returnToHome();
    window.moveToNext = (current, index) => UIHandlers.moveToNext(current, index);
    window.printReceipt = () => UIHandlers.printReceipt();
    window.verifyOtp = () => ApiService.verifyOtp();
    window.resendOtp = () => ApiService.resendOtp();
}); 