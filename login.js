// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const nameInput = document.getElementById('name');
const userTypeSelect = document.getElementById('userType');
const loginBtn = document.querySelector('.login-btn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const loginError = document.getElementById('login-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const roleError = document.getElementById('role-error');

// User role to page mapping
const rolePages = {
    'administrator': 'admin_home.html',
    'federation': 'federation_home.html',
    'visitor': 'visitor_home.html'
};

// Initialize the login page
document.addEventListener('DOMContentLoaded', function() {
    // Ensure a sensible default role (visitor is passwordless)
    if (!userTypeSelect.value) {
        userTypeSelect.value = 'visitor';
    }

    // Apply initial role-based UI adjustments (hide password for visitor)
    adjustForRole();

    // Check if user is already logged in (optional feature)
    checkExistingSession();

    // Add event listeners
    loginForm.addEventListener('submit', handleLogin);

    // Add input event listeners for real-time validation
    emailInput.addEventListener('input', clearFieldError);
    passwordInput.addEventListener('input', clearFieldError);
    userTypeSelect.addEventListener('change', (e)=> { clearFieldError(e); adjustForRole(); });

    // Allow pressing Enter on any field to trigger login explicitly
    [emailInput, passwordInput, nameInput, userTypeSelect].forEach(el => {
        if (el) {
            el.addEventListener('keyup', (evt) => {
                if (evt.key === 'Enter') {
                    loginForm.requestSubmit();
                }
            });
        }
    });
});

// Function to check if user already has an active session
function checkExistingSession() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const user = JSON.parse(currentUser);
        // Optional: Auto-redirect if session exists
        // redirectToDashboard(user.role);
    }
}

// Function to handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    // Reset previous errors
    resetErrors();
    
    // Validate form inputs
    if (!validateForm()) {
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
        // Send credentials to backend API
        authenticateUserRemote()
            .then(result => {
                if (result.success) {
                    // Store token and user
                    localStorage.setItem('authToken', result.token);
                    localStorage.setItem('currentUser', JSON.stringify(result.user));
                    handleSuccessfulLogin();
                } else {
                    // show failure message
                    handleFailedLogin();
                    if (result.error) {
                        loginError.textContent = result.error;
                        loginError.classList.remove('hidden');
                    }
                }
            })
            .catch(err => {
                console.error('Login error', err);
                loginError.textContent = 'Server error. Please try again.';
                loginError.classList.remove('hidden');
                handleFailedLogin();
            })
            .finally(() => setLoadingState(false));
}

// Function to validate form inputs
function validateForm() {
    let isValid = true;
    
    // Validate email
    if (!emailInput.value.trim()) {
        showFieldError(emailError, 'Email is required');
        isValid = false;
    } else if (!isValidEmail(emailInput.value.trim())) {
        showFieldError(emailError, 'Please enter a valid email address');
        isValid = false;
    }
    
    // Validate password (skip for visitor)
    if (userTypeSelect.value !== 'visitor') {
        if (!passwordInput.value) {
            showFieldError(passwordError, 'Password is required');
            isValid = false;
        } else if (passwordInput.value.length < 6) {
            showFieldError(passwordError, 'Password must be at least 6 characters');
            isValid = false;
        }
    }
    
    // Validate user type
    if (!userTypeSelect.value) {
        showFieldError(roleError, 'Please select your role');
        isValid = false;
    }
    
    return isValid;
}

// Function to authenticate against backend API
async function authenticateUserRemote() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const name = (nameInput?.value || '').trim();
    const userType = userTypeSelect.value;

    const payload = userType === 'visitor'
        ? { email: email || 'visitor@aafl.local', name: name || 'Visitor', role: 'visitor' }
        : { email, password, role: userType };

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            return { success: false, error: err.error || 'Invalid credentials' };
        }

        const data = await res.json();
        return { success: true, token: data.token, user: data.user };
    } catch (err) {
        return { success: false, error: 'Network or server error' };
    }
}

// Function to handle successful login
function handleSuccessfulLogin() {
    const userType = userTypeSelect.value;
    
    // Show success feedback
    loginBtn.style.background = 'linear-gradient(135deg, #1a5319, #2d8c2b)';
    btnText.textContent = 'Login Successful!';
    
    // Redirect to appropriate dashboard after brief delay
    setTimeout(() => {
        redirectToDashboard(userType);
    }, 700);
}

// Function to handle failed login
function handleFailedLogin() {
    // Show global error message
    loginError.classList.remove('hidden');
    
    // Shake animation for error feedback
    loginForm.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        loginForm.style.animation = '';
    }, 500);
}

// Function to redirect to role-specific dashboard
function redirectToDashboard(userType) {
    const targetPage = rolePages[userType];
    
    if (targetPage) {
        window.location.href = targetPage;
    } else {
        console.error('No dashboard page defined for role:', userType);
        // Fallback to a generic page or show error
        alert('Error: Unable to redirect to your dashboard. Please contact support.');
    }
}

// (Old local demo storage helper removed - backend login is used now)

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to set loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        loginBtn.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        loginBtn.disabled = false;
    }
}

// Function to reset all error messages
function resetErrors() {
    emailError.textContent = '';
    passwordError.textContent = '';
    roleError.textContent = '';
    loginError.classList.add('hidden');
    
    // Reset input borders
    const inputs = [emailInput, passwordInput];
    inputs.forEach(input => {
        input.style.borderColor = '#e1e1e1';
    });
    userTypeSelect.style.borderColor = '#e1e1e1';
}

// Function to show field-specific error
function showFieldError(errorElement, message) {
    errorElement.textContent = message;
}

// Function to clear field error on input
function clearFieldError(e) {
    const field = e.target;
    const errorId = field.id + '-error';
    const errorElement = document.getElementById(errorId);
    
    if (errorElement) {
        errorElement.textContent = '';
    }
    
    // Reset border color
    field.style.borderColor = '#e1e1e1';
    
    // Hide global error if user starts typing again
    loginError.classList.add('hidden');
}

// Adjust UI and validation for selected role
function adjustForRole(){
    const role = userTypeSelect.value;
    const passwordGroup = document.getElementById('password-group');
    const nameGroup = document.getElementById('name-group');
    if (role === 'visitor'){
        // visitor is passwordless
        if (passwordInput) passwordInput.required = false;
        if (passwordGroup) passwordGroup.style.display = 'none';
        if (nameGroup) nameGroup.style.display = 'block';
    } else {
        if (passwordInput) passwordInput.required = true;
        if (passwordGroup) passwordGroup.style.display = 'block';
        if (nameGroup) nameGroup.style.display = 'none';
    }
}

// Add shake animation for error feedback
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Demo data initialization (for testing purposes)
// This would normally be set during registration
function initializeDemoData() {
    // Only initialize if no users exist
    if (!localStorage.getItem('auraFootballUsers')) {
        const demoUsers = [
            {
                email: 'admin@aurafootball.com',
                password: 'admin123',
                role: 'administrator',
                name: 'League Administrator'
            },
            {
                email: 'federation@africa.com',
                password: 'fed123',
                role: 'federation',
                name: 'African Football Federation'
            },
            {
                email: 'visitor@example.com',
                password: 'visitor123',
                role: 'visitor',
                name: 'Football Fan'
            }
        ];
        
        localStorage.setItem('auraFootballUsers', JSON.stringify(demoUsers));
        console.log('Demo users initialized. You can use these credentials to test login.');
    }
}

// Uncomment the line below to initialize demo data for testing
// initializeDemoData();