let currentScreen = 1;
let selectedTransferType = "dragonvault";
    
function showScreen(screenNumber) {
    // Hide all screens
    document.querySelectorAll(".screen").forEach((screen) => {
        screen.classList.remove("active");
    });

    // Show selected screen
    document.getElementById(`screen${screenNumber}`).classList.add("active");
    currentScreen = screenNumber;

    // Load balance when showing screen 2
    if (screenNumber === 2) {
        loadAvailableBalance();
    }

    // Update confirmation data when showing screen 3
    if (screenNumber === 3) {
        updateConfirmationData();
    }

    // Update receipt data when showing screen 5
    if (screenNumber === 5) {
        updateReceiptData();
    }
}

function goBack() {
    if (currentScreen > 1) {
        showScreen(currentScreen - 1);
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
}

function updateConfirmationData() {
    const accountNumber = document.getElementById("accountNumber").value || "123456";
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
    const accountNumber = document.getElementById("accountNumber").value || "123456";
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
    if (current.value.length === 1 && index < 5) {
        const otpInputs = document.querySelectorAll(".otp-input");
        otpInputs[index + 1].focus();
    }
}

function cancelTransaction() {
    if (confirm("Are you sure you want to cancel this transaction?")) {
        window.location.href = "dashboard.html";
    }
}

function resetForm() {
    document.getElementById("accountNumber").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("bankSelect").value = "";
    document.querySelectorAll(".otp-input").forEach((input) => (input.value = ""));

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
}

function printReceipt() {
    window.print();
}

function returnToHome() {
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

    // Dummy OTP for testing - in real implementation, this should be validated server-side
    const correctOtp = "123456";

    if (enteredOtp === correctOtp) {
        // Submit the transfer
        submitTransfer();
    } else {
        alert("Invalid OTP. Please try again.");
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

    // Determine which API endpoint to use based on transfer type
    const apiEndpoint = selectedTransferType === "dragonvault" 
        ? "api/transfer/internal.php" 
        : "api/transfer/external.php"; // You'll need to create this for bank transfers

    fetch(apiEndpoint, {
        method: "POST",
        headers: { 
            "Content-Type": "application/x-www-form-urlencoded" 
        },
        body: `recipient_account=${encodeURIComponent(recipient)}&amount=${encodeURIComponent(amount)}`
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            // Transaction successful, show receipt
            showScreen(5);
        } else {
            alert(data.error || "Transfer failed");
            // Reset button
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert(error.error || "Something went wrong. Please try again.");
        // Reset button
        submitButton.textContent = originalText;
        submitButton.disabled = false;
    });
}

function loadAvailableBalance() {
    // Show loading state
    const balanceElement = document.getElementById('availableBalance');
    balanceElement.textContent = 'Loading...';

    fetch('/Dragon_Vault/api/account/balance.php')
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
                if (data.error.includes('Unauthorized')) {
                    alert('Session expired. Please log in again.');
                    window.location.href = 'login.html';
                }
            }
        })
        .catch(error => {
            console.error('Fetch error:', error);
            balanceElement.textContent = '0.00';
            // Don't show alert for network errors in balance loading
        });
}

// Add keyboard navigation for OTP inputs and other event listeners
document.addEventListener("DOMContentLoaded", function () {
    const otpInputs = document.querySelectorAll(".otp-input");

    otpInputs.forEach((input, index) => {
        // Handle backspace navigation
        input.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        // Handle numeric input only
        input.addEventListener("input", function (e) {
            // Only allow digits
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
            
            // Move to next field if current is filled
            if (e.target.value.length === 1 && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        // Handle paste event
        input.addEventListener("paste", function (e) {
            e.preventDefault();
            const pastedData = (e.clipboardData || window.clipboardData).getData('text');
            const digits = pastedData.replace(/[^0-9]/g, '').substring(0, 6);
            
            // Fill OTP inputs with pasted digits
            for (let i = 0; i < digits.length && i < otpInputs.length; i++) {
                otpInputs[i].value = digits[i];
            }
            
            // Focus on the next empty field or the last field
            const nextEmptyIndex = Math.min(digits.length, otpInputs.length - 1);
            otpInputs[nextEmptyIndex].focus();
        });
    });

    // Add form validation for amount field
    const amountInput = document.getElementById("amount");
    if (amountInput) {
        amountInput.addEventListener("input", function(e) {
            // Allow only numbers and decimal point
            let value = e.target.value.replace(/[^0-9.]/g, '');
            
            // Ensure only one decimal point
            const parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            
            // Limit to 2 decimal places
            if (parts[1] && parts[1].length > 2) {
                value = parts[0] + '.' + parts[1].substring(0, 2);
            }
            
            e.target.value = value;
        });
    }

    // Add validation for account number field
    const accountInput = document.getElementById("accountNumber");
    if (accountInput) {
        accountInput.addEventListener("input", function(e) {
            // Remove any non-numeric characters for account number
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
        });
    }
});