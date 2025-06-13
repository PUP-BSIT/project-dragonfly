const API_BASE = "https://dragonvault.site/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", function () {
    fetch(API_BASE + "account/get_all_transactions.php")
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert("Failed to load transactions: " + data.message);
                return;
            }

            const userOutboundTable = document.getElementById("user-outbound-transaction-body");
            const userInboundTable = document.getElementById("user-inbound-transaction-body");
            const tellerTable = document.getElementById("teller-transaction-body");

            // Ensure arrays exist before iterating
            const userOutboundTransactions = data.user_outbound_transactions || [];
            const userInboundTransactions = data.user_inbound_transactions || [];
            const tellerTransactions = data.teller_transactions || [];

            userOutboundTransactions.forEach(tx => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${tx.user_transaction_id}</td>
                    <td>${tx.transaction_type}</td>
                    <td>${tx.account_number || 'N/A'}</td>
                    <td>${tx.amount}</td>
                    <td>${tx.status}</td>
                    <td>${tx.recipient_account_number || 'N/A'}</td>
                    <td>${tx.recipient_bank_code || 'N/A'}</td>
                    <td>${tx.transaction_timestamp}</td>
                `;
                userOutboundTable.appendChild(row);
            });

            userInboundTransactions.forEach(tx => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${tx.user_transaction_id}</td>
                    <td>${tx.transaction_type}</td>
                    <td>${tx.recipient_account_number || 'N/A'}</td>
                    <td>${tx.amount}</td>
                    <td>${tx.status}</td>
                    <td>${tx.account_number || 'N/A'}</td>
                    <td>${tx.recipient_bank_code || 'N/A'}</td>
                    <td>${tx.transaction_timestamp}</td>
                `;
                userInboundTable.appendChild(row);
            });

            tellerTransactions.forEach(tx => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${tx.teller_transaction_id}</td>
                    <td>${tx.transaction_type}</td>
                    <td>${tx.amount}</td>
                    <td>${tx.teller_first_name} ${tx.teller_last_name}</td>
                    <td>${tx.transaction_timestamp}</td>
                `;
                tellerTable.appendChild(row);
            });
        })
        .catch(error => {
            console.error("Error fetching transactions:", error);
        });
});
