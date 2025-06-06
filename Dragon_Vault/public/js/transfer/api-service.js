const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

// API Service module for handling API calls and data fetching
const ApiService = {
    loadAvailableBalance() {
        const balanceElement = document.getElementById('availableBalance');
        balanceElement.textContent = 'Loading...';

        fetch(API_BASE + "account/balance.php")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const formattedBalance = parseFloat(data.total_balance || 0).toFixed(2);
                    balanceElement.textContent = formattedBalance;
                } else {
                    console.error('Failed to fetch balance:', data.error);
                    balanceElement.textContent = '0.00';
                    if (data.error && data.error.includes('Unauthorized')) {
                        alert('Session expired. Please log in again.');
                        window.location.href = 'login.html';
                    }
                }
            })
            .catch(error => {
                console.error('Balance fetch error:', error);
                balanceElement.textContent = '0.00';
            });
    },

    submitTransfer() {
        const recipient = document.getElementById("accountNumber").value;
        const amount = document.getElementById("amount").value;

        const submitButton = document.querySelector('#screen4 .btn-primary');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;

        let apiEndpoint;
        if (Navigation.selectedTransferType === "dragonvault") {
            apiEndpoint = API_BASE + "transfer/internal.php";
        } else {
            apiEndpoint = API_BASE + "transfer/external.php";
            alert("External bank transfers are not yet implemented.");
            submitButton.textContent = originalText;
            submitButton.disabled = false;
            return;
        }

        fetch(apiEndpoint, {
            method: "POST",
            headers: { 
                "Content-Type": "application/x-www-form-urlencoded" 
            },
            body: `recipient_account=${encodeURIComponent(recipient)}&amount=${encodeURIComponent(amount)}`
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            console.log("Response text:", text);
            try {
                const data = JSON.parse(text);
                if (data.success) {
                    if (data.transaction_id) {
                        document.getElementById("receiptTxnId").textContent = data.transaction_id;
                    }
                    Navigation.showScreen(5);
                } else {
                    alert(data.error || "Transfer failed");
                }
            } catch (e) {
                console.error("JSON parse error:", e);
                console.error("Response text:", text);
                alert("Server response error. Please try again.");
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert("Network error. Please check your connection and try again.");
        })
        .finally(() => {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        });
    }
}; 