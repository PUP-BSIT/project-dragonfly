// Combined transfer.js file containing all transfer-related functionality

// Constants
const API_BASE = "/Dragon_Vault/api/";

// Navigation module for handling screen transitions and navigation
const Navigation = {
    currentScreen: 1,
    selectedTransferType: "dragonvault",

    showScreen(screenNumber) {
        // Validate current screen before proceeding
        if (!Validation.validateCurrentScreen()) {
            return; // Don't proceed if validation fails
        }

        // Hide all screens
        document.querySelectorAll(".screen").forEach((screen) => {
            screen.classList.remove("active");
        });

        // Show selected screen
        document.getElementById(`screen${screenNumber}`).classList.add("active");
        this.currentScreen = screenNumber;

        // Update form data if moving from screen 2 to 3
        if (screenNumber === 3) {
            UIHandlers.updateConfirmationData();
        }

        // Update receipt data if moving to screen 5
        if (screenNumber === 5) {
            UIHandlers.updateReceiptData();
        }
    },

    goBack() {
        if (this.currentScreen > 1) {
            // Clear errors when going back
            Validation.clearFieldErrors();
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

    cancelTransaction() {
        if (confirm("Are you sure you want to cancel this transaction?")) {
            window.location.href = "dashboard.html";
        }
    },

    returnToHome() {
        window.location.href = "dashboard.html";
    }
};

// Validation module for handling form validations and error handling
const Validation = {
    validateCurrentScreen() {
        switch (Navigation.currentScreen) {
            case 1:
                return true;
            case 2:
                return this.validateScreen2();
            case 3:
                return true;
            case 4:
                return this.validateScreen4();
            default:
                return true;
        }
    },

    validateScreen2() {
        const accountNumber = document.getElementById("accountNumber").value.trim();
        const amount = document.getElementById("amount").value.trim();
        const bankSelect = document.getElementById("bankSelect");

        let isValid = true;
        let errorMessage = "";

        // Clear previous error styles
        this.clearFieldErrors();

        // Validate account number
        if (!accountNumber) {
            this.showFieldError("accountNumber", "Account number is required");
            isValid = false;
            errorMessage += "• Account number is required\n";
        } else if (accountNumber.length < 6) {
            this.showFieldError("accountNumber", "Account number must be at least 6 digits");
            isValid = false;
            errorMessage += "• Account number must be at least 6 digits\n";
        }

        // Validate amount
        if (!amount) {
            this.showFieldError("amount", "Amount is required");
            isValid = false;
            errorMessage += "• Amount is required\n";
        } else {
            const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ""));
            if (isNaN(numericAmount) || numericAmount <= 0) {
                this.showFieldError("amount", "Please enter a valid amount");
                isValid = false;
                errorMessage += "• Please enter a valid amount\n";
            } else if (numericAmount < 1) {
                this.showFieldError("amount", "Minimum transfer amount is PHP 1.00");
                isValid = false;
                errorMessage += "• Minimum transfer amount is PHP 1.00\n";
            } else if (numericAmount > 500000) {
                this.showFieldError("amount", "Maximum transfer amount is PHP 500,000.00");
                isValid = false;
                errorMessage += "• Maximum transfer amount is PHP 500,000.00\n";
            }
        }

        // Validate bank selection (only if bank transfer is selected)
        if (Navigation.selectedTransferType === "bank" && !bankSelect.value) {
            this.showFieldError("bankSelect", "Please select a bank");
            isValid = false;
            errorMessage += "• Please select a bank\n";
        }

        // Show error message if validation fails
        if (!isValid) {
            this.showErrorMessage(errorMessage.trim());
        }

        return isValid;
    },

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

    showFieldError(fieldId, message) {
        const field = document.getElementById(fieldId);
        field.classList.add("error-field");

        let errorDiv = field.parentNode.querySelector(".error-message");
        if (!errorDiv) {
            errorDiv = document.createElement("div");
            errorDiv.className = "error-message";
            field.parentNode.appendChild(errorDiv);
        }
        errorDiv.textContent = message;
    },

    clearFieldErrors() {
        document.querySelectorAll(".form-input, .form-select").forEach((field) => {
            field.classList.remove("error-field");
        });

        document.querySelectorAll(".otp-input").forEach((field) => {
            field.classList.remove("error-field");
        });

        document.querySelectorAll(".error-message").forEach((errorDiv) => {
            errorDiv.remove();
        });

        const mainErrorDiv = document.getElementById("main-error-message");
        if (mainErrorDiv) {
            mainErrorDiv.remove();
        }
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
    selectTransferType(element, type) {
        document.querySelectorAll(".radio-option").forEach((option) => {
            option.classList.remove("selected");
            option.querySelector(".radio-circle").classList.remove("selected");
        });

        element.classList.add("selected");
        element.querySelector(".radio-circle").classList.add("selected");
        Navigation.selectedTransferType = type;

        const bankSelection = document.getElementById("bankSelection");
        if (type === "bank") {
            bankSelection.classList.add("active");
        } else {
            bankSelection.classList.remove("active");
            document.getElementById("bankSelect").value = "";
        }

        Validation.clearFieldErrors();
    },

    updateConfirmationData() {
        const accountNumber = document.getElementById("accountNumber").value || "123456";
        const amount = document.getElementById("amount").value || "500.00";
        const bankSelect = document.getElementById("bankSelect");
        const selectedBank = bankSelect.options[bankSelect.selectedIndex].text;

        document.getElementById("confirmAccount").textContent = accountNumber;
        document.getElementById("confirmAmount").textContent = `P ${amount}`;

        const bankConfirmation = document.getElementById("bankConfirmation");
        if (Navigation.selectedTransferType === "bank" && bankSelect.value) {
            bankConfirmation.classList.add("active");
            document.getElementById("confirmBank").textContent = selectedBank;
        } else {
            bankConfirmation.classList.remove("active");
        }
    },

    updateReceiptData() {
        const accountNumber = document.getElementById("accountNumber").value || "123456";
        const amount = document.getElementById("amount").value || "500.00";
        const bankSelect = document.getElementById("bankSelect");
        const selectedBank = bankSelect.options[bankSelect.selectedIndex].text;

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
        if (Navigation.selectedTransferType === "bank" && bankSelect.value) {
            receiptBankRow.classList.add("active");
            document.getElementById("receiptBank").textContent = selectedBank;
        } else {
            receiptBankRow.classList.remove("active");
        }
    },

    moveToNext(current, index) {
        current.value = current.value.replace(/[^0-9]/g, "");

        if (current.value.length === 1 && index < 5) {
            const otpInputs = document.querySelectorAll(".otp-input");
            otpInputs[index + 1].focus();
        }

        current.classList.remove("error-field");
    },

    printReceipt() {
        window.print();
    },

    showOtpScreen() {
        const accountNumber = document.getElementById("accountNumber").value.trim();
        const amount = document.getElementById("amount").value.trim();
        
        if (!accountNumber) {
            alert("Please enter recipient account number");
            return;
        }
        
        if (!amount || parseFloat(amount) <= 0) {
            alert("Please enter a valid amount");
            return;
        }
        
        if (Navigation.selectedTransferType === "bank") {
            const bankSelect = document.getElementById("bankSelect");
            if (!bankSelect.value) {
                alert("Please select a bank");
                return;
            }
        }
        
        Navigation.showScreen(4);
    },

    verifyOtp() {
        const otpInputs = document.querySelectorAll(".otp-input");
        const enteredOtp = Array.from(otpInputs)
            .map(input => input.value)
            .join("");

        if (enteredOtp.length !== 6) {
            alert("Please enter the complete 6-digit OTP");
            return;
        }

        if (enteredOtp.match(/^\d{6}$/)) {
            ApiService.submitTransfer();
        } else {
            alert("Invalid OTP format. Please enter 6 digits.");
            otpInputs.forEach(input => input.value = "");
            otpInputs[0].focus();
        }
    }
};

// API Service module for handling API calls and data fetching
const ApiService = {
    loadAvailableBalance() {
        const balanceElement = document.getElementById('availableBalance');
        if (!balanceElement) {
            console.warn('Available balance element not found');
            return;
        }
        
        balanceElement.textContent = 'Loading...';

        fetch(API_BASE + "account/balance.php")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const formattedBalance = parseFloat(data.total_balance || 0).toFixed(2);
                    balanceElement.textContent = formattedBalance;
                } else {
                    console.error('Failed to fetch balance:', data.error);
                    balanceElement.textContent = '0.00';
                    if (data.error && data.error.includes('Unauthorized')) {
                        alert('Session expired. Please log in again.');
                        window.location.href = 'login.html';
                    }
                }
            })
            .catch(error => {
                console.error('Balance fetch error:', error);
                balanceElement.textContent = '0.00';
            });
    },

    submitTransfer() {
        const recipient = document.getElementById("accountNumber").value;
        const amount = document.getElementById("amount").value;

        const submitButton = document.querySelector('#screen4 .btn-primary');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;

        let apiEndpoint;
        if (Navigation.selectedTransferType === "dragonvault") {
            apiEndpoint = API_BASE + "transfer/internal.php";
        } else {
            apiEndpoint = API_BASE + "transfer/external.php";
            alert("External bank transfers are not yet implemented.");
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            return;
        }

        fetch(apiEndpoint, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded" 
            },
            body: `recipient_account=${encodeURIComponent(recipient)}&amount=${encodeURIComponent(amount)}`
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Update transaction ID in receipt
                if (data.transaction_id) {
                    document.getElementById("receiptTxnId").textContent = data.transaction_id;
                }
                // Update remaining balance
                if (data.remaining_balance) {
                    document.getElementById("availableBalance").textContent = data.remaining_balance;
                }
                Navigation.showScreen(5);
            } else {
                alert(data.error || "Transfer failed");
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
    }
};

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Load initial balance
    ApiService.loadAvailableBalance();

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

    // Set up account number input handling
    const accountInput = document.getElementById("accountNumber");
    if (accountInput) {
        accountInput.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, "");
            this.classList.remove("error-field");
            const errorDiv = this.parentNode.querySelector(".error-message");
            if (errorDiv) {
                errorDiv.remove();
            }
        });
    }

    // Set up amount input handling
    const amountInput = document.getElementById("amount");
    if (amountInput) {
        amountInput.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9.]/g, "");
            const parts = this.value.split(".");
            if (parts.length > 2) {
                this.value = parts[0] + "." + parts.slice(1).join("");
            }
            this.classList.remove("error-field");
            const errorDiv = this.parentNode.querySelector(".error-message");
            if (errorDiv) {
                errorDiv.remove();
            }
        });
    }

    // Set up global event handlers
    window.showScreen = (screenNumber) => Navigation.showScreen(screenNumber);
    window.goBack = () => Navigation.goBack();
    window.cancelTransaction = () => Navigation.cancelTransaction();
    window.returnToHome = () => Navigation.returnToHome();
    window.selectTransferType = (element, type) => UIHandlers.selectTransferType(element, type);
    window.moveToNext = (current, index) => UIHandlers.moveToNext(current, index);
    window.printReceipt = () => UIHandlers.printReceipt();
    window.showOtpScreen = () => UIHandlers.showOtpScreen();
    window.verifyOtp = () => UIHandlers.verifyOtp();
}); 