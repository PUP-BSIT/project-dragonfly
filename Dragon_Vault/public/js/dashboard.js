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
                        txnDiv.className = "transaction-item";
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
                window.location.href = "/Dragon_Vault/public/landing_page.html";
            }
        })
        .catch((err) => {
            console.error("Error fetching dashboard data:", err);
            transactionsContentElem.textContent =
                "An error occurred while loading transactions.";
        });
});

function goToTransfer() {
    window.location.href = "transfer_fund.html";
}

function goToHome() {
    window.location.href = "dashboard.html";
}

function goToProfile() {
    window.location.href = "profile.html";
}

function logout() {
    fetch("/Dragon_Vault/api/auth/logout.php", {
        method: "POST",
        credentials: "include",
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                window.location.href = "/Dragon_Vault/public/landing_page.html";
            } else {
                alert("Logout failed. Try again.");
            }
        })
        .catch((err) => {
            console.error("Logout error:", err);
            alert("An error occurred during logout.");
        });
}

document.querySelectorAll(".nav-btn").forEach((button) => {
    button.addEventListener("click", function () {
        document
            .querySelectorAll(".nav-btn")
            .forEach((btn) => btn.classList.remove("active"));
        this.classList.add("active");
    });
});

document.addEventListener("DOMContentLoaded", function () {
    fetchRecentTransactions();
});

function fetchRecentTransactions() {
    fetch('/Dragon_Vault/api/account/get_recent_transaction.php')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("transactionsList");
            if (!data.success || data.transactions.length === 0) {
                container.innerHTML = "<p>No recent transactions to display</p>";
                return;
            }

            container.innerHTML = data.transactions.map(tx => `
                <div class="transaction-item">
                    <span class="source">${tx.source.toUpperCase()}</span>
                    <span class="type">${tx.transaction_type}</span>
                    <span class="amount">&#8369;${parseFloat(tx.amount).toFixed(2)}</span>
                    <span class="timestamp">${new Date(tx.transaction_timestamp).toLocaleString()}</span>
                </div>
            `).join('');
        })
        .catch(err => {
            console.error('Failed to fetch transactions:', err);
            document.getElementById("transactionsList").innerHTML = "<p>Error loading transactions</p>";
        });
}
