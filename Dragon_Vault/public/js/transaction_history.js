const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";
const ITEMS_PER_PAGE = 10;

// Store the current state
let state = {
    outbound: {
        transactions: [],
        currentPage: 1,
        hasMore: true,
        sortOrder: 'DESC', // Default sort order for outbound
        searchTerm: ''
    },
    inbound: {
        transactions: [],
        currentPage: 1,
        hasMore: true,
        sortOrder: 'DESC', // Default sort order for inbound
        searchTerm: ''
    },
    teller: {
        transactions: [],
        currentPage: 1,
        hasMore: true,
        sortOrder: 'DESC', // Default sort order for teller
        searchTerm: ''
    }
};

document.addEventListener("DOMContentLoaded", function () {
    // Initialize tabs
    initializeTabs();
    
    // Load initial data for the active tab (outbound is default active)
    loadTransactions('outbound', state.outbound.sortOrder);

    // Initialize search
    const searchInput = document.getElementById('transaction-search');
    searchInput.addEventListener('input', (event) => {
        const currentTab = document.querySelector('.tab-btn.active').dataset.tab;
        state[currentTab].searchTerm = event.target.value.toLowerCase();
        state[currentTab].currentPage = 1; // Reset to first page on search
        displayTransactions(currentTab); // Re-display with filtered data
    });
});

function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const sortButtons = document.querySelectorAll('.sort-btn');
    const searchInput = document.getElementById('transaction-search');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;
            
            // Update active states for tabs
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            button.classList.add('active');
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            // Set search input value for the active tab
            searchInput.value = state[tabName].searchTerm;

            // Update active states for sort buttons within the new tab
            sortButtons.forEach(sortBtn => {
                if (sortBtn.dataset.type === tabName) {
                    if (sortBtn.dataset.sortOrder === state[tabName].sortOrder) {
                        sortBtn.classList.add('active');
                    } else {
                        sortBtn.classList.remove('active');
                    }
                }
            });

            // Load data for the newly active tab
            // No need to refetch from API if data is already in state, just re-display filtered/sorted
            if (state[tabName].transactions.length === 0) {
                loadTransactions(tabName, state[tabName].sortOrder);
            } else {
                displayTransactions(tabName); // Just re-display if data is already fetched
            }
        });
    });

    // Initialize load more buttons
    document.getElementById('load-more-outbound').addEventListener('click', () => loadMore('outbound'));
    document.getElementById('load-more-inbound').addEventListener('click', () => loadMore('inbound'));
    document.getElementById('load-more-teller').addEventListener('click', () => loadMore('teller'));

    // Initialize sort buttons
    sortButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.type;
            const sortOrder = button.dataset.sortOrder;
            console.log(`Sort button clicked: Tab=${tabName}, Order=${sortOrder}`); // Debugging
            
            // Update sort order in state
            state[tabName].sortOrder = sortOrder;
            state[tabName].currentPage = 1; // Reset to first page on sort change

            // Update active states for sort buttons
            document.querySelectorAll(`.sort-btn[data-type="${tabName}"]`).forEach(btn => {
                btn.classList.remove('active');
            });
            button.classList.add('active');

            loadTransactions(tabName, sortOrder); // Re-fetch data with new sort order
        });
    });
}

function loadTransactions(type, sortOrder) {
    const url = new URL(API_BASE + "account/get_all_transactions.php");
    url.searchParams.append('sort_order', sortOrder);
    console.log("Fetching URL:", url.toString()); // Debugging

    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.log("API Response Data:", data); // Debugging

            if (!data.success) {
                alert("Failed to load transactions: " + data.message);
                return;
            }

            // Process transactions based on type and initial sort
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
            console.log(`Processed ${type} transactions (unsorted):`, transactions); // Debugging

            // Sort transactions based on the current sortOrder for the tab
            transactions.sort((a, b) => {
                const dateA = new Date(a.transaction_timestamp);
                const dateB = new Date(b.transaction_timestamp);
                if (state[type].sortOrder === 'ASC') {
                    return dateA - dateB;
                } else {
                    return dateB - dateA;
                }
            });

            console.log(`Processed ${type} transactions (sorted):`, transactions); // Debugging

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

    // Clear existing rows only if it's the first page or sorting/searching
    if (state[type].currentPage === 1) {
        tableBody.innerHTML = '';
    }

    // Apply search filter before pagination
    const filteredTransactions = state[type].transactions.filter(tx => {
        const searchTerm = state[type].searchTerm;
        if (!searchTerm) return true; // No search term, show all
        
        // Customize search fields based on transaction type
        let searchableFields = [];
        if (type === 'outbound' || type === 'inbound') {
            searchableFields = [
                tx.user_transaction_id,
                tx.transaction_type,
                tx.account_number,
                tx.amount,
                tx.status,
                tx.recipient_account_number,
                tx.recipient_bank_code,
                new Date(tx.transaction_timestamp).toLocaleString()
            ];
        } else if (type === 'teller') {
            searchableFields = [
                tx.teller_transaction_id,
                tx.transaction_type,
                tx.amount,
                `${tx.teller_first_name} ${tx.teller_last_name}`,
                new Date(tx.transaction_timestamp).toLocaleString()
            ];
        }

        return searchableFields.some(field => 
            String(field).toLowerCase().includes(searchTerm)
        );
    });

    // Calculate start and end indices for display from filtered transactions
    const start = (state[type].currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const transactionsToShow = filteredTransactions.slice(start, end);
    console.log(`Displaying ${type} transactions (Page ${state[type].currentPage}, Start: ${start}, End: ${end}):`, transactionsToShow); // Debugging

    // Display transactions
    if (transactionsToShow.length === 0 && state[type].currentPage === 1) {
        tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center;">No transactions found.</td></tr>`;
    } else {
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
    }

    // Update load more button visibility
    if (end >= filteredTransactions.length) {
        loadMoreBtn.style.display = 'none'; // Hide the button
    } else {
        loadMoreBtn.style.display = 'block'; // Show the button
    }
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

// Mobile menu toggle functionality (copied from dashboard.js)
function toggleMobileMenu() {
    const mobileNav = document.getElementById("mobileNav");
    const hamburger = document.querySelector(".hamburger-menu");

    mobileNav.classList.toggle("active");
    hamburger.classList.toggle("active");
}

// Close mobile menu when clicking outside
if (!window._transactionHistoryMobileMenuEventsAdded) {
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
        document.getElementById("mobileNav").addEventListener("click", function (event) {
            event.stopPropagation();
        });
    }
    window._transactionHistoryMobileMenuEventsAdded = true;
}
