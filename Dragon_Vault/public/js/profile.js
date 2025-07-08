const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

// Fetch user session info from login.php
function fetchUserSession() {
    return fetch(API_BASE + "auth/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ check_session: true })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success && data.already_logged_in) {
                return data;
            } else {
                window.location.href = "../../index.html";
                return null;
            }
        })
        .catch(() => {
            window.location.href = "../../index.html";
            return null;
        });
}

// On DOMContentLoaded, check session and fetch profile
window.addEventListener("DOMContentLoaded", async () => {
    await fetchUserSession(); // still check session, but don't set displayUsername
    loadUserProfile();
    setupEventListeners();
});

// Load user profile data
function loadUserProfile() {
    fetch(API_BASE + "account/profile.php", {
        method: "GET",
        credentials: "include",
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                currentUserData = data.user;
                displayUserProfile(data.user);
            } else {
                alert("Failed to load profile. Please log in again.");
                window.location.href = "../../index.html";
            }
        })
        .catch((err) => {
            console.error("Error fetching profile:", err);
            alert("An error occurred while loading your profile.");
        });
}

// Display user profile information
function displayUserProfile(user) {
    document.getElementById("displayFullName").textContent = user.full_name;
    document.getElementById("displayEmail").textContent = user.email;
    document.getElementById("displayPhone").textContent =
        user.phone || "Not provided";
}

// Setup event listeners
function setupEventListeners() {
    document
        .getElementById("editForm")
        .addEventListener("submit", handleProfileUpdate);

    document
        .getElementById("passwordForm")
        .addEventListener("submit", handlePasswordChange);

    document.getElementById("passwordModal").addEventListener("click", (e) => {
        if (e.target.id === "passwordModal") {
            closePasswordModal();
        }
    });
}

// Toggle edit mode
function toggleEditMode() {
    const displayCard = document.getElementById("profileDisplay");
    const editCard = document.getElementById("profileEdit");

    // Parse the full name to populate separate fields
    const nameParts = currentUserData.full_name.split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts[nameParts.length - 1] || "";
    const middleInitial = nameParts.length > 2 ? nameParts[1] : "";

    document.getElementById("editFirstName").value = firstName;
    document.getElementById("editMiddleInitial").value = middleInitial;
    document.getElementById("editLastName").value = lastName;
    document.getElementById("editEmail").value = currentUserData.email;
    document.getElementById("editPhone").value = currentUserData.phone || "";

    displayCard.style.display = "none";
    editCard.style.display = "block";
}

// Cancel edit mode
function cancelEdit() {
    document.getElementById("profileDisplay").style.display = "block";
    document.getElementById("profileEdit").style.display = "none";

    document.getElementById("editForm").reset();
}

// Handle profile update
function handleProfileUpdate(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const updateData = {
        firstName: formData.get("firstName"),
        middleInitial: formData.get("middleInitial"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        phone: formData.get("phone"),
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updateData.email)) {
        alert("Please enter a valid email address.");
        return;
    }

    const saveBtn = e.target.querySelector(".save-btn");
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="btn-icon">⏳</span> Saving...';
    saveBtn.disabled = true;

    fetch(API_BASE + "account/update_profile.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                // Update currentUserData with new values
                currentUserData.first_name = updateData.firstName;
                currentUserData.middle_initial = updateData.middleInitial;
                currentUserData.last_name = updateData.lastName;
                currentUserData.full_name = `${updateData.firstName} ${
                    updateData.middleInitial
                        ? updateData.middleInitial + " "
                        : ""
                }${updateData.lastName}`.trim();
                currentUserData.email = updateData.email;
                currentUserData.phone = updateData.phone;

                displayUserProfile(currentUserData);
                cancelEdit();
                showSuccessMessage("Profile updated successfully!");
            } else {
                alert(
                    data.message ||
                        "Failed to update profile. Please try again."
                );
            }
        })
        .catch((err) => {
            console.error("Error updating profile:", err);
            alert("An error occurred while updating your profile.");
        })
        .finally(() => {
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        });
}

// Password modal functions
function changePassword() {
    document.getElementById("passwordModal").style.display = "flex";
    document.getElementById("currentPassword").focus();
}

