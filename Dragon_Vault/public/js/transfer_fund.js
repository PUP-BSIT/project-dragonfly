let currentScreen = 1;
let selectedTransferType = "dragonvault";

function showScreen(screenNumber) {
    // Validate current screen before proceeding
    if (!validateCurrentScreen()) {
        return; // Don't proceed if validation fails
    }

    // Hide all screens
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active");
    });

    // Show selected screen
    document.getElementById(`screen${screenNumber}`).classList.add("active");
    currentScreen = screenNumber;

    // Update form data if moving from screen 2 to 3
    if (screenNumber === 3) {
        updateConfirmationData();
    }

    // Update receipt data if moving to screen 5
    if (screenNumber === 5) {
        updateReceiptData();
    }
}

function validateCurrentScreen() {
    switch (currentScreen) {
        case 1:
            // Screen 1 validation - transfer type must be selected (already handled by default selection)
            return true;

        case 2:
            // Screen 2 validation - check account number, amount, and bank (if required)
            return validateScreen2();

        case 3:
            // Screen 3 validation - confirmation screen, no input validation needed
            return true;

        case 4:
            // Screen 4 validation - OTP must be complete
            return validateScreen4();

        default:
            return true;
    }
}

function validateScreen2() {
    const accountNumber = document.getElementById("accountNumber").value.trim();
    const amount = document.getElementById("amount").value.trim();
    const bankSelect = document.getElementById("bankSelect");

    let isValid = true;
    let errorMessage = "";

    // Clear previous error styles
    clearFieldErrors();

    // Validate account number
    if (!accountNumber) {
        showFieldError("accountNumber", "Account number is required");
        isValid = false;
        errorMessage += "• Account number is required\n";
    } else if (accountNumber.length < 6) {
        showFieldError(
            "accountNumber",
            "Account number must be at least 6 digits"
        );
        isValid = false;
        errorMessage += "• Account number must be at least 6 digits\n";
    }

    // Validate amount
    if (!amount) {
        showFieldError("amount", "Amount is required");
        isValid = false;
        errorMessage += "• Amount is required\n";
    } else {
        const numericAmount = parseFloat(amount.replace(/[^\d.]/g, ""));
        if (isNaN(numericAmount) || numericAmount <= 0) {
            showFieldError("amount", "Please enter a valid amount");
            isValid = false;
            errorMessage += "• Please enter a valid amount\n";
        } else if (numericAmount < 1) {
            showFieldError("amount", "Minimum transfer amount is PHP 1.00");
            isValid = false;
            errorMessage += "• Minimum transfer amount is PHP 1.00\n";
        } else if (numericAmount > 500000) {
            showFieldError(
                "amount",
                "Maximum transfer amount is PHP 500,000.00"
            );
            isValid = false;
            errorMessage += "• Maximum transfer amount is PHP 500,000.00\n";
        }
    }

    // Validate bank selection (only if bank transfer is selected)
    if (selectedTransferType === "bank" && !bankSelect.value) {
        showFieldError("bankSelect", "Please select a bank");
        isValid = false;
        errorMessage += "• Please select a bank\n";
    }

    // Show error message if validation fails
    if (!isValid) {
        showErrorMessage(errorMessage.trim());
    }

    return isValid;
}

function validateScreen4() {
    const otpInputs = document.querySelectorAll(".otp-input");
    let otpValue = "";

    otpInputs.forEach((input) => {
        otpValue += input.value.trim();
    });

    if (otpValue.length !== 6) {
        // Clear previous error classes
        otpInputs.forEach((input) => {
            input.classList.remove("error-field");
        });

        // Highlight empty OTP fields
        otpInputs.forEach((input) => {
            if (!input.value.trim()) {
                input.classList.add("error-field");
            }
        });

        showErrorMessage("Please enter the complete 6-digit OTP code");
        return false;
    }

    // Validate that all characters are numeric
    if (!/^\d{6}$/.test(otpValue)) {
        otpInputs.forEach((input) => {
            if (!/^\d$/.test(input.value)) {
                input.classList.add("error-field");
            }
        });
        showErrorMessage("OTP must contain only numbers");
        return false;
    }

    return true;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    field.classList.add("error-field");

    // Add error message below the field if it doesn't exist
    let errorDiv = field.parentNode.querySelector(".error-message");
    if (!errorDiv) {
        errorDiv = document.createElement("div");
        errorDiv.className = "error-message";
        field.parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

function clearFieldErrors() {
    // Clear field error classes
    document.querySelectorAll(".form-input, .form-select").forEach((field) => {
        field.classList.remove("error-field");
    });

    // Clear OTP field error classes
    document.querySelectorAll(".otp-input").forEach((field) => {
        field.classList.remove("error-field");
    });

    // Remove error messages
    document.querySelectorAll(".error-message").forEach((errorDiv) => {
        errorDiv.remove();
    });

    // Hide main error message
    const mainErrorDiv = document.getElementById("main-error-message");
    if (mainErrorDiv) {
        mainErrorDiv.remove();
    }
}

function showErrorMessage(message) {
    // Remove existing error message
    const existingError = document.getElementById("main-error-message");
    if (existingError) {
        existingError.remove();
    }

    // Create and show new error message
    const errorDiv = document.createElement("div");
    errorDiv.id = "main-error-message";
    errorDiv.className = "main-error-message";
    errorDiv.textContent = message;

    // Insert error message at the top of the current card
    const activeCard = document.querySelector(".screen.active .card");
    const firstChild = activeCard.children[1]; // After the title
    activeCard.insertBefore(errorDiv, firstChild);

    // Auto-hide error message after 5 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) {
            errorDiv.remove();
        }
    }, 5000);
}

