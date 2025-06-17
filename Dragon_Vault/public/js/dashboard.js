const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

// SSE connection for monitoring expired transactions
let eventSource = null;

function initializeSSE() {
    if (eventSource) {
        eventSource.close();
    }

    eventSource = new EventSource(API_BASE + "events/stream-transactions.php");

    // Handle specific events
    eventSource.addEventListener('transaction_expired', function(event) {
        const data = JSON.parse(event.data);
        console.log(data.message);
        if (data.expired_transactions > 0) {
            fetchRecentTransactions();
        }
    });

    eventSource.addEventListener('error', function(event) {
        const data = JSON.parse(event.data);
        console.warn("SSE Error:", data.error);
    });

    eventSource.addEventListener('heartbeat', function(event) {
        // Just keep the connection alive
        console.debug("SSE Heartbeat:", new Date().toISOString());
    });

    eventSource.onerror = function(error) {
        console.error("SSE Connection Error:", error);
        // Attempt to reconnect after 5 seconds
        setTimeout(initializeSSE, 5000);
    };
}

// Format account number (show last 4 digits, rest as asterisks)
function formatAccountNumber(accountNumber) {
    if (!accountNumber) {
        return "Account: ****-****-**";
    }
    
    const accountStr = accountNumber.toString();
    
    // For 10-digit account numbers: show last 4 digits, mask the rest
    if (accountStr.length === 10) {
        const lastFour = accountStr.substring(6, 10); // Get last 4 digits
        return `Account: ****-**-${lastFour}`;
    } else {
        // Fallback for any unexpected account number lengths
        const lastFour = accountStr.slice(-4); // Get last 4 digits regardless of length
        return `Account: ****-**-${lastFour}`;
    }
}

// Format full account number for display
function formatFullAccountNumber(accountNumber) {
    if (!accountNumber) {
        return "Account: ****-****-**";
    }
    
    const accountStr = accountNumber.toString();
    
    // For 10-digit account numbers: format as XXXX-XX-XXXX
    if (accountStr.length === 10) {
        return `Account: ${accountStr.substring(0, 4)}-${accountStr.substring(4, 6)}-${accountStr.substring(6, 10)}`;
    } else {
        // Fallback for any unexpected account number lengths
        return `Account: ${accountStr}`;
    }
}

// Toggle account number visibility
function toggleAccountNumberVisibility() {
    const toggleIcon = document.getElementById('toggleVisibilityIcon');
    const accountNumberElem = document.querySelector(".account-number");
    
    if (isAccountNumberVisible) {
        // Hide the account number
        accountNumberElem.textContent = formatAccountNumber(fullAccountNumber);
        toggleIcon.src = '../assets/hide.png';
        toggleIcon.alt = 'Show account number';
        isAccountNumberVisible = false;
    } else {
        // Show the full account number
        accountNumberElem.textContent = formatFullAccountNumber(fullAccountNumber);
        toggleIcon.src = '../assets/unhide.png';
        toggleIcon.alt = 'Hide account number';
        isAccountNumberVisible = true;
    }
}

// Fetch and display recent transactions
function fetchRecentTransactions() {
    fetch('/Dragon_Vault/api/account/get_recent_transaction.php')
        .then(res => res.json())
        .then(data => {
            const container = document.getElementById("transactionsList");
            if (!data.success || data.transactions.length === 0) {
                container.innerHTML = "<p>No recent transactions to display</p>";
                return;
            }

            container.innerHTML = data.transactions.map(tx => {
                let transactionTypeDisplay = tx.transaction_type;
                let sourceDisplay = tx.source.toUpperCase(); // Default to original source

                if (tx.source === 'user' || tx.source === 'user_inbound') {
                    sourceDisplay = 'USER';
                    if (tx.source === 'user') {
                        transactionTypeDisplay = 'Sent Transfer';
                    }
                } else if (tx.source === 'teller') {
                    sourceDisplay = 'TELLER';
                }

                return `
                <div class="transaction-item">
                    <span class="source-label">${sourceDisplay}</span>
                    <span class="type">${transactionTypeDisplay}</span>
                    <span class="amount">&#8369;${parseFloat(tx.amount).toFixed(2)}</span>
                    <span class="timestamp">${new Date(tx.transaction_timestamp).toLocaleString()}</span>
                </div>
            `;
            }).join('');
        })
        .catch(err => {
            console.error('Failed to fetch transactions:', err);
            document.getElementById("transactionsList").innerHTML = "<p>Error loading transactions</p>";
        });
}

// Navigation functions
function goToTransfer() {
    window.location.href = "transfer_initiate.html";
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

// Global variables
let fullAccountNumber = '';
let isAccountNumberVisible = false;

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
    const balanceAmountElem = document.querySelector(".balance-amount");
    const transactionsContentElem = document.querySelector(".transactions-content");
    const welcomeTitleElem = document.querySelector(".welcome-title");
    const accountNumberElem = document.querySelector(".account-number");

    // Initialize SSE connection
    initializeSSE();

    // Fetch account balance and recent transactions
    fetch("/Dragon_Vault/api/account/balance.php", {
        method: "GET",
        credentials: "include",
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                welcomeTitleElem.textContent = `Welcome, ${data.full_name}!`;

                if (data.account_number) {
                    fullAccountNumber = data.account_number;
                    accountNumberElem.textContent = formatAccountNumber(data.account_number);
                }

                const formattedBalance = parseFloat(data.total_balance).toLocaleString("en-PH", {
                    style: "currency",
                    currency: "PHP",
                });
                balanceAmountElem.textContent = formattedBalance;

                if (data.recent_transactions.length === 0) {
                    transactionsContentElem.textContent = "No recent transactions to display";
                } else {
                    transactionsContentElem.innerHTML = "";
                    data.recent_transactions.forEach((txn) => {
                        const txnDiv = document.createElement("div");
                        txnDiv.className = "transaction-item";
                        txnDiv.innerHTML = `
                            <div><strong>Date:</strong> ${txn.date}</div>
                            <div><strong>Description:</strong> ${txn.description}</div>
                            <div><strong>Amount:</strong> ₱${parseFloat(txn.amount).toFixed(2)}</div>
                        `;
                        transactionsContentElem.appendChild(txnDiv);
                    });
                }
            } else {
                alert("Failed to load account information. Please log in again.");
                window.location.href = "../../index.html";
            }
        })
        .catch((err) => {
            console.error("Error fetching dashboard data:", err);
            transactionsContentElem.textContent = "An error occurred while loading transactions.";
        });

    // Set up navigation button click handlers
    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.addEventListener("click", function () {
            document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Initial fetch of recent transactions
    fetchRecentTransactions();
});

// Clean up SSE connection when leaving the page
window.addEventListener('beforeunload', () => {
    if (eventSource) {
        eventSource.close();
    }
});
