document.addEventListener("DOMContentLoaded", () => {
  fetch("/Dragon_Vault/api/teller/get_teller_profile.php")
    .then(res => res.json())
    .then(data => {
      if (data.profile) {
        const p = data.profile;
        document.getElementById("tellerId").textContent = p.teller_id;
        document.getElementById("name").textContent = `${p.first_name} ${p.last_name}`;
        document.getElementById("email").textContent = p.email;
        document.getElementById("branch").textContent = p.branch;
        document.getElementById("username").textContent = p.username;
      } else {
        alert(data.error || "Profile not found.");
      }
    })
    .catch(err => {
      console.error("Error fetching profile:", err);
      alert("Failed to load profile.");
    });
});
