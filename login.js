// Tab switching
const tabBtns = document.querySelectorAll('.tab-btn');
const authForms = document.querySelectorAll('.auth-form');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        
        // Update active tab button
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Update active form
        authForms.forEach(form => form.classList.remove('active'));
        document.getElementById(`${tab}-form`).classList.add('active');
    });
});

// Sign In Handler
const signinForm = document.getElementById('signin-form');
signinForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('signin-email').value;
    const password = document.getElementById('signin-password').value;
    const messageEl = document.getElementById('signin-message');
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageEl, data.message, 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showMessage(messageEl, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageEl, 'An error occurred. Please try again.', 'error');
    }
});

// Register Form Handler
const registerForm = document.getElementById('register-form');
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm').value;
    const name = document.getElementById('register-name').value;
    const messageEl = document.getElementById('register-message');
    
    if (password !== confirmPassword) {
        showMessage(messageEl, 'Passwords do not match.', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email, 
                password, 
                confirmPassword,
                name
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage(messageEl, data.message, 'success');
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } else {
            showMessage(messageEl, data.message, 'error');
        }
    } catch (error) {
        showMessage(messageEl, 'An error occurred. Please try again.', 'error');
    }
});

// Helper function to show messages
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message show ${type}`;
    
    setTimeout(() => {
        element.classList.remove('show');
    }, 4000);
}

// Smooth effects
const inputs = document.querySelectorAll('.form-input');
inputs.forEach(input => {
    input.addEventListener('focus', () => {
        input.parentElement.classList.add('focused');
    });
    
    input.addEventListener('blur', () => {
        input.parentElement.classList.remove('focused');
    });
});

// Password strength indicator 
const passwordInput = document.getElementById('register-password');
if (passwordInput) {
    passwordInput.addEventListener('input', (e) => {
        const strength = getPasswordStrength(e.target.value);
       
    });
}

function getPasswordStrength(password) {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    return strength;
}

// Prevent form submission on Enter in certain cases
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.classList.contains('form-input')) {
        const form = e.target.closest('.auth-form');
        if (form) {
            form.querySelector('.btn').click();
        }
    }
});

// Add loading state to buttons
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        if (this.type === 'submit') {
            this.classList.add('loading');
            this.disabled = true;
            
            setTimeout(() => {
                this.classList.remove('loading');
                this.disabled = false;
            }, 3000);
        }
    });
});

// Social login handlers (placeholder)
document.querySelectorAll('.social-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const service = e.currentTarget.classList.contains('spotify') ? 'Spotify' : 'Google';
        console.log(`${service} login clicked`);
        // Implement OAuth flow 
    });
});
