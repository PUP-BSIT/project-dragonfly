const API_BASE = "/Dragon_Vault/api/";

document.addEventListener("DOMContentLoaded", () => {
  fetch(API_BASE + 'transactions/get_teller_transactions.php', {
    method: "GET",
    credentials: "include"
  })
    .then(response => response.json())
    .then(data => {
      if (!data.transactions || !Array.isArray(data.transactions)) {
        alert("No transactions found or invalid response.");
        return;
      }

      const tbody = document.querySelector("#transactionTable tbody");
      if (!tbody) {
        console.error("Could not find <tbody> inside #transactionTable");
        alert("Table body not found in DOM.");
        return;
      }

      if (data.transactions.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="6">No transactions found.</td>`;
        tbody.appendChild(row);
        return;
      }

      data.transactions.forEach(tx => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${tx.teller_transaction_id}</td>
          <td>${tx.account_number}</td>
          <td>${tx.account_holder_id}</td>
          <td>${tx.transaction_type}</td>
          <td>₱${parseFloat(tx.amount).toFixed(2)}</td>
          <td>${new Date(tx.transaction_timestamp).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
      });
      if (!data.transactions || !Array.isArray(data.transactions)) {
        alert("No transactions found or invalid response.");
        return;
      }

      const tbody = document.querySelector("#transactionTable tbody");
      if (!tbody) {
        console.error("Could not find <tbody> inside #transactionTable");
        alert("Table body not found in DOM.");
        return;
      }

      if (data.transactions.length === 0) {
        const row = document.createElement("tr");
        row.innerHTML = `<td colspan="6">No transactions found.</td>`;
        tbody.appendChild(row);
        return;
      }

      data.transactions.forEach(tx => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${tx.teller_transaction_id}</td>
          <td>${tx.account_number}</td>
          <td>${tx.account_holder_id}</td>
          <td>${tx.transaction_type}</td>
          <td>₱${parseFloat(tx.amount).toFixed(2)}</td>
          <td>${new Date(tx.transaction_timestamp).toLocaleString()}</td>
        `;
        tbody.appendChild(row);
      });
    })
    .catch(error => {
      console.error("Fetch error:", error);
      alert("Failed to load transactions.");
    });
});

function goToHome() {
    window.location.href = 'teller_dashboard.html'; 
}