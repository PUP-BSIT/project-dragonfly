document.addEventListener("DOMContentLoaded", () => {
    const API_BASE = location.hostname === "localhost"
        ? "http://localhost/Dragon_Vault/api/manager/"
        : "https://dragonvault.site/Dragon_Vault/api/manager/";

    const managerNameSpan = document.getElementById("manager_name");
    const transferLimitInput = document.getElementById("transfer_limit_input");
    const transferLimitForm = document.getElementById("transfer_limit_form");
    const transferLimitFeedback = document.getElementById("transfer_limit_feedback");
    const logoutBtn = document.getElementById("logout_btn");
    const withdrawalLimitInput = document.getElementById("withdrawal_limit_input");
    const withdrawalLimitForm = document.getElementById("withdrawal_limit_form");
    const withdrawalLimitFeedback = document.getElementById("withdrawal_limit_feedback");
    const smsGatewayToggle = document.getElementById("sms_gateway_toggle");
    const smsGatewayForm = document.getElementById("sms_gateway_form");
    const smsGatewayFeedback = document.getElementById("sms_gateway_feedback");

    // Fetch manager session info and transfer limit
    fetch(API_BASE + "config.php", {
        method: "GET",
        credentials: "include"
    })
        .then(res => res.json())
        .then(data => {
            if (!data.success) {
                window.location.href = "login.html";
                return;
            }
            managerNameSpan.textContent = data.manager_name || "Manager";
            transferLimitInput.value = data.transfer_limit;
            withdrawalLimitInput.value = data.withdrawal_limit;
            smsGatewayToggle.value = String(data.sms_gateway_enabled);
        })
        .catch(() => {
            window.location.href = "login.html";
        });

    // Update transfer limit
    transferLimitForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newLimit = transferLimitInput.value;
        transferLimitFeedback.textContent = "";
        fetch(API_BASE + "config.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ transfer_limit: newLimit })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    transferLimitFeedback.textContent = "Transfer limit updated successfully.";
                    transferLimitFeedback.style.color = "#4caf50";
                } else {
                    transferLimitFeedback.textContent = data.message || data.error || "Failed to update.";
                    transferLimitFeedback.style.color = "#f44336";
                }
            })
            .catch(() => {
                transferLimitFeedback.textContent = "An error occurred.";
                transferLimitFeedback.style.color = "#f44336";
            });
    });

    withdrawalLimitForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newLimit = withdrawalLimitInput.value;
        withdrawalLimitFeedback.textContent = "";
        fetch(API_BASE + "config.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ withdrawal_limit: newLimit })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    withdrawalLimitFeedback.textContent = "Withdrawal limit updated successfully.";
                    withdrawalLimitFeedback.style.color = "#4caf50";
                } else {
                    withdrawalLimitFeedback.textContent = data.message || data.error || "Failed to update.";
                    withdrawalLimitFeedback.style.color = "#f44336";
                }
            })
            .catch(() => {
                withdrawalLimitFeedback.textContent = "An error occurred.";
                withdrawalLimitFeedback.style.color = "#f44336";
            });
    });

    smsGatewayForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newStatus = smsGatewayToggle.value;
        smsGatewayFeedback.textContent = "";
        fetch(API_BASE + "config.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ sms_gateway_enabled: newStatus })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    smsGatewayFeedback.textContent = "SMS gateway status updated successfully.";
                    smsGatewayFeedback.style.color = "#4caf50";
                } else {
                    smsGatewayFeedback.textContent = data.message || data.error || "Failed to update.";
                    smsGatewayFeedback.style.color = "#f44336";
                }
            })
            .catch(() => {
                smsGatewayFeedback.textContent = "An error occurred.";
                smsGatewayFeedback.style.color = "#f44336";
            });
    });

    // Logout
    logoutBtn.addEventListener("click", () => {
        fetch(API_BASE + "logout.php", {
            method: "POST",
            credentials: "include"
        })
            .then(() => {
                window.location.href = "login.html";
            });
    });
}); 