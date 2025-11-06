// DOM Elements
const roleButtons = document.querySelectorAll('.role-btn');
const formContainers = document.querySelectorAll('.form-container');
const adminForm = document.getElementById('admin-form');
const federationForm = document.getElementById('federation-form');
const visitorForm = document.getElementById('visitor-form');
const adminRegistration = document.getElementById('adminRegistration');
const federationRegistration = document.getElementById('federationRegistration');
const visitorRegistration = document.getElementById('visitorRegistration');
const successMessage = document.getElementById('success-message');
const backToHomeButton = document.getElementById('back-to-home');
const roleSelection = document.querySelector('.role-selection');
const formsSection = document.querySelector('.forms-section');

// Initialize the page
document.addEventListener('DOMContentLoaded', function() {
    // Hide all forms initially
    hideAllForms();
    
    // Add event listeners to role buttons
    roleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const role = this.getAttribute('data-role');
            showForm(role);
        });
    });
    
    // Add event listeners to form submissions
    adminRegistration.addEventListener('submit', handleAdminRegistration);
    federationRegistration.addEventListener('submit', handleFederationRegistration);
    visitorRegistration.addEventListener('submit', handleVisitorRegistration);
    
    // Add event listener for back to home button
    backToHomeButton.addEventListener('click', resetToHome);
});

// Function to hide all forms
function hideAllForms() {
    formContainers.forEach(form => {
        form.classList.add('hidden');
    });
    successMessage.classList.add('hidden');
    roleSelection.classList.remove('hidden');
    formsSection.classList.remove('hidden');
}

// Function to show the appropriate form based on role
function showForm(role) {
    hideAllForms();
    
    switch(role) {
        case 'administrator':
            adminForm.classList.remove('hidden');
            break;
        case 'federation':
            federationForm.classList.remove('hidden');
            break;
        case 'visitor':
            visitorForm.classList.remove('hidden');
            break;
    }
}

// Function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Function to validate password strength
function isValidPassword(password) {
    return password.length >= 6;
}

// Function to display error message
function showError(inputElement, message) {
    const errorElement = inputElement.parentNode.querySelector('.error-message');
    errorElement.textContent = message;
    inputElement.style.borderColor = '#c41e3a';
}

// Function to clear error message
function clearError(inputElement) {
    const errorElement = inputElement.parentNode.querySelector('.error-message');
    errorElement.textContent = '';
    inputElement.style.borderColor = '#ddd';
}

// Function to validate form inputs
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
        clearError(input);
        
        // Check if field is empty
        if (!input.value.trim()) {
            showError(input, 'This field is required');
            isValid = false;
            return;
        }
        
        // Validate email format
        if (input.type === 'email' && !isValidEmail(input.value)) {
            showError(input, 'Please enter a valid email address');
            isValid = false;
            return;
        }
        
        // Validate password strength
        if (input.type === 'password' && !isValidPassword(input.value)) {
            showError(input, 'Password must be at least 6 characters long');
            isValid = false;
            return;
        }
    });
    
    return isValid;
}

// Function to handle administrator registration
function handleAdminRegistration(e) {
    e.preventDefault();
    
    if (!validateForm(adminRegistration)) {
        return;
    }
    
    // In a real application, you would send this data to a server
    const formData = new FormData(adminRegistration);
    const adminData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        adminCode: formData.get('adminCode'),
        role: 'administrator'
    };
    
    console.log('Administrator registration data:', adminData);
    showSuccessMessage();
}

// Function to handle federation registration
function handleFederationRegistration(e) {
    e.preventDefault();
    
    if (!validateForm(federationRegistration)) {
        return;
    }
    
    // In a real application, you would send this data to a server
    const formData = new FormData(federationRegistration);
    const federationData = {
        federationName: formData.get('federationName'),
        email: formData.get('email'),
        password: formData.get('password'),
        country: formData.get('country'),
        role: 'federation'
    };
    
    console.log('Federation registration data:', federationData);
    showSuccessMessage();
}

// Function to handle visitor registration
function handleVisitorRegistration(e) {
    e.preventDefault();
    
    if (!validateForm(visitorRegistration)) {
        return;
    }
    
    // In a real application, you would send this data to a server
    const formData = new FormData(visitorRegistration);
    const visitorData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
        country: formData.get('country'),
        role: 'visitor'
    };
    
    console.log('Visitor registration data:', visitorData);
    showSuccessMessage();
}

// Function to show success message
function showSuccessMessage() {
    roleSelection.classList.add('hidden');
    formsSection.classList.add('hidden');
    successMessage.classList.remove('hidden');
    
    // Scroll to top to show success message
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Function to reset to home page
function resetToHome() {
    hideAllForms();
    
    // Reset all forms
    adminRegistration.reset();
    federationRegistration.reset();
    visitorRegistration.reset();
    
    // Clear all error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(error => {
        error.textContent = '';
    });
    
    // Reset input borders
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.style.borderColor = '#ddd';
    });
    
    // Scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}