function closePasswordModal() {
    document.getElementById("passwordModal").style.display = "none";
    document.getElementById("passwordForm").reset();
}

// Password requirement check for profile change password
function checkProfilePasswordRequirements(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    const reqs = [
        { id: "profile-req-uppercase", met: hasUpperCase },
        { id: "profile-req-lowercase", met: hasLowerCase },
        { id: "profile-req-number", met: hasNumbers },
        { id: "profile-req-special", met: hasSpecialChar },
        { id: "profile-req-length", met: isLongEnough }
    ];
    let unmetCount = 0;
    reqs.forEach(r => {
        const el = document.getElementById(r.id);
        if (el) {
            if (r.met) {
                el.style.display = 'none';
                el.classList.remove('requirement-not-met');
            } else {
                el.style.display = 'flex';
                el.classList.add('requirement-not-met');
                unmetCount++;
            }
        }
    });

    // Show/hide requirements box
    const reqBox = document.querySelector('.password-requirements');
    if (password.length >= 8 && unmetCount > 0) {
        reqBox.style.display = 'block';
    } else {
        reqBox.style.display = 'none';
    }

    return (
        hasUpperCase &&
        hasLowerCase &&
        hasNumbers &&
        hasSpecialChar &&
        isLongEnough
    );
}

// Add input event listener for real-time feedback
const newPasswordInput = document.getElementById("newPassword");
if (newPasswordInput) {
    newPasswordInput.addEventListener("input", (e) => {
        checkProfilePasswordRequirements(e.target.value);
    });
    // Hide all requirements individually on load
    ["profile-req-uppercase","profile-req-lowercase","profile-req-number","profile-req-special","profile-req-length"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'flex';
    });
}

// Handle password change
function handlePasswordChange(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (newPassword !== confirmPassword) {
        alert("New passwords do not match.");
        return;
    }

    // Strong password validation
    if (!checkProfilePasswordRequirements(newPassword)) {
        alert(
            "Password must contain: uppercase letter, lowercase letter, number, special character, and at least 8 characters."
        );
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = "Updating...";
    submitBtn.disabled = true;

    fetch(API_BASE + "account/change_password.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            currentPassword: currentPassword,
            newPassword: newPassword,
        }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                closePasswordModal();
                showSuccessMessage("Password changed successfully!");
            } else {
                alert(
                    data.message ||
                        "Failed to change password. Please try again."
                );
            }
        })
        .catch((err) => {
            console.error("Error changing password:", err);
            alert("An error occurred while changing your password.");
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
}

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

// Utility function to show success messages
function showSuccessMessage(message) {
    const notification = document.createElement("div");
    notification.classList.add("success-notification");
    notification.textContent = message;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
        notification.classList.add("visible");
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove("visible");
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Handle navigation button active states
document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", function () {
        document
            .querySelectorAll(".nav-btn")
            .forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
    });
});
document.querySelectorAll(".mobile-nav-btn").forEach((button) => {
    button.addEventListener("click", function () {
        document
            .querySelectorAll(".mobile-nav-btn")
            .forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
    });
});

// Mobile menu toggle functionality (copied from dashboard.js)
function toggleMobileMenu() {
    const mobileNav = document.getElementById("mobileNav");
    const hamburger = document.querySelector(".hamburger-menu");

    mobileNav.classList.toggle("active");
    hamburger.classList.toggle("active");
}

// Close mobile menu when clicking outside
if (!window._profileMobileMenuEventsAdded) {
    document.addEventListener("click", function (event) {
        const mobileNav = document.getElementById("mobileNav");
        const hamburger = document.querySelector(".hamburger-menu");

        if (
            mobileNav &&
            mobileNav.classList.contains("active") &&
            !mobileNav.contains(event.target) &&
            !hamburger.contains(event.target)
        ) {
            toggleMobileMenu();
        }
    });

    // Prevent menu close when clicking inside mobile nav
    if (document.getElementById("mobileNav")) {
        document
            .getElementById("mobileNav")
            .addEventListener("click", function (event) {
                event.stopPropagation();
            });
    }
    window._profileMobileMenuEventsAdded = true;
}