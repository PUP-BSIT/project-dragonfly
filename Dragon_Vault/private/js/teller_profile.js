const API_BASE = location.hostname === "localhost"
  ? "http://localhost/Dragon_Vault/api/"
  : "https://dragonvault.site/Dragon_Vault/api/";

let currentUserData = {};

document.addEventListener("DOMContentLoaded", () => {
    loadUserProfile();
    setupEventListeners();
});

// Navigation functions
function goToHome() {
    window.location.href = "/Dragon_Vault/private/teller_dashboard.html";
}

function goToProfile() {
    window.location.href = "/Dragon_Vault/private/teller_profile.html";
}

// Load user profile data
function loadUserProfile() {
    fetch(API_BASE + "teller/profile.php", {
        method: "GET",
        credentials: "include",
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                currentUserData = data.user;
                displayUserProfile(data.user);
            } else {
                console.error("Profile load error:", data.message);
                alert("Failed to load profile. Please log in again.");
                window.location.href = "/Dragon_Vault/private/teller_login.html";
            }
        })
        .catch((err) => {
            console.error("Error fetching profile:", err);
            alert("An error occurred while loading your profile. Please try again.");
        });
}

// Display user profile information
function displayUserProfile(user) {
    const fullName = user.full_name;

    document.getElementById("displayFullName").textContent = fullName;
    document.getElementById("displayEmail").textContent = user.email;
    document.getElementById("displayBranch").textContent = user.branch;
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

    const [first, ...rest] = currentUserData.full_name.split(" ");
    const last = rest.join(" ");

    document.getElementById("editFirstName").value = first;
    document.getElementById("editLastName").value = last;
    document.getElementById("editEmail").value = currentUserData.email;
    document.getElementById("editBranch").value = currentUserData.branch;

    displayCard.style.display = "none";
    editCard.style.display = "block";
}

// Cancel edit mode
function cancelEdit() {
    document.getElementById("profileDisplay").style.display = "block";
    document.getElementById("profileEdit").style.display = "none";

    document.getElementById("editForm").reset();
}

function handleProfileUpdate(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const updateData = {
        first_name: formData.get("firstName"),
        last_name: formData.get("lastName"),
        email: formData.get("email"),
        branch: formData.get("branch"),
    };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(updateData.email)) {
        alert("Please enter a valid email address.");
        return;
    }

    const saveBtn = e.target.querySelector(".save-btn");
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = "Saving...";

    fetch(API_BASE + "teller/update_profile.php", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
    })
        .then((res) => res.json())
        .then((data) => {
            saveBtn.innerHTML = originalText;
            if (data.success) {
                alert("Profile updated successfully!");
                loadUserProfile();
                cancelEdit();
            } else {
                alert("Failed to update profile: " + data.message);
            }
        })
        .catch((err) => {
            console.error("Error updating profile:", err);
            alert("An error occurred while updating profile.");
            saveBtn.innerHTML = originalText;
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

// Handle password change
function handlePasswordChange(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const currentPassword = formData.get("currentPassword");
    const newPassword = formData.get("newPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (newPassword !== confirmPassword) {
        alert("New password and confirmation do not match.");
        return;
    }

    const updateData = {
        currentPassword,
        newPassword,
    };

    const saveBtn = e.target.querySelector(".save-btn");
    const originalText = saveBtn.textContent;
    saveBtn.textContent = "Updating...";
    saveBtn.disabled = true;

    fetch(API_BASE + "teller/change_password.php", {
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
                closePasswordModal();
                showSuccessMessage("Password updated successfully!");
            } else {
                alert(data.message || "Failed to update password.");
            }
        })
        .catch((err) => {
            console.error("Error updating password:", err);
            alert("An error occurred while updating your password.");
        })
        .finally(() => {
            saveBtn.textContent = originalText;
            saveBtn.disabled = false;
        });
}

function logout() {
    fetch(API_BASE + "auth/logout.php", {
        method: "POST",
        credentials: "include"
    })
    .then((res) => res.json())
    .then((data) => {
        if (data.success) {
            window.location.href = "/Dragon_Vault/private/teller_login.html";
        } else {
            alert("Logout failed. Please try again.");
        }
    })
    .catch((err) => {
        console.error("Logout error:", err);
        alert("An error occurred during logout.");
    });
}

// Show success message
function showSuccessMessage(message) {
    alert(message); // You can replace this with a custom toast if desired
}
