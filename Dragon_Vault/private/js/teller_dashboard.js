const API_BASE =
    location.hostname === "localhost"
        ? "http://localhost/Dragon_Vault/api/"
        : "https://dragonvault.site/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
    // Initialize mobile navigation
    initializeMobileNavigation();

    // Fetch teller information
    fetch(API_BASE + "auth/get_teller_info.php")
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                document.getElementById("tellerName").textContent =
                    data.full_name;
            } else {
                alert("Unauthorized. Redirecting to login...");
                window.location.href = "teller_login.html";
            }
        })
        .catch((error) => {
            console.error("Error fetching teller info:", error);
            alert("Error loading user information. Please try again.");
        });

    // Handle logout functionality
    document.getElementById("logoutBtn").addEventListener("click", (e) => {
        e.preventDefault();

        if (confirm("Are you sure you want to log out?")) {
            fetch(API_BASE + "auth/logout.php", { method: "POST" })
                .then(() => {
                    window.location.href = "teller_login.html";
                })
                .catch((error) => {
                    console.error("Logout error:", error);
                    // Still redirect even if logout fails
                    window.location.href = "teller_login.html";
                });
        }
    });

    // Clear transaction-related sessionStorage when dashboard loads
    sessionStorage.removeItem("account_number");
    sessionStorage.removeItem("customer_name");
    sessionStorage.removeItem("account_type");
    sessionStorage.removeItem("balance");
    sessionStorage.removeItem("withdraw_amount");
    sessionStorage.removeItem("deposit_amount");
    sessionStorage.removeItem("previous_balance");
    sessionStorage.removeItem("new_balance");
    sessionStorage.removeItem("transaction_id");
    sessionStorage.removeItem("teller_id");
});

/**
 * Initialize mobile navigation functionality
 */
function initializeMobileNavigation() {
    const mobileToggle = document.querySelector(".mobile-menu-toggle");
    const navOptions = document.querySelector(".nav-options");

    if (!mobileToggle || !navOptions) {
        console.warn("Mobile navigation elements not found");
        return;
    }

    // Toggle mobile menu
    mobileToggle.addEventListener("click", function (e) {
        e.stopPropagation();
        navOptions.classList.toggle("active");
        mobileToggle.classList.toggle("active");
    });

    // Close menu when clicking outside
    document.addEventListener("click", function (e) {
        if (
            !mobileToggle.contains(e.target) &&
            !navOptions.contains(e.target)
        ) {
            closeNavigationMenu();
        }
    });

    // Close menu when clicking on navigation links
    navOptions.addEventListener("click", function (e) {
        if (e.target.tagName === "A") {
            closeNavigationMenu();
        }
    });

    // Close menu on escape key
    document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && navOptions.classList.contains("active")) {
            closeNavigationMenu();
        }
    });

    // Handle window resize
    window.addEventListener("resize", function () {
        if (window.innerWidth > 768) {
            closeNavigationMenu();
        }
    });
}

/**
 * Close the mobile navigation menu
 */
function closeNavigationMenu() {
    const navOptions = document.querySelector(".nav-options");
    const mobileToggle = document.querySelector(".mobile-menu-toggle");

    if (navOptions && navOptions.classList.contains("active")) {
        navOptions.classList.remove("active");
        mobileToggle.classList.remove("active");
    }
}

/**
 * Add smooth scroll behavior for better UX
 */
function initializeSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener("click", function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href"));
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        });
    });
}

function showLoadingState(element, originalText) {
    if (element) {
        element.textContent = "Loading...";
        element.disabled = true;
        element.classList.add("loading");
    }
}

function hideLoadingState(element, originalText) {
    if (element) {
        element.textContent = originalText;
        element.disabled = false;
        element.classList.remove("loading");
    }
}

/**
 * Add error handling for network issues
 */
function handleNetworkError(error) {
    console.error("Network error:", error);

    // Check if user is offline
    if (!navigator.onLine) {
        alert(
            "You appear to be offline. Please check your internet connection and try again."
        );
        return;
    }

    // Generic error message
    alert("A network error occurred. Please try again later.");
}

// Add online/offline status indicators
window.addEventListener("online", function () {
    console.log("Connection restored");
});

window.addEventListener("offline", function () {
    console.log("Connection lost");
    alert("You are now offline. Some features may not work properly.");
});