function goBack() {
    if (currentScreen > 1) {
        // Clear errors when going back
        clearFieldErrors();
        currentScreen = currentScreen - 1;

        // Hide all screens
        document.querySelectorAll(".screen").forEach((screen) => {
            screen.classList.remove("active");
        });

        // Show previous screen
        document
            .getElementById(`screen${currentScreen}`)
            .classList.add("active");
    }
}

function selectTransferType(element, type) {
    // Remove selection from all options
    document.querySelectorAll(".radio-option").forEach((option) => {
        option.classList.remove("selected");
        option.querySelector(".radio-circle").classList.remove("selected");
    });

    // Add selection to clicked option
    element.classList.add("selected");
    element.querySelector(".radio-circle").classList.add("selected");
    selectedTransferType = type;

    // Show/hide bank selection based on transfer type
    const bankSelection = document.getElementById("bankSelection");
    if (type === "bank") {
        bankSelection.classList.add("active");
    } else {
        bankSelection.classList.remove("active");
        document.getElementById("bankSelect").value = "";
    }

    // Clear any existing errors
    clearFieldErrors();
}

function updateConfirmationData() {
    const accountNumber =
        document.getElementById("accountNumber").value || "123456";
    const amount = document.getElementById("amount").value || "500.00";
    const bankSelect = document.getElementById("bankSelect");
    const selectedBank = bankSelect.options[bankSelect.selectedIndex].text;

    document.getElementById("confirmAccount").textContent = accountNumber;
    document.getElementById("confirmAmount").textContent = `P ${amount}`;

    // Show bank confirmation if bank transfer is selected
    const bankConfirmation = document.getElementById("bankConfirmation");
    if (selectedTransferType === "bank" && bankSelect.value) {
        bankConfirmation.classList.add("active");
        document.getElementById("confirmBank").textContent = selectedBank;
    } else {
        bankConfirmation.classList.remove("active");
    }
}

function updateReceiptData() {
    const accountNumber =
        document.getElementById("accountNumber").value || "123456";
    const amount = document.getElementById("amount").value || "500.00";
    const bankSelect = document.getElementById("bankSelect");
    const selectedBank = bankSelect.options[bankSelect.selectedIndex].text;

    // Update date and time to current
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

    // Generate random transaction ID
    const txnId = "T" + Math.floor(Math.random() * 100000);
    document.getElementById("receiptTxnId").textContent = txnId;

    // Show bank in receipt if bank transfer is selected
    const receiptBankRow = document.getElementById("receiptBankRow");
    if (selectedTransferType === "bank" && bankSelect.value) {
        receiptBankRow.classList.add("active");
        document.getElementById("receiptBank").textContent = selectedBank;
    } else {
        receiptBankRow.classList.remove("active");
    }
}

function moveToNext(current, index) {
    // Only allow numeric input
    current.value = current.value.replace(/[^0-9]/g, "");

    if (current.value.length === 1 && index < 5) {
        const otpInputs = document.querySelectorAll(".otp-input");
        otpInputs[index + 1].focus();
    }

    // Clear error class when user starts typing
    current.classList.remove("error-field");
}

function cancelTransaction() {
    if (confirm("Are you sure you want to cancel this transaction?")) {
        // Navigate to dashboard instead of showScreen(1)
        window.location.href = "dashboard.html";
    }
}

function resetForm() {
    document.getElementById("accountNumber").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("bankSelect").value = "";
    document
        .querySelectorAll(".otp-input")
        .forEach((input) => (input.value = ""));

    // Reset transfer type selection
    document.querySelectorAll(".radio-option").forEach((option) => {
        option.classList.remove("selected");
        option.querySelector(".radio-circle").classList.remove("selected");
    });

    // Select first option by default
    const firstOption = document.querySelector(".radio-option");
    firstOption.classList.add("selected");
    firstOption.querySelector(".radio-circle").classList.add("selected");
    selectedTransferType = "dragonvault";

    // Hide bank selection
    document.getElementById("bankSelection").classList.remove("active");

    // Clear all errors
    clearFieldErrors();
}

