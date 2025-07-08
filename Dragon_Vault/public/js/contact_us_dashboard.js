const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

// Navigation functions
function goToHome() {
    window.location.href = "dashboard.html";
}
function goToProfile() {
    window.location.href = "profile.html";
}
function goToContactUs() {
    window.location.href = "contact_us_dashboard.html";
}
function logout() {
    fetch(API_BASE + "auth/logout.php", {
        method: "POST",
        credentials: "include",
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                window.location.href = "../../index.html";
            } else {
                alert("Logout failed. Try again.");
            }
        })
        .catch((err) => {
            console.error("Logout error:", err);
            alert("An error occurred during logout.");
        });
}

// Mobile menu toggle functionality
function toggleMobileMenu() {
    const mobileNav = document.getElementById("mobileNav");
    const hamburger = document.querySelector(".hamburger-menu");
    mobileNav.classList.toggle("active");
    hamburger.classList.toggle("active");
}

// Handle navigation button active states
function setActiveNav() {
    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.classList.remove("active");
    });
    document.querySelectorAll(".mobile-nav-btn").forEach((button) => {
        button.classList.remove("active");
    });
    // Set Contact Us as active
    if (document.querySelector('.nav-btn[onclick*="goToContactUs"]')) {
        document.querySelector('.nav-btn[onclick*="goToContactUs"]').classList.add("active");
    }
    if (document.querySelector('.mobile-nav-btn[onclick*="goToContactUs"]')) {
        document.querySelector('.mobile-nav-btn[onclick*="goToContactUs"]').classList.add("active");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    // Close mobile menu when clicking outside
    document.addEventListener("click", function (event) {
        const mobileNav = document.getElementById("mobileNav");
        const hamburger = document.querySelector(".hamburger-menu");
        if (
            mobileNav.classList.contains("active") &&
            !mobileNav.contains(event.target) &&
            !hamburger.contains(event.target)
        ) {
            toggleMobileMenu();
        }
    });
    // Prevent menu close when clicking inside mobile nav
    if (document.getElementById("mobileNav")) {
        document.getElementById("mobileNav").addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }
}); 