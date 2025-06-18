const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

// SSE connection for monitoring expired transactions
let eventSource = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

function initializeSSE() {
    if (eventSource) {
        eventSource.close();
    }

    eventSource = new EventSource(API_BASE + "events/stream-transactions.php");

    // Handle connection established
    eventSource.addEventListener('connected', function(event) {
        console.log('SSE Connected:', event.data);
        reconnectAttempts = 0; // Reset reconnect attempts on successful connection
    });

    // Handle specific events
    eventSource.addEventListener('transaction_expired', function(event) {
        const data = JSON.parse(event.data);
        console.log(data.message);
        if (data.expired_transactions > 0) {
            fetchRecentTransactions();
        }
    });

    eventSource.addEventListener('error', function(event) {
        console.warn("SSE Error:", event);
        
        // Check if we should attempt to reconnect
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            console.log(`Attempting to reconnect (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
            setTimeout(initializeSSE, 5000);
        } else {
            console.error("Max reconnection attempts reached. Please refresh the page.");
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
        }
    });

    eventSource.addEventListener('heartbeat', function(event) {
        // Just keep the connection alive
        console.debug("SSE Heartbeat:", new Date().toISOString());
    });
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
    console.log('Fetching recent transactions...');
    fetch('/Dragon_Vault/api/account/get_recent_transaction.php', {
        method: 'GET',
        credentials: 'include', // Important for session cookies
        headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
        }
    })
    .then(res => {
        console.log('Response status:', res.status);
        if (!res.ok) {
            if (res.status === 401) {
                console.error('Session expired or not logged in');
                handleError("Session expired. Please log in again.");
                return;
            }
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
    })
    .then(data => {
        console.log('Received data:', data);
        const container = document.querySelector(".transactions-content");
        if (!data.success) {
            console.error('API returned error:', data.message);
            if (data.message === 'Not logged in') {
                handleError("Session expired. Please log in again.");
                return;
            }
            container.innerHTML = `<p>Error: ${data.message || 'Failed to load transactions'}</p>`;
            return;
        }
        if (data.transactions.length === 0) {
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
        document.querySelector(".transactions-content").innerHTML = 
            `<p>Error loading transactions: ${err.message}</p>`;
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
    // Close SSE connection first
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }

    fetch("/Dragon_Vault/api/auth/logout.php", {
        method: "POST",
        credentials: "include"
    })
        .then((res) => res.json())
        .then((data) => {
            if (data.success) {
                // Clear any local storage or session storage if needed
                localStorage.clear();
                sessionStorage.clear();
                // Redirect to login page
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

    // Set up navigation button click handlers
    document.querySelectorAll(".nav-btn").forEach((button) => {
        button.addEventListener("click", function () {
            document.querySelectorAll(".nav-btn").forEach((btn) => btn.classList.remove("active"));
            this.classList.add("active");
        });
    });

    // Fetch account data and transactions
    fetchRecentTransactions();
    fetchAccountData();

    // Initialize SSE connection
    initializeSSE();
});

// Function to fetch account data
function fetchAccountData() {
    console.log('Fetching account data...');
    fetch("/Dragon_Vault/api/account/balance.php", {
        method: "GET",
        credentials: "include"
    })
        .then((res) => {
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.json();
        })
        .then((data) => {
            if (data.success) {
                updateDashboard(data);
                // Fetch transactions after account data is loaded
            } else {
                handleError("Failed to load account information");
            }
        })
        .catch((err) => {
            console.error("Error fetching dashboard data:", err);
            handleError("An error occurred while loading data");
        });
}

// Function to update dashboard with account data
function updateDashboard(data) {
    const welcomeTitleElem = document.querySelector(".welcome-title");
    const balanceAmountElem = document.querySelector(".balance-amount");
    const accountNumberElem = document.querySelector(".account-number");

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
}

// Function to handle errors
function handleError(message) {
    alert(message + ". Please log in again.");
    window.location.href = "../../index.html";
}

// Clean up SSE connection when leaving the page
window.addEventListener('beforeunload', () => {
    if (eventSource) {
        eventSource.close();
        eventSource = null;
    }
});
