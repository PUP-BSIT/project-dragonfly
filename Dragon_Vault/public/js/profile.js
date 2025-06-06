const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";
let currentUserData = {};

document.addEventListener("DOMContentLoaded", () => {
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
    const initials = getInitials(user.full_name);
    document.getElementById("avatarInitials").textContent = initials;

    document.getElementById("displayFullName").textContent = user.full_name;
    document.getElementById("displayEmail").textContent = user.email;
    document.getElementById("displayPhone").textContent =
        user.phone || "Not provided";
}

// Get initials from full name
function getInitials(fullName) {
    return fullName
        .split(" ")
        .map((name) => name.charAt(0).toUpperCase())
        .join("")
        .substring(0, 2);
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

    document.getElementById("deleteModal").addEventListener("click", (e) => {
        if (e.target.id === "deleteModal") {
            closeDeleteModal();
        }
    });
}

// Toggle edit mode
function toggleEditMode() {
    const displayCard = document.getElementById("profileDisplay");
    const editCard = document.getElementById("profileEdit");

    document.getElementById("editFullName").value = currentUserData.full_name;
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
        fullName: formData.get("fullName"),
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
                currentUserData = { ...currentUserData, ...updateData };
                displayUserProfile(currentUserData);
                cancelEdit();
                showSuccessMessage("Profile updated successfully!");
            } else {
                alert(data.message || "Failed to update profile. Please try again.");
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

    const uppercaseLi = document.getElementById("profile-req-uppercase");
    const lowercaseLi = document.getElementById("profile-req-lowercase");
    const numberLi = document.getElementById("profile-req-number");
    const specialLi = document.getElementById("profile-req-special");
    const lengthLi = document.getElementById("profile-req-length");

    const uppercaseStatus = uppercaseLi.querySelector('.req-status');
    const lowercaseStatus = lowercaseLi.querySelector('.req-status');
    const numberStatus = numberLi.querySelector('.req-status');
    const specialStatus = specialLi.querySelector('.req-status');
    const lengthStatus = lengthLi.querySelector('.req-status');

    uppercaseStatus.textContent = hasUpperCase ? "Met" : "Not met";
    lowercaseStatus.textContent = hasLowerCase ? "Met" : "Not met";
    numberStatus.textContent = hasNumbers ? "Met" : "Not met";
    specialStatus.textContent = hasSpecialChar ? "Met" : "Not met";
    lengthStatus.textContent = isLongEnough ? "Met" : "Not met";

    uppercaseLi.classList.toggle('met', hasUpperCase);
    uppercaseLi.classList.toggle('not-met', !hasUpperCase);
    lowercaseLi.classList.toggle('met', hasLowerCase);
    lowercaseLi.classList.toggle('not-met', !hasLowerCase);
    numberLi.classList.toggle('met', hasNumbers);
    numberLi.classList.toggle('not-met', !hasNumbers);
    specialLi.classList.toggle('met', hasSpecialChar);
    specialLi.classList.toggle('not-met', !hasSpecialChar);
    lengthLi.classList.toggle('met', isLongEnough);
    lengthLi.classList.toggle('not-met', !isLongEnough);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar && isLongEnough;
}

// Add input event listener for real-time feedback
const newPasswordInput = document.getElementById("newPassword");
if (newPasswordInput) {
    newPasswordInput.addEventListener("input", (e) => {
        checkProfilePasswordRequirements(e.target.value);
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
        alert("Password must contain: uppercase letter, lowercase letter, number, special character, and at least 8 characters.");
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
                alert(data.message || "Failed to change password. Please try again.");
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

// Delete account modal functions
function confirmDeleteAccount() {
    document.getElementById("deleteModal").style.display = "flex";
    document.getElementById("deletePassword").focus();
}

function closeDeleteModal() {
    document.getElementById("deleteModal").style.display = "none";
    document.getElementById("deletePassword").value = "";
}

// Handle account deletion
function deleteAccount() {
    const password = document.getElementById("deletePassword").value;

    if (!password) {
        alert("Please enter your password to confirm account deletion.");
        return;
    }

    const finalConfirm = confirm(
        "This is your final warning. Your account and all data will be permanently deleted. Are you absolutely sure?"
    );

    if (!finalConfirm) return;

    const deleteBtn = document.querySelector(".delete-confirm-btn");
    const originalText = deleteBtn.textContent;
    deleteBtn.textContent = "Deleting...";
    deleteBtn.disabled = true;

    fetch(API_BASE + "account/delete_account.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            password: password,
        }),
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                alert(
                    "Your account has been successfully deleted. You will be redirected to the homepage."
                );
                window.location.href = "../../index.html";
            } else {
                alert(data.message || "Failed to delete account. Please verify your password and try again.");
            }
        })
        .catch((err) => {
            console.error("Error deleting account:", err);
            alert("An error occurred while deleting your account.");
        })
        .finally(() => {
            deleteBtn.textContent = originalText;
            deleteBtn.disabled = false;
        });
}

// Navigation functions
function goToHome() {
    window.location.href = "dashboard.html";
}

function goToProfile() {
    window.location.href = "profile.html";
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
        document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
    });
});
