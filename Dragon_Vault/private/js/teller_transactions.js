document.addEventListener("DOMContentLoaded", () => {
  fetch("/Dragon_Vault/api/teller/get_teller_profile.php", {
    method: "GET",
    credentials: "include"
  })
    .then(response => response.json())
    .then(data => {
      if (data.transactions) {
        const tbody = document.querySelector("#transactionTable tbody");
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
      } else if (data.error) {
        alert("Error: " + data.error);
      }
    })
    .catch(error => {
      console.error("Fetch error:", error);
      alert("Failed to load transactions.");
    });
});

function goToHome() {
    window.location.href = 'teller_dashboard.html'; 
}