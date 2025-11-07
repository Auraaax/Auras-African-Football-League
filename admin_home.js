const baseURL = 'http://localhost:3002/api/admin';
const authToken = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

function authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

// Simple confetti animation
function confetti() {
  const canvas = document.getElementById('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight; canvas.style.display = 'block';
  const pieces = Array.from({length: 120}, () => ({ x: Math.random()*canvas.width, y: -20, s: 4+Math.random()*4, c: ['#d4af37','#e63946','#2a9d8f','#ffd166'][Math.floor(Math.random()*4)], v: 2+Math.random()*3 }));
  let t=0; const id = setInterval(()=>{
    t++; ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{ p.y+=p.v; ctx.fillStyle=p.c; ctx.fillRect(p.x+Math.sin((p.y+p.s)*0.05)*8, p.y, p.s, p.s); });
    if (t>120) { clearInterval(id); canvas.style.display='none'; }
  }, 16);
}

async function loadDashboard() {
  try {
    const res = await fetch(`${baseURL}/dashboard`, { headers: authHeaders() });
    const data = await res.json();
    document.getElementById('welcomeText').textContent = `Welcome back, ${data.adminName}!`;
    document.getElementById('statFederations').textContent = data.federationCount;
    document.getElementById('statTeams').textContent = data.teamCount;
    document.getElementById('statMatches').textContent = data.matchCount;
  } catch (err) {
    console.error('Failed to load dashboard:', err);
    document.getElementById('welcomeText').textContent = 'Welcome back, Administrator!';
    document.getElementById('statFederations').textContent = '0';
    document.getElementById('statTeams').textContent = '0';
    document.getElementById('statMatches').textContent = '0';
  }
}

async function loadTeams() {
  try {
    const res = await fetch(`${baseURL}/teams`);
    const teams = await res.json();
    const a = document.getElementById('teamASelect');
    const b = document.getElementById('teamBSelect');
    a.innerHTML = '<option value="">Select Team A</option>';
    b.innerHTML = '<option value="">Select Team B</option>';
    teams.forEach(t => {
      a.insertAdjacentHTML('beforeend', `<option value="${t._id}">${t.teamName}</option>`);
      b.insertAdjacentHTML('beforeend', `<option value="${t._id}">${t.teamName}</option>`);
    });
  } catch (err) {
    console.error('Failed to load teams:', err);
  }
}

async function loadMatches() {
  try {
    const res = await fetch(`${baseURL}/matches`);
    const matches = await res.json();
    const body = document.getElementById('matchesBody');
    body.innerHTML = '';
    if (matches.length === 0) {
      body.innerHTML = '<tr><td colspan="4" style="text-align:center;">No matches yet. Simulate your first match!</td></tr>';
      return;
    }
    matches.forEach(m => {
      const d = new Date(m.date).toLocaleString();
      body.insertAdjacentHTML('beforeend', `<tr><td>${d}</td><td>${m.teamA}</td><td>${m.scoreA} - ${m.scoreB}</td><td>${m.teamB}</td></tr>`);
    });
  } catch (err) {
    console.error('Failed to load matches:', err);
    document.getElementById('matchesBody').innerHTML = '<tr><td colspan="4" style="text-align:center;">Error loading matches</td></tr>';
  }
}

async function loadLeaderboard() {
  try {
    const res = await fetch(`${baseURL}/leaderboard`);
    const table = await res.json();
    const body = document.getElementById('leaderboardBody');
    body.innerHTML = '';
    if (table.length === 0) {
      body.innerHTML = '<tr><td colspan="8" style="text-align:center;">No data yet</td></tr>';
      return;
    }
    table.forEach(r => {
      body.insertAdjacentHTML('beforeend', `<tr><td>${r.teamName}</td><td>${r.played}</td><td>${r.wins}</td><td>${r.draws}</td><td>${r.losses}</td><td>${r.goalsFor}</td><td>${r.goalsAgainst}</td><td>${r.points}</td></tr>`);
    });
  } catch (err) {
    console.error('Failed to load leaderboard:', err);
    document.getElementById('leaderboardBody').innerHTML = '<tr><td colspan="8" style="text-align:center;">Error loading leaderboard</td></tr>';
  }
}

function setupNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target');
      document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
      document.getElementById(target).classList.add('active');
    });
  });
}

async function simulateMatch(e) {
  e.preventDefault();
  const teamA = document.getElementById('teamASelect').value;
  const teamB = document.getElementById('teamBSelect').value;
  if (!teamA || !teamB || teamA === teamB) {
    alert('Choose two different teams'); return;
  }
  try {
    const res = await fetch(`${baseURL}/simulate-match`, {
      method: 'POST', headers: authHeaders(), body: JSON.stringify({ teamA, teamB })
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || 'Failed to simulate'); return; }
    const box = document.getElementById('simulationResult');
    box.textContent = `${data.match.teamA} ${data.match.scoreA} - ${data.match.scoreB} ${data.match.teamB}`;
    box.style.animation = 'pop .6s ease'; setTimeout(()=> box.style.animation = '', 700);
    confetti();
    await loadMatches();
    await loadLeaderboard();
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function logout() {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
  localStorage.removeItem('currentUser');
  window.location.href = 'login.html';
}

window.addEventListener('DOMContentLoaded', async () => {
  setupNav();
  document.getElementById('simulateForm').addEventListener('submit', simulateMatch);
  document.getElementById('logoutBtn').addEventListener('click', logout);
  document.getElementById('restartTournamentBtn')?.addEventListener('click', restartTournament);
  
  await loadDashboard();
  await loadTeams();
  await loadMatches();
  await loadLeaderboard();
  await loadTournamentStatus();
});

// Tournament Functions
async function loadTournamentStatus() {
  try {
    const res = await fetch(`${baseURL}/tournament/status`);
    const status = await res.json();
    
    const statusDiv = document.getElementById('tournamentStatus');
    
    if (!status.canStart) {
      statusDiv.innerHTML = `
        <p style="color:#e63946;">⏳ Waiting for 8 registered teams to begin tournament...</p>
        <p>Current teams: ${status.teamCount} / 8</p>
      `;
      return;
    }
    
    let statusText = '';
    if (status.status === 'not_started') {
      statusText = '<p style="color:#2a9d8f;">✅ Tournament ready to start! Begin with Quarterfinals below.</p>';
    } else if (status.status === 'quarterfinals') {
      statusText = `<p style="color:#d4af37;">🏃 Quarterfinals in progress (${status.quarterfinalsPlayed}/4 completed)</p>`;
    } else if (status.status === 'semifinals') {
      statusText = `<p style="color:#d4af37;">🏃 Semifinals in progress (${status.semifinalsPlayed}/2 completed)</p>`;
    } else if (status.status === 'completed') {
      statusText = '<p style="color:#2a9d8f;">🏆 Tournament Complete! Check the Final result below.</p>';
    }
    
    statusDiv.innerHTML = statusText;
    
    // Load matches for each round
    await loadRoundMatches('Quarterfinal', 'quarterfinalsMatches');
    await loadRoundMatches('Semifinal', 'semifinalsMatches');
    await loadRoundMatches('Final', 'finalMatch');
    
  } catch (err) {
    console.error('Failed to load tournament status:', err);
  }
}

async function loadRoundMatches(round, containerId) {
  try {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Check if matches exist for this round
    const res = await fetch(`${baseURL}/tournament/matches/${round}`);
    const matches = await res.json();
    
    if (matches.length > 0) {
      // Display completed matches
      container.innerHTML = matches.map(m => `
        <div class="match-card">
          <div class="match-teams">${m.teamA} vs ${m.teamB}</div>
          <div class="match-score">${m.scoreA} - ${m.scoreB}</div>
          <div class="match-result">Winner: ${m.winner}</div>
          ${m.resultType !== '90min' ? `<div style="font-size:.85rem;color:#aaa;">(${m.resultType})</div>` : ''}
          ${m.goals && m.goals.length > 0 ? `
            <div class="match-goals">
              ${m.goals.map(g => `⚽ ${g.scorer} ${g.minute}'`).join('<br>')}
            </div>
          ` : ''}
          ${m.commentary ? `
            <button class="primary" style="margin-top:.5rem;width:100%;font-size:.85rem;" 
                    onclick="showCommentary('${m.commentary.replace(/'/g, "\\'")}')">
              View Commentary
            </button>
          ` : ''}
        </div>
      `).join('');
    } else if (round === 'Quarterfinal') {
      // Show quarterfinal pairings with play/simulate buttons
      const pairingsRes = await fetch(`${baseURL}/tournament/quarterfinals`);
      const pairings = await pairingsRes.json();
      
      container.innerHTML = pairings.map((p, idx) => `
        <div class="match-card">
          <div class="match-teams">QF${idx + 1}: ${p.teamA.teamName} vs ${p.teamB.teamName}</div>
          <div class="match-actions">
            <button class="play-btn" onclick="playMatch('${p.teamA._id}', '${p.teamB._id}', 'Quarterfinal')">
              🎮 Play
            </button>
            <button class="sim-btn" onclick="quickSimulate('${p.teamA._id}', '${p.teamB._id}', 'Quarterfinal')">
              ⚡ Simulate
            </button>
          </div>
        </div>
      `).join('');
    } else {
      // Need to complete previous round first
      const prevRound = round === 'Semifinal' ? 'Quarterfinals' : 'Semifinals';
      container.innerHTML = `<p style="text-align:center;color:#666;">Complete ${prevRound} first</p>`;
    }
  } catch (err) {
    console.error(`Failed to load ${round} matches:`, err);
  }
}

async function playMatch(teamAId, teamBId, round) {
  try {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Playing...';
    
    const res = await fetch(`${baseURL}/tournament/play-match`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ teamAId, teamBId, round })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      alert(data.error || 'Failed to play match');
      btn.disabled = false;
      btn.textContent = '🎮 Play';
      return;
    }
    
    // Show commentary
    if (data.match.commentary) {
      showCommentary(data.match.commentary);
    }
    
    // Reload tournament
    await loadTournamentStatus();
    confetti();
    
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

async function quickSimulate(teamAId, teamBId, round) {
  try {
    const btn = event.target;
    btn.disabled = true;
    btn.textContent = '⏳ Simulating...';
    
    const res = await fetch(`${baseURL}/tournament/simulate-match`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ teamAId, teamBId, round })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      alert(data.error || 'Failed to simulate match');
      btn.disabled = false;
      btn.textContent = '⚡ Simulate';
      return;
    }
    
    // Show brief result
    alert(`${data.match.teamA} ${data.match.scoreA} - ${data.match.scoreB} ${data.match.teamB}\nWinner: ${data.match.winner}`);
    
    // Reload tournament
    await loadTournamentStatus();
    confetti();
    
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

function showCommentary(text) {
  const box = document.getElementById('matchCommentary');
  const textDiv = document.getElementById('commentaryText');
  textDiv.textContent = text;
  box.style.display = 'block';
  box.scrollIntoView({ behavior: 'smooth' });
}

async function restartTournament() {
  if (!confirm('Are you sure you want to restart the tournament? All match data will be deleted.')) {
    return;
  }
  
  try {
    const res = await fetch(`${baseURL}/tournament/restart`, {
      method: 'POST',
      headers: authHeaders()
    });
    
    const data = await res.json();
    
    if (res.ok) {
      alert('Tournament reset to Quarterfinals');
      await loadTournamentStatus();
      await loadMatches();
      await loadLeaderboard();
    } else {
      alert(data.error || 'Failed to restart tournament');
    }
  } catch (err) {
    alert('Error: ' + err.message);
  }
}

// little pop animation
const style = document.createElement('style');
style.textContent = `@keyframes pop { 0%{ transform:scale(.9);} 60%{ transform:scale(1.06);} 100%{ transform:scale(1);} }`;
document.head.appendChild(style);
