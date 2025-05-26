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

    // Update form data if moving from screen 2 to 3
    if (screenNumber === 3) {
        updateConfirmationData();
    }

    // Update receipt data if moving to screen 5
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
    if (current.value.length === 1 && index < 5) {
        const otpInputs = document.querySelectorAll(".otp-input");
        otpInputs[index + 1].focus();
    }
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
}

function printReceipt() {
    window.print();
}

function returnToHome() {
    // Navigate to dashboard instead of showScreen(1)
    window.location.href = "dashboard.html";
}

// Add keyboard navigation for OTP inputs
document.addEventListener("DOMContentLoaded", function () {
    const otpInputs = document.querySelectorAll(".otp-input");

    otpInputs.forEach((input, index) => {
        input.addEventListener("keydown", function (e) {
            if (e.key === "Backspace" && !input.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });
});
