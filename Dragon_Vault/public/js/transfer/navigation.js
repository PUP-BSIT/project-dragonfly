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