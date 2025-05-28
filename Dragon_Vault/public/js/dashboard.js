document.addEventListener("DOMContentLoaded", () => {
    const balanceAmountElem = document.querySelector(".balance-amount");
    const transactionsContentElem = document.querySelector(
        ".transactions-content"
    );
    const welcomeTitleElem = document.querySelector(".welcome-title");

    // Fetch account balance and recent transactions
    fetch("/Dragon_Vault/api/account/balance.php", {
        method: "GET",
        credentials: "include",
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                // Display full name
                welcomeTitleElem.textContent = `Welcome, ${data.full_name}!`;

                // Display total balance
                const formattedBalance = parseFloat(
                    data.total_balance
                ).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                });
                balanceAmountElem.textContent = formattedBalance;

                // Display recent transactions
                if (data.recent_transactions.length === 0) {
                    transactionsContentElem.textContent =
                        "No recent transactions to display";
                } else {
                    // Clear and populate transaction list
                    transactionsContentElem.innerHTML = "";
                    data.recent_transactions.forEach((txn) => {
                        const txnDiv = document.createElement("div");
                        txnDiv.style.marginBottom = "15px";
                        txnDiv.innerHTML = `
              <div><strong>Date:</strong> ${txn.date}</div>
              <div><strong>Description:</strong> ${txn.description}</div>
              <div><strong>Amount:</strong> ₱${parseFloat(txn.amount).toFixed(
                  2
              )}</div>
            `;
                        transactionsContentElem.appendChild(txnDiv);
                    });
                }
            } else {
                alert(
                    "Failed to load account information. Please log in again."
                );
                window.location.href = "/Dragon_Vault/public/landing-page.html";
            }
        })
        .catch((err) => {
            console.error("Error fetching dashboard data:", err);
            transactionsContentElem.textContent =
                "An error occurred while loading transactions.";
        });

    // Logout button functionality
    const logoutBtn = document.querySelector(".nav-buttons button:last-child");
    logoutBtn.addEventListener("click", () => {
        fetch("/Dragon_Vault/api/auth/logout.php", {
            method: "POST",
            credentials: "include",
        })
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    window.location.href =
                        "/Dragon_Vault/public/landing-page.html";
                } else {
                    alert("Logout failed. Try again.");
                }
            })
            .catch((err) => {
                console.error("Logout error:", err);
                alert("An error occurred during logout.");
            });
    });
});

function goToTransfer() {
    window.location.href = "transfer-fund.html";
}

document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", function () {
        document
            .querySelectorAll(".nav-btn")
            .forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
    });
});
