// Federation Home - Squad Registration and Management
let currentSquad = [];
let currentUser = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
  // Get current user from localStorage
  const userJSON = localStorage.getItem('currentUser');
  if (!userJSON) {
    alert('Please log in first');
    window.location.href = 'login.html';
    return;
  }

  currentUser = JSON.parse(userJSON);
  document.getElementById('userName').textContent = currentUser.name || 'Federation Representative';

  // Load countries
  await loadCountries();

  // Check if federation already registered
  await checkRegistrationStatus();

  // Setup event listeners
  setupEventListeners();
});

// Load African countries from backend
async function loadCountries() {
  try {
    const res = await fetch('/api/federation/countries');
    const data = await res.json();
    
    const countrySelect = document.getElementById('country');
    data.countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country;
      option.textContent = country;
      countrySelect.appendChild(option);
    });
  } catch (err) {
    console.error('Failed to load countries:', err);
  }
}

// Check if federation is already registered
async function checkRegistrationStatus() {
  try {
    const res = await fetch(`/api/federation/check-registration?email=${encodeURIComponent(currentUser.email)}`);
    const data = await res.json();

    if (data.registered) {
      showRegisteredView(data.federation);
    } else {
      showRegistrationForm();
    }
  } catch (err) {
    console.error('Failed to check registration:', err);
    showRegistrationForm();
  }
}