function printReceipt() {
    window.print();
}

function returnToHome() {
    // Navigate to dashboard instead of showScreen(1)
    window.location.href = "dashboard.html";
}

function showOtpScreen() {
    // Validate required fields before showing OTP
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
    
    // If bank transfer, validate bank selection
    if (selectedTransferType === "bank") {
        const bankSelect = document.getElementById("bankSelect");
        if (!bankSelect.value) {
            alert("Please select a bank");
            return;
        }
    }
    
    showScreen(4); // Show the OTP screen
}

function verifyOtp() {
    const otpInputs = document.querySelectorAll(".otp-input");
    const enteredOtp = Array.from(otpInputs)
        .map(input => input.value)
        .join("");

    // Check if all OTP fields are filled
    if (enteredOtp.length !== 6) {
        alert("Please enter the complete 6-digit OTP");
        return;
    }

    // For testing purposes, accept any 6-digit OTP
    // In production, you should validate this against the server
    if (enteredOtp.match(/^\d{6}$/)) {
        // Submit the transfer
        submitTransfer();
    } else {
        alert("Invalid OTP format. Please enter 6 digits.");
        // Clear OTP inputs
        otpInputs.forEach(input => input.value = "");
        otpInputs[0].focus();
    }
}

function submitTransfer() {
    const recipient = document.getElementById("accountNumber").value;
    const amount = document.getElementById("amount").value;

    // Show loading or disable button to prevent double submission
    const submitButton = document.querySelector('#screen4 .btn-primary');
    const originalText = submitButton.textContent;
    submitButton.textContent = 'Processing...';
    submitButton.disabled = true;

    // Determine API endpoint - fix the path to match your file structure
    let apiEndpoint;
    if (selectedTransferType === "dragonvault") {
        apiEndpoint = "Dragon_Vault/api/transfer/internal.php"; // Adjust path as needed
    } else {
        apiEndpoint = "./api/transfer/external.php"; // You'll need to create this
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
        // Check if response is ok first
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text(); // Get as text first to see what we're getting
    })
    .then(text => {
        console.log("Response text:", text); // Debug log
        try {
            const data = JSON.parse(text);
            if (data.success) {
                // Transaction successful, show receipt
                // Update receipt with actual transaction data
                if (data.transaction_id) {
                    document.getElementById("receiptTxnId").textContent = data.transaction_id;
                }
                showScreen(5);
            } else {
                alert(data.error || "Transfer failed");
            }
        } catch (e) {
            console.error("JSON parse error:", e);
            console.error("Response text:", text);
            alert("Server response error. Please try again.");
        }
    })
    .catch(error => {
        console.error("Fetch error:", error);
        alert("Network error. Please check your connection and try again.");
    })
    .finally(() => {
        // Reset button state
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

function loadAvailableBalance() {
    // Show loading state
    const balanceElement = document.getElementById('availableBalance');
    balanceElement.textContent = 'Loading...';

    // Fix the path to match your file structure
    fetch('Dragon_Vault/api/account/balance.php')
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
            // Don't show alert for network errors in balance loading
        });
}

// Add keyboard navigation for OTP inputs and other event listeners
document.addEventListener("DOMContentLoaded", function () {
    const otpInputs = document.querySelectorAll(".otp-input");
    const accountInput = document.getElementById("accountNumber");
    const amountInput = document.getElementById("amount");

    // OTP input handling
    otpInputs.forEach((input, index) => {
        input.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        // Clear error on input
        input.addEventListener("input", function () {
            input.classList.remove("error-field");
        });
    });

    // Account number validation
    if (accountInput) {
        accountInput.addEventListener("input", function () {
            // Remove non-numeric characters
            this.value = this.value.replace(/[^0-9]/g, "");

            // Clear error class
            this.classList.remove("error-field");

            // Remove error message
            const errorDiv = this.parentNode.querySelector(".error-message");
            if (errorDiv) {
                errorDiv.remove();
            }
        });
    }

    // Amount input validation
    if (amountInput) {
        amountInput.addEventListener("input", function () {
            // Allow only numbers and decimal point
            this.value = this.value.replace(/[^0-9.]/g, "");

            // Ensure only one decimal point
            const parts = this.value.split(".");
            if (parts.length > 2) {
                this.value = parts[0] + "." + parts.slice(1).join("");
            }

            // Clear error class
            this.classList.remove("error-field");

            // Remove error message
            const errorDiv = this.parentNode.querySelector(".error-message");
            if (errorDiv) {
                errorDiv.remove();
            }
        });
    }
});
