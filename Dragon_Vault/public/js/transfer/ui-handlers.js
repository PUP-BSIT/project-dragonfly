const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

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

        const txnId = "T" + Math.floor(Math.random() * 100000);
        document.getElementById("receiptTxnId").textContent = txnId;

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