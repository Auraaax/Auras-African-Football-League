// Registration Form Validation and Handling
const registerForm = document.getElementById('registerForm');
const federationNameInput = document.getElementById('federationName');
const countrySelect = document.getElementById('country');
const contactPersonInput = document.getElementById('contactPerson');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('terms');
const registerBtn = document.querySelector('.register-btn');
const btnText = document.querySelector('.btn-text');
const btnLoader = document.querySelector('.btn-loader');
const registerError = document.getElementById('register-error');
const registerSuccess = document.getElementById('register-success');

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupPasswordToggle();
});

// Setup event listeners
function setupEventListeners() {
    registerForm.addEventListener('submit', handleSubmit);
    
    // Real-time validation
    federationNameInput.addEventListener('blur', () => validateField('federationName'));
    countrySelect.addEventListener('change', () => validateField('country'));
    contactPersonInput.addEventListener('blur', () => validateField('contactPerson'));
    emailInput.addEventListener('blur', () => validateField('email'));
    passwordInput.addEventListener('input', () => {
        validateField('password');
        checkPasswordStrength();
    });
    confirmPasswordInput.addEventListener('blur', () => validateField('confirmPassword'));
    termsCheckbox.addEventListener('change', () => validateField('terms'));
    
    // Clear error on input
    [federationNameInput, contactPersonInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
        input.addEventListener('input', function() {
            clearFieldError(this.id);
        });
    });
    
    countrySelect.addEventListener('change', () => clearFieldError('country'));
    termsCheckbox.addEventListener('change', () => clearFieldError('terms'));
}

// Setup password visibility toggle
function setupPasswordToggle() {
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.dataset.target;
            const input = document.getElementById(targetId);
            
            if (input.type === 'password') {
                input.type = 'text';
                this.textContent = '🙈';
            } else {
                input.type = 'password';
                this.textContent = '👁️';
            }
        });
    });
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();
    
    console.log('[REGISTER] Form submitted');
    
    // Reset previous errors
    resetAllErrors();
    
    // Validate all fields
    const isValid = validateAllFields();
    
    if (!isValid) {
        console.log('[REGISTER] Validation failed');
        registerForm.classList.add('shake');
        setTimeout(() => registerForm.classList.remove('shake'), 400);
        return;
    }
    
    // Show loading state
    setLoadingState(true);
    
    // Prepare registration data
    const registrationData = {
        federationName: federationNameInput.value.trim(),
        country: countrySelect.value,
        contactPerson: contactPersonInput.value.trim(),
        email: emailInput.value.trim(),
        password: passwordInput.value,
        role: 'federation'
    };
    
    console.log('[REGISTER] Sending registration data:', { ...registrationData, password: '***' });
    
    try {
        // Call backend API to register federation
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registrationData)
        });

        const rawText = await response.text();
        let data;
        try {
            data = rawText ? JSON.parse(rawText) : {};
        } catch (parseErr) {
            console.warn('[REGISTER] Non-JSON response received:', rawText);
            data = { error: 'Unexpected server response. Please retry.' };
        }

        console.log('[REGISTER] Response status:', response.status);

        if (!response.ok) {
            // Map common status codes to clearer messages
            let friendlyMessage = data.error || 'Registration failed. Please try again.';
            if (response.status === 409) {
                friendlyMessage = 'Email already registered. Use a different email or login.';
            } else if (response.status === 400) {
                friendlyMessage = data.error || 'Invalid input. Please review the form.';
            } else if (response.status >= 500) {
                friendlyMessage = 'Server error. Please retry shortly.';
            }
            console.error('[REGISTER] Registration failed:', {
                status: response.status,
                message: friendlyMessage,
                serverError: data.error,
                details: data.details
            });
            showError(friendlyMessage);
            setLoadingState(false);
            return;
        }

        console.log('[REGISTER] Registration successful payload:', data);

        if (!data.token || !data.user) {
            console.error('[REGISTER] Missing token/user in success response:', data);
            showError('Registration succeeded but response incomplete. Please login manually.');
            setLoadingState(false);
            return;
        }

        // Show success message
        registerSuccess.classList.remove('hidden');
        registerError.classList.add('hidden');

        // Store auth token and user data
        try {
            localStorage.setItem('authToken', data.token);
            localStorage.setItem('currentUser', JSON.stringify(data.user));
        } catch(storageErr) {
            console.warn('[REGISTER] Storage error (possibly in private mode):', storageErr);
        }

        // Redirect to federation home after brief delay
        setTimeout(() => {
            window.location.href = 'federation_home.html';
        }, 1200);
        
    } catch (error) {
        console.error('[REGISTER] Network/Fetch error:', error);
        // Provide actionable hints
        let hint = 'Network error. Check your connection.';
        if (error.message.includes('Failed to fetch')) {
            hint = 'Cannot reach server. Ensure it is running on port 3002.';
        }
        showError(hint);
        setLoadingState(false);
    }
}

