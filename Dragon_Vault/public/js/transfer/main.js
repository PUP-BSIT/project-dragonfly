// Main module for initializing the application and setting up event listeners
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