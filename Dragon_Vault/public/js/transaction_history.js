const API_BASE = "/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", function () {
    fetch(API_BASE + "account/get_all_transactions.php")
        .then(response => response.json())
        .then(data => {
            if (!data.success) {
                alert("Failed to load transactions: " + data.message);
                return;
            }

            const userTable = document.getElementById("user-transaction-body");
            const tellerTable = document.getElementById("teller-transaction-body");

            data.user_transactions.forEach(tx => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${tx.user_transaction_id}</td>
                    <td>${tx.transaction_type}</td>
                    <td>${tx.amount}</td>
                    <td>${tx.status}</td>
                    <td>${tx.recipient_account_number || 'N/A'}</td>
                    <td>${tx.recipient_bank_code || 'N/A'}</td>
                    <td>${tx.transaction_timestamp}</td>
                `;
                userTable.appendChild(row);
            });

            data.teller_transactions.forEach(tx => {
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
