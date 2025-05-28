document.addEventListener('DOMContentLoaded', function() {
    const signInButton = document.getElementById('sign_in_button');
    const loginForm = document.getElementById('login_form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');

    signInButton.addEventListener('click', function() {
        if (!loginForm.checkValidity()) {
            alert('Please fill in all required fields.');
            return;
        }

        const username = usernameInput.value;
        const password = passwordInput.value;

        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        fetch('login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            alert(data); // Show the response from PHP
            if (data === 'Login successful!') {
                // Here you will redirect to another page if login is successful
                window.location.href = 'dashboard.html'; // sample dashboard page
            }
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('Login failed. Please try again later.');
        });
    });
});