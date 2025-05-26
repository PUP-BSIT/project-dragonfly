document.addEventListener('DOMContentLoaded', () => {
  // Navigation links
  const navHome = document.getElementById('nav_home');
  const navMyAccounts = document.getElementById('nav_my_accounts');
  const navTransactionHistory = document.getElementById('nav_transaction_history');
  const navTransferFunds = document.getElementById('nav_transfer_funds');
  const logoutBtn = document.getElementById('logout_btn');

  // Sections
  const homeSection = document.getElementById('home_section');
  const accountInfoSection = document.getElementById('account_info_section');
  const transactionHistorySection = document.getElementById('transaction_history_section');
  const transferSection = document.getElementById('transfer_section');

  // Display elements
  const totalBalanceDisplay = document.getElementById('total_balance');
  const recentTransactionsList = document.getElementById('recent_transactions');
  const accountsList = document.getElementById('accounts_list');

  // Function to show only one section
  function showSection(section) {
    [homeSection, accountInfoSection, transactionHistorySection, transferSection].forEach(sec => {
      sec.style.display = 'none';
    });
    section.style.display = 'block';
  }

  // Show Home section by default
  showSection(homeSection);

  // Navigation handlers
  navHome.addEventListener('click', () => showSection(homeSection));
  navMyAccounts.addEventListener('click', () => showSection(accountInfoSection));
  navTransactionHistory.addEventListener('click', () => showSection(transactionHistorySection));
  navTransferFunds.addEventListener('click', () => showSection(transferSection));

  // Transfer Buttons
  const btnTransferOwn = document.getElementById('btn_transfer_own');
  const btnTransferSameBank = document.getElementById('btn_transfer_same_bank');
  const btnTransferOtherBank = document.getElementById('btn_transfer_other_bank');

  btnTransferOwn.addEventListener('click', () => {
    window.location.href = '/Dragon_Vault/public/fund_transfer_internal.html?type=own';
  });

  btnTransferSameBank.addEventListener('click', () => {
    window.location.href = '/Dragon_Vault/public/fund_transfer_internal.html?type=samebank';
  });

  btnTransferOtherBank.addEventListener('click', () => {
    window.location.href = '/Dragon_Vault/public/fund_transfer_external.html';
  });

  // Fetch Home Section Data
  fetch('/Dragon_Vault/api/account/balance.php', {
    method: 'GET',
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        document.getElementById('user_full_name').textContent = data.full_name;
        totalBalanceDisplay.textContent = `₱${parseFloat(data.total_balance).toFixed(2)}`;
        recentTransactionsList.innerHTML = '';
        data.recent_transactions.forEach(txn => {
          const item = document.createElement('li');
          item.textContent = `${txn.date} - ${txn.description} - ₱${parseFloat(txn.amount).toFixed(2)}`;
          recentTransactionsList.appendChild(item);
        });
      } else {
        alert('Failed to load account data. Please log in again.');
      }
    })
    .catch(err => {
      console.error('Error fetching account data:', err);
      alert('An error occurred. Try again later.');
    });

  // Fetch My Accounts Section Data
  fetch('/Dragon_Vault/api/account/list.php', {
    method: 'GET',
    credentials: 'include'
  })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        accountsList.innerHTML = '';
        data.accounts.forEach(account => {
          const accountItem = document.createElement('div');
          accountItem.classList.add('account-card');
          accountItem.innerHTML = `
            <p><strong>Account Number:</strong> ${account.account_number}</p>
            <p><strong>Type:</strong> ${account.account_type}</p>
            <p><strong>Balance:</strong> ₱${parseFloat(account.balance).toFixed(2)}</p>
          `;
          accountsList.appendChild(accountItem);
        });
      } else {
        accountsList.innerHTML = '<p>No accounts found.</p>';
      }
    })
    .catch(err => {
      console.error('Error fetching account list:', err);
      alert('Could not load account list. Try again.');
    });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    fetch('/Dragon_Vault/api/auth/logout.php', {
      method: 'POST',
      credentials: 'include'
    })
      .then(() => {
        window.location.href = '/Dragon_Vault/public/index.html';
      })
      .catch(err => {
        console.error('Logout error:', err);
        alert('Could not log out. Try again.');
      });
  });
});
