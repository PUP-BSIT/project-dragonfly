console.log('session_redirect.js loaded');

document.addEventListener('DOMContentLoaded', function() {
  // Securely check if already logged in using PHP session (requires backend)
  fetch('Dragon_Vault/api/auth/login.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ check_session: true }),
    credentials: 'include' // Ensure cookies (session) are sent
  })
    .then(res => res.json())
    .then(data => {
      console.log('Session check response:', data);
      if (data.success && data.already_logged_in && data.redirect) {
        window.location.href = data.redirect;
      }
    });
}); 