// Show already registered view
function showRegisteredView(federation) {
  document.getElementById('registrationForm').style.display = 'none';
  document.getElementById('registeredView').style.display = 'block';
  document.getElementById('welcomeSection').style.display = 'none';

  // Populate summary
  document.getElementById('registeredCountry').textContent = `${federation.teamName} representing ${federation.country}`;
  document.getElementById('summaryCountry').textContent = federation.country;
  document.getElementById('summaryTeamName').textContent = federation.teamName;
  document.getElementById('summaryManager').textContent = federation.manager;
  document.getElementById('summaryRating').textContent = federation.countryRating.toFixed(1);

  // Populate squad table
  const tbody = document.getElementById('registeredSquadBody');
  tbody.innerHTML = '';

  federation.players.forEach((player, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${player.name}</td>
      <td>${player.naturalPosition}</td>
      <td class="rating-cell ${getRatingClass(player.ratings.GK)}">${player.ratings.GK}</td>
      <td class="rating-cell ${getRatingClass(player.ratings.DF)}">${player.ratings.DF}</td>
      <td class="rating-cell ${getRatingClass(player.ratings.MD)}">${player.ratings.MD}</td>
      <td class="rating-cell ${getRatingClass(player.ratings.AT)}">${player.ratings.AT}</td>
      <td>${player.isCaptain ? '<span class="captain-badge">CAPTAIN</span>' : '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Show registration form
function showRegistrationForm() {
  document.getElementById('registrationForm').style.display = 'block';
  document.getElementById('registeredView').style.display = 'none';
}

// Setup event listeners
function setupEventListeners() {
  document.getElementById('logoutBtn').addEventListener('click', handleLogout);
  document.getElementById('generateSquadBtn').addEventListener('click', generateSquad);
  document.getElementById('regenerateSquadBtn').addEventListener('click', regenerateSquad);
  document.getElementById('submitRegistrationBtn').addEventListener('click', submitRegistration);
  document.getElementById('closeSuccessBtn').addEventListener('click', () => {
    document.getElementById('successModal').style.display = 'none';
    window.location.reload();
  });
  document.getElementById('closeErrorBtn').addEventListener('click', () => {
    document.getElementById('errorModal').style.display = 'none';
  });
}

// Handle logout
function handleLogout() {
  console.log('[FEDERATION LOGOUT] Logout button clicked');
  console.log('[FEDERATION LOGOUT] Before clear - localStorage authToken:', localStorage.getItem('authToken'));
  console.log('[FEDERATION LOGOUT] Before clear - sessionStorage authToken:', sessionStorage.getItem('authToken'));
  
  // Clear both local and session storage to avoid sticky tokens
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  
  console.log('[FEDERATION LOGOUT] After clear - localStorage authToken:', localStorage.getItem('authToken'));
  console.log('[FEDERATION LOGOUT] Redirecting to login.html');
  
  window.location.href = 'login.html';
}

// Generate squad
async function generateSquad() {
  try {
    const res = await fetch('/api/federation/regenerate-squad', { method: 'POST' });
    const data = await res.json();

    currentSquad = data.squad;
    displaySquad();
    
    document.getElementById('generateSquadBtn').style.display = 'none';
    document.getElementById('regenerateSquadBtn').style.display = 'inline-block';
  } catch (err) {
    console.error('Failed to generate squad:', err);
    alert('Failed to generate squad. Please try again.');
  }
}

// Regenerate squad
async function regenerateSquad() {
  if (!confirm('Are you sure you want to regenerate the squad? All current players will be replaced.')) {
    return;
  }
  await generateSquad();
}

// Display squad in table
function displaySquad() {
  document.getElementById('squadPreview').style.display = 'block';
  
  const tbody = document.getElementById('squadBody');
  tbody.innerHTML = '';

  currentSquad.forEach((player, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${player.name}</td>
      <td>${player.naturalPosition}</td>
      <td class="rating-cell ${getRatingClass(player.ratings.GK)}">${player.ratings.GK}</td>
      <td class="rating-cell ${getRatingClass(player.ratings.DF)}">${player.ratings.DF}</td>
      <td class="rating-cell ${getRatingClass(player.ratings.MD)}">${player.ratings.MD}</td>
      <td class="rating-cell ${getRatingClass(player.ratings.AT)}">${player.ratings.AT}</td>
      <td>
        <input type="radio" name="captain" value="${index}" ${player.isCaptain ? 'checked' : ''} 
               onchange="setCaptain(${index})">
      </td>
    `;
    tbody.appendChild(tr);
  });

  // Update position counts
  updatePositionCounts();
  
  // Calculate and display country rating
  calculateCountryRating();
}

// Update position counts
function updatePositionCounts() {
  const counts = { GK: 0, DF: 0, MD: 0, AT: 0 };
  
  currentSquad.forEach(player => {
    counts[player.naturalPosition]++;
  });

  document.getElementById('gkCount').textContent = counts.GK;
  document.getElementById('dfCount').textContent = counts.DF;
  document.getElementById('mdCount').textContent = counts.MD;
  document.getElementById('atCount').textContent = counts.AT;
}

// Calculate country rating
function calculateCountryRating() {
  if (currentSquad.length === 0) return;

  const totalRating = currentSquad.reduce((sum, player) => {
    // Get player's rating in their natural position
    return sum + player.ratings[player.naturalPosition];
  }, 0);

  const avgRating = totalRating / currentSquad.length;
  const roundedRating = Math.round(avgRating * 10) / 10;

  document.getElementById('countryRating').textContent = roundedRating.toFixed(1);
  displayRatingStars(roundedRating);
}

// Display rating as stars
function displayRatingStars(rating) {
  const starsContainer = document.getElementById('ratingStars');
  const starCount = Math.round(rating / 20); // Convert 0-100 to 0-5 stars
  
  starsContainer.innerHTML = '⭐'.repeat(starCount);
}

// Get rating class for color coding
function getRatingClass(rating) {
  if (rating >= 70) return 'rating-high';
  if (rating >= 40) return 'rating-medium';
  return 'rating-low';
}

// Set captain (called from radio button)
window.setCaptain = function(index) {
  currentSquad.forEach((player, i) => {
    player.isCaptain = (i === index);
  });
};

// Submit registration
async function submitRegistration() {
  const country = document.getElementById('country').value;
  const teamName = document.getElementById('teamName').value;
  const manager = document.getElementById('manager').value;

  // Validate
  if (!country || !teamName || !manager) {
    alert('Please fill in all required fields (Country, Team Name, Manager)');
    return;
  }

  if (currentSquad.length !== 23) {
    alert('Please generate a 23-player squad before submitting');
    return;
  }

  // Ensure at least one captain is selected
  const hasCaptain = currentSquad.some(p => p.isCaptain);
  if (!hasCaptain) {
    currentSquad[0].isCaptain = true; // Default to first player
  }

  // Show loading
  document.getElementById('loadingOverlay').style.display = 'flex';

  try {
    const res = await fetch('/api/federation/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        country,
        representative: currentUser.email,
        manager,
        teamName,
        players: currentSquad
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    // Show success modal
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('successMessage').textContent = data.message;
    document.getElementById('successModal').style.display = 'flex';
  } catch (err) {
    console.error('Registration error:', err);
    document.getElementById('loadingOverlay').style.display = 'none';
    document.getElementById('errorMessage').textContent = err.message || 'Registration failed. Please try again.';
    document.getElementById('errorModal').style.display = 'flex';
  }
}
