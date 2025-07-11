const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

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
            default:
                return true;
        }
    },

    validateScreen2() {
        const accountNumber = document.getElementById("accountNumber").value.trim();
        const amount = document.getElementById("amount").value.trim();
        const bankSelect = document.getElementById("bankSelect");
        const sourceAccount = localStorage.getItem('accountNumber');

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
        } else if (sourceAccount && accountNumber === sourceAccount) {
            this.showFieldError("accountNumber", "You cannot transfer money to your own account");
            isValid = false;
            errorMessage += "• You cannot transfer money to your own account\n";
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
            } else if (numericAmount < TRANSFER_MINIMUM) {
                this.showFieldError("amount", `Minimum transfer amount is PHP ${TRANSFER_MINIMUM.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
                isValid = false;
                errorMessage += `• Minimum transfer amount is PHP ${TRANSFER_MINIMUM.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n`;
            } else if (numericAmount > TRANSFER_LIMIT) {
                this.showFieldError("amount", `Maximum transfer amount is PHP ${TRANSFER_LIMIT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
                isValid = false;
                errorMessage += `• Maximum transfer amount is PHP ${TRANSFER_LIMIT.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}\n`;
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
                    // Store account number in localStorage
                    if (data.account_number) {
                        localStorage.setItem('accountNumber', data.account_number);
                    }
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

    initiateTransfer() {
        const recipient = document.getElementById("accountNumber").value;
        const amount = document.getElementById("amount").value;
        const sourceAccount = localStorage.getItem('accountNumber'); // Get source account from localStorage

        const submitButton = document.querySelector('#screen3 .btn-primary');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;

        // Store transfer details in localStorage for the verify page
        localStorage.setItem('transferDetails', JSON.stringify({
            recipient,
            amount,
            type: Navigation.selectedTransferType,
            bank: document.getElementById("bankSelect").value
        }));

        let apiEndpoint;
        if (Navigation.selectedTransferType === "dragonvault") {
            apiEndpoint = API_BASE + "transfer/fund-transfer.php";
        } else if (Navigation.selectedTransferType === "bank") {
            apiEndpoint = API_BASE + "transfer/fund-transfer-external.php";
        } else {
             // Handle case where no transfer type is selected (should be caught by validation)
            alert("Please select a transfer type.");
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            return;
        }

        fetch(apiEndpoint, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded" 
            },
            body: `transaction_amount=${encodeURIComponent(amount)}&source_account_no=${encodeURIComponent(sourceAccount)}&recipient_account_no=${encodeURIComponent(recipient)}&redirect_url=${encodeURIComponent(window.location.origin + '/Dragon_Vault/public/transfer_verify.html')}&transaction_type=${encodeURIComponent(Navigation.selectedTransferType === 'dragonvault' ? 'Internal transfer' : 'Transfer to other bank')}${Navigation.selectedTransferType === 'bank' ? '&recipient_bank_code=' + encodeURIComponent(document.getElementById("bankSelect").value) : ''}`
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                window.location.href = "transfer_verify.html";
            } else {
                if (data.message === "SMS gateway is currently disabled by the system administrator.") {
                    alert("Transfer failed: " + data.message);
                } else {
                    alert(data.error || data.message || "Transfer initiation failed");
                }
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

let TRANSFER_LIMIT = 500000; // Default, will be updated from backend
let TRANSFER_MINIMUM = 1; // Default, will be updated from backend

function fetchTransferLimits() {
    fetch(API_BASE + "config/limits.php")
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (data.transfer_limit) TRANSFER_LIMIT = parseFloat(data.transfer_limit);
                if (data.transfer_minimum) TRANSFER_MINIMUM = parseFloat(data.transfer_minimum);
            }
        })
        .catch(() => {
            // Use defaults if fetch fails
        });
}

// Initialize the application when the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Load initial balance
    ApiService.loadAvailableBalance();

    // Fetch transfer limits and minimum from backend
    fetchTransferLimits();

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
    window.selectTransferType = (element, type) => UIHandlers.selectTransferType(element, type);
    window.initiateTransfer = () => ApiService.initiateTransfer();
}); 