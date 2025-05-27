function handleRegisterClick() {
    const registrationForm = document.getElementById('registration_form');
    const firstNameInput = document.getElementById('first_name');
    const lastNameInput = document.getElementById('last_name');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirm_password');

    const firstName = firstNameInput.value;
    const lastName = lastNameInput.value;
    const username = usernameInput.value;
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    if (!registrationForm.checkValidity()) {
        alert('Please fill in all required fields.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('username', username);
    formData.append('password', password);

    fetch('register.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        alert(data);
        if (data.includes('successful')) {
            // Clear the form fields
            registrationForm.reset();
            // Optional: Redirect to login page
            window.location.href = '../teller_login/login.html';
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('Registration failed. Please try again later.');
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const registerButton = document.getElementById('register_button');
    registerButton.addEventListener('click', handleRegisterClick);
});