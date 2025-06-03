let selectedTransferType = "dragonvault";

// Function to select transfer type
function selectTransferType(element, type) {
    // Remove selected class from all options
    const options = document.querySelectorAll(".radio-option");
    const circles = document.querySelectorAll(".radio-circle");

    options.forEach((option) => option.classList.remove("selected"));
    circles.forEach((circle) => circle.classList.remove("selected"));

    // Add selected class to clicked option
    element.classList.add("selected");
    element.querySelector(".radio-circle").classList.add("selected");

    // Store selected type
    selectedTransferType = type;
}

// Function to continue with selected transfer type
function continueTransfer() {
    if (selectedTransferType === "dragonvault") {
        // Redirect to internal transfer page
        window.location.href = "internal_transfer.html";
    } else if (selectedTransferType === "bank") {
        // Redirect to external transfer page
        window.location.href = "external_transfer.html";
    }
}

// Function to cancel transaction
function cancelTransaction() {
    // You can customize this based on where you want to redirect
    // For now, it will go back or redirect to a home page
    if (window.history.length > 1) {
        window.history.back();
    } else {
        // Redirect to home page or main menu
        window.location.href = "index.html"; // Adjust this path as needed
    }
}
