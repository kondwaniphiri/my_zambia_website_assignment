// Author: Kondwani Phiri
var loginForm = document.getElementById('loginForm');
var signupForm = document.getElementById('signupForm');
if (loginForm) loginForm.addEventListener('submit', function(event) {
    if (!validateEmail(document.getElementById('email').value)) {
        event.preventDefault();
        alert('Please enter a valid email address.');
    }
});
if (signupForm) signupForm.addEventListener('submit', function(event) {
    if (document.getElementById('password').value.length < 6) {
        event.preventDefault();
        alert('Password must be at least 6 characters long.');
    }
});
function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

var passwordToggle = document.querySelector('.password-toggle');
if (passwordToggle) passwordToggle.addEventListener('click', function() {
    var password = document.getElementById('password');
    var show = password.type == 'password';
    password.type = show ? 'text' : 'password';
    this.textContent = show ? 'Hide' : 'Show';
    this.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    this.setAttribute('aria-pressed', String(show));
});
