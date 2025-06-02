let currentScreen = 1;

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

    // Update form data if moving from screen 1 to 2
    if (screenNumber === 2) {
        updateConfirmationData();
    }

    // Update receipt data if moving to screen 3
    if (screenNumber === 3) {
        updateReceiptData();
    }
}

function validateCurrentScreen() {
    switch (currentScreen) {
        case 1:
            // Screen 1 validation - check account number and amount
            return validateScreen1();
        case 2:
            // Screen 2 validation - confirmation screen, no input validation needed
            return true;
        default:
            return true;
    }
}

function validateScreen1() {
    const accountNumber = document.getElementById("accountNumber").value.trim();
    const amount = document.getElementById("amount").value.trim();

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

    // Show error message if validation fails
    if (!isValid) {
        showErrorMessage(errorMessage.trim());
    }

    return isValid;
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

function updateConfirmationData() {
    const accountNumber =
        document.getElementById("accountNumber").value || "123456";
    const amount = document.getElementById("amount").value || "500.00";

    document.getElementById("confirmAccount").textContent = accountNumber;
    document.getElementById("confirmAmount").textContent = `P ${amount}`;
}

function updateReceiptData() {
    const accountNumber =
        document.getElementById("accountNumber").value || "123456";
    const amount = document.getElementById("amount").value || "500.00";

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
}

function cancelTransaction() {
    if (confirm("Are you sure you want to cancel this transaction?")) {
        window.location.href = "dashboard.html";
    }
}

function resetForm() {
    document.getElementById("accountNumber").value = "";
    document.getElementById("amount").value = "";

    // Clear all errors
    clearFieldErrors();
}

function printReceipt() {
    window.print();
}

function returnToHome() {
    window.location.href = "dashboard.html";
}

function submitTransfer() {
    const recipient = document.getElementById("accountNumber").value;
    const amount = document.getElementById("amount").value;

    // Show loading or disable button to prevent double submission
    const submitButton = document.querySelector("#screen2 .btn-primary");
    const originalText = submitButton.textContent;
    submitButton.textContent = "Processing...";
    submitButton.disabled = true;

    // API endpoint for internal transfer
    const apiEndpoint = "Dragon_Vault/api/transfer/internal.php";

    fetch(apiEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `recipient_account=${encodeURIComponent(
            recipient
        )}&amount=${encodeURIComponent(amount)}`,
    })
        .then((response) => {
            // Check if response is ok first
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text(); // Get as text first to see what we're getting
        })
        .then((text) => {
            console.log("Response text:", text); // Debug log
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    // Transaction successful, show receipt
                    // Update receipt with actual transaction data
                    if (data.transaction_id) {
                        document.getElementById("receiptTxnId").textContent =
                            data.transaction_id;
                    }
                    showScreen(3);
                } else {
                    alert(data.error || "Transfer failed");
                }
            } catch (e) {
                console.error("JSON parse error:", e);
                console.error("Response text:", text);
                alert("Server response error. Please try again.");
            }
        })
        .catch((error) => {
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
    const balanceElement = document.getElementById("availableBalance");
    balanceElement.textContent = "Loading...";

    // API endpoint for balance
    fetch("Dragon_Vault/api/account/balance.php")
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.success) {
                const formattedBalance = parseFloat(
                    data.total_balance || 0
                ).toFixed(2);
                balanceElement.textContent = formattedBalance;
            } else {
                console.error("Failed to fetch balance:", data.error);
                balanceElement.textContent = "0.00";
                if (data.error && data.error.includes("Unauthorized")) {
                    alert("Session expired. Please log in again.");
                    window.location.href = "login.html";
                }
            }
        })
        .catch((error) => {
            console.error("Balance fetch error:", error);
            balanceElement.textContent = "0.00";
            // Don't show alert for network errors in balance loading
        });
}

// Add event listeners
document.addEventListener("DOMContentLoaded", function () {
    const accountInput = document.getElementById("accountNumber");
    const amountInput = document.getElementById("amount");

    // Load balance when page loads
    loadAvailableBalance();

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
