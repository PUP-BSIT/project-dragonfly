document.addEventListener("DOMContentLoaded", () => {
  fetch("/Dragon_Vault/api/auth/get_teller_info.php")
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById("tellerName").textContent = data.full_name;
      } else {
        alert("Unauthorized. Redirecting to login...");
        window.location.href = "teller_login.html";
      }
    });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    fetch("/Dragon_Vault/api/auth/logout.php", { method: "POST" })
      .then(() => {
        window.location.href = "teller_login.html";
      });
  });
});