// Validate all fields
function validateAllFields() {
    const validations = [
        validateField('federationName'),
        validateField('country'),
        validateField('contactPerson'),
        validateField('email'),
        validateField('password'),
        validateField('confirmPassword'),
        validateField('terms')
    ];
    
    return validations.every(v => v === true);
}

// Validate individual field
function validateField(fieldName) {
    switch(fieldName) {
        case 'federationName':
            return validateFederationName();
        case 'country':
            return validateCountry();
        case 'contactPerson':
            return validateContactPerson();
        case 'email':
            return validateEmail();
        case 'password':
            return validatePassword();
        case 'confirmPassword':
            return validateConfirmPassword();
        case 'terms':
            return validateTerms();
        default:
            return true;
    }
}

// Individual field validators
function validateFederationName() {
    const value = federationNameInput.value.trim();
    
    if (!value) {
        showFieldError('federationName', 'Federation name is required');
        return false;
    }
    
    if (value.length < 3) {
        showFieldError('federationName', 'Federation name must be at least 3 characters');
        return false;
    }
    
    clearFieldError('federationName');
    return true;
}

function validateCountry() {
    const value = countrySelect.value;
    
    if (!value) {
        showFieldError('country', 'Please select a country');
        return false;
    }
    
    clearFieldError('country');
    return true;
}

function validateContactPerson() {
    const value = contactPersonInput.value.trim();
    
    if (!value) {
        showFieldError('contactPerson', 'Contact person name is required');
        return false;
    }
    
    if (value.length < 2) {
        showFieldError('contactPerson', 'Please enter a valid name');
        return false;
    }
    
    clearFieldError('contactPerson');
    return true;
}

function validateEmail() {
    const value = emailInput.value.trim();
    
    if (!value) {
        showFieldError('email', 'Email address is required');
        return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        showFieldError('email', 'Please enter a valid email address');
        return false;
    }
    
    clearFieldError('email');
    return true;
}

function validatePassword() {
    const value = passwordInput.value;
    
    if (!value) {
        showFieldError('password', 'Password is required');
        return false;
    }
    
    if (value.length < 8) {
        showFieldError('password', 'Password must be at least 8 characters');
        return false;
    }
    
    // Check for at least one number or special character
    if (!/(?=.*[0-9!@#$%^&*])/.test(value)) {
        showFieldError('password', 'Password must contain at least one number or special character');
        return false;
    }
    
    clearFieldError('password');
    return true;
}

function validateConfirmPassword() {
    const value = confirmPasswordInput.value;
    const passwordValue = passwordInput.value;
    
    if (!value) {
        showFieldError('confirmPassword', 'Please confirm your password');
        return false;
    }
    
    if (value !== passwordValue) {
        showFieldError('confirmPassword', 'Passwords do not match');
        return false;
    }
    
    clearFieldError('confirmPassword');
    return true;
}

function validateTerms() {
    if (!termsCheckbox.checked) {
        showFieldError('terms', 'You must agree to the terms and conditions');
        return false;
    }
    
    clearFieldError('terms');
    return true;
}

// Check password strength
function checkPasswordStrength() {
    const value = passwordInput.value;
    const strengthIndicator = document.getElementById('password-strength');
    
    if (!value) {
        strengthIndicator.className = 'password-strength';
        return;
    }
    
    let strength = 0;
    
    // Length check
    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;
    
    // Character variety
    if (/[a-z]/.test(value) && /[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) strength++;
    
    if (strength <= 2) {
        strengthIndicator.className = 'password-strength weak';
    } else if (strength <= 4) {
        strengthIndicator.className = 'password-strength medium';
    } else {
        strengthIndicator.className = 'password-strength strong';
    }
}

// Show field error
function showFieldError(fieldId, message) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    
    if (inputElement && inputElement.tagName !== 'SELECT') {
        inputElement.classList.add('error');
    }
}

// Clear field error
function clearFieldError(fieldId) {
    const errorElement = document.getElementById(`${fieldId}-error`);
    const inputElement = document.getElementById(fieldId);
    
    if (errorElement) {
        errorElement.classList.add('hidden');
    }
    
    if (inputElement) {
        inputElement.classList.remove('error');
    }
}

// Reset all errors
function resetAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('input').forEach(el => el.classList.remove('error'));
    registerError.classList.add('hidden');
    registerSuccess.classList.add('hidden');
}

// Show global error
function showError(message) {
    registerError.textContent = message;
    registerError.classList.remove('hidden');
    registerSuccess.classList.add('hidden');
}

// Set loading state
function setLoadingState(isLoading) {
    if (isLoading) {
        btnText.classList.add('hidden');
        btnLoader.classList.remove('hidden');
        registerBtn.disabled = true;
    } else {
        btnText.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        registerBtn.disabled = false;
    }
}

console.log('[REGISTER] Registration page initialized');
