const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";
const ITEMS_PER_PAGE = 10;

// Store the current state
let state = {
    outbound: {
        transactions: [],
        currentPage: 1,
        hasMore: true
    },
    inbound: {
        transactions: [],
        currentPage: 1,
        hasMore: true
    },
    teller: {
        transactions: [],
        currentPage: 1,
        hasMore: true
    }
};

document.addEventListener("DOMContentLoaded", function () {
    // Initialize tabs
    initializeTabs();
    
    // Load initial data
    loadTransactions('outbound');
});

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update active states
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Load data if not already loaded
            if (state[tabName].transactions.length === 0) {
                loadTransactions(tabName);
            }
        });
    });

    // Initialize load more buttons
    document.getElementById('load-more-outbound').addEventListener('click', () => loadMore('outbound'));
    document.getElementById('load-more-inbound').addEventListener('click', () => loadMore('inbound'));
    document.getElementById('load-more-teller').addEventListener('click', () => loadMore('teller'));
}

function loadTransactions(type) {
    fetch(API_BASE + "account/get_all_transactions.php")
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert("Failed to load transactions: " + data.message);
                return;
            }

            // Process transactions based on type
            let transactions = [];
            switch(type) {
                case 'outbound':
                    transactions = data.user_outbound_transactions || [];
                    break;
                case 'inbound':
                    transactions = data.user_inbound_transactions || [];
                    break;
                case 'teller':
                    transactions = data.teller_transactions || [];
                    break;
            }

            // Store all transactions and display first page
            state[type].transactions = transactions;
            state[type].hasMore = transactions.length > ITEMS_PER_PAGE;
            displayTransactions(type);
        })
        .catch(error => {
            console.error("Error fetching transactions:", error);
            alert("Failed to load transactions. Please try again.");
        });
}

function loadMore(type) {
    state[type].currentPage++;
    displayTransactions(type);
}

function displayTransactions(type) {
    let tableBodyId;
    switch(type) {
        case 'outbound':
            tableBodyId = 'user-outbound-transaction-body';
            break;
        case 'inbound':
            tableBodyId = 'user-inbound-transaction-body';
            break;
        case 'teller':
            tableBodyId = 'teller-transaction-body';
            break;
        default:
            console.error("Invalid transaction type:", type);
            return;
    }
    const tableBody = document.getElementById(tableBodyId);
    const loadMoreBtn = document.getElementById(`load-more-${type}`);
    
    if (!tableBody) {
        console.error(`Table body element not found for type: ${type} (ID: ${tableBodyId})`);
        return;
    }

    // Clear existing rows
    if (state[type].currentPage === 1) {
        tableBody.innerHTML = '';
    }

    // Calculate start and end indices
    const start = 0;
    const end = state[type].currentPage * ITEMS_PER_PAGE;
    const transactionsToShow = state[type].transactions.slice(start, end);

    // Display transactions
    transactionsToShow.forEach(tx => {
        const row = document.createElement("tr");
        
        switch(type) {
            case 'outbound':
                row.innerHTML = `
                    <td>${tx.user_transaction_id}</td>
                    <td>${tx.transaction_type}</td>
                    <td>${tx.account_number || 'N/A'}</td>
                    <td>&#8369;${parseFloat(tx.amount).toFixed(2)}</td>
                    <td>${tx.status}</td>
                    <td>${tx.recipient_account_number || 'N/A'}</td>
                    <td>${tx.recipient_bank_code || 'N/A'}</td>
                    <td>${new Date(tx.transaction_timestamp).toLocaleString()}</td>
                `;
                break;
            case 'inbound':
                row.innerHTML = `
                    <td>${tx.user_transaction_id}</td>
                    <td>${tx.transaction_type}</td>
                    <td>${tx.recipient_account_number || 'N/A'}</td>
                    <td>&#8369;${parseFloat(tx.amount).toFixed(2)}</td>
                    <td>${tx.status}</td>
                    <td>${tx.account_number || 'N/A'}</td>
                    <td>${tx.recipient_bank_code || 'N/A'}</td>
                    <td>${new Date(tx.transaction_timestamp).toLocaleString()}</td>
                `;
                break;
            case 'teller':
                row.innerHTML = `
                    <td>${tx.teller_transaction_id}</td>
                    <td>${tx.transaction_type}</td>
                    <td>&#8369;${parseFloat(tx.amount).toFixed(2)}</td>
                    <td>${tx.teller_first_name} ${tx.teller_last_name}</td>
                    <td>${new Date(tx.transaction_timestamp).toLocaleString()}</td>
                `;
                break;
        }
        
        tableBody.appendChild(row);
    });

    // Update load more button state
    loadMoreBtn.disabled = !state[type].hasMore || end >= state[type].transactions.length;
}

// Navigation functions
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
