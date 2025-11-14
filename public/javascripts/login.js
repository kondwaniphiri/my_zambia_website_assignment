document.getElementById('loginForm').addEventListener('submit', function(event) {

    const email = document.getElementById('email').value;
    if (!validateEmail(email)) {
        event.preventDefault();
        alert('Please enter a valid email address.');
    }
});

document.getElementById('signupForm').addEventListener('submit', function(event) {

    const password = document.getElementById('password').value;
    if (password.length < 6) {
        event.preventDefault();
        alert('Password must be at least 6 characters long.');
    }
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
}
