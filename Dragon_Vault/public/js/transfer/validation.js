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