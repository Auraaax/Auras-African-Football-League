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
    const championBanner = document.getElementById('championBanner');
    
    // Update status message
    statusDiv.innerHTML = `<p style="color:${status.canStart ? '#2a9d8f' : '#e63946'};">${status.message}</p>`;
    
    // Show registered teams
    if (status.teams && status.teams.length > 0) {
      const teamsListHTML = `
        <div style="margin-top:1rem;">
          <h4>Registered Teams (${status.teamCount}/8):</h4>
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:.5rem;margin-top:.5rem;">
            ${status.teams.map(t => `
              <div style="padding:.5rem;background:rgba(42,157,143,.1);border-radius:8px;border-left:4px solid #2a9d8f;">
                ⚽ ${t.name}
              </div>
            `).join('')}
          </div>
        </div>
      `;
      statusDiv.innerHTML += teamsListHTML;
    }
    
    // Show champion banner if tournament complete
    if (status.status === 'completed') {
      const finalMatch = await fetch(`${baseURL}/tournament/matches/Final`).then(r => r.json());
      if (finalMatch && finalMatch.length > 0 && finalMatch[0].winner) {
        championBanner.innerHTML = `
          <div style="background:linear-gradient(135deg,#d4af37,#ffd700);color:#000;padding:2rem;border-radius:12px;text-align:center;margin-bottom:2rem;box-shadow:0 8px 24px rgba(212,175,55,.4);">
            <h1 style="font-size:2.5rem;margin:0;text-shadow:2px 2px 4px rgba(0,0,0,.2);">
              🏆 CHAMPION: ${finalMatch[0].winner} 🏆
            </h1>
            <p style="margin:.5rem 0 0;font-size:1.2rem;opacity:.9;">
              Aura's African Football League Champion
            </p>
          </div>
        `;
        championBanner.style.display = 'block';
        confetti();
      }
    } else {
      championBanner.style.display = 'none';
    }
    
    // Load bracket based on tournament stage
    if (status.canStart || status.quarterfinalsPlayed > 0) {
      await loadBracket(status);
    }
    
  } catch (err) {
    console.error('Failed to load tournament status:', err);
  }
}

async function loadBracket(status) {
  const bracketContainer = document.getElementById('tournamentBracket');
  if (!bracketContainer) return;
  
  let html = '<div class="bracket-container">';
  
  // Quarterfinals
  html += '<div class="bracket-round"><h3>Quarterfinals</h3>';
  html += await getRoundHTML('Quarterfinal', status.quarterfinalsPlayed);
  html += '</div>';
  
  // Semifinals (only show if quarterfinals complete)
  if (status.quarterfinalsPlayed === 4) {
    html += '<div class="bracket-round"><h3>Semifinals</h3>';
    html += await getRoundHTML('Semifinal', status.semifinalsPlayed);
    html += '</div>';
  }
  
  // Final (only show if semifinals complete)
  if (status.semifinalsPlayed === 2) {
    html += '<div class="bracket-round"><h3>Final</h3>';
    html += await getRoundHTML('Final', status.finalPlayed);
    html += '</div>';
  }
  
  html += '</div>';
  bracketContainer.innerHTML = html;
}

async function getRoundHTML(round, playedCount) {
  try {
    const matchesRes = await fetch(`${baseURL}/tournament/matches/${round}`);
    const matches = await matchesRes.json();
    
    let html = '';
    
    if (matches.length > 0) {
      // Display completed matches
      matches.forEach(m => {
        html += `
          <div class="bracket-match completed">
            <div class="match-teams">${m.teamA} vs ${m.teamB}</div>
            <div class="match-score">${m.scoreA} - ${m.scoreB}</div>
            <div class="match-winner">Winner: <strong>${m.winner}</strong></div>
            ${m.resultType !== '90min' ? `<div style="font-size:.85rem;color:#aaa;">(${m.resultType})</div>` : ''}
            ${m.goals && m.goals.length > 0 ? `
              <div class="match-goals">
                ${m.goals.map(g => `⚽ ${g.scorer} ${g.minute}'`).join('<br>')}
              </div>
            ` : ''}
            ${m.commentary ? `
              <button class="primary" style="margin-top:.5rem;width:100%;font-size:.85rem;" 
                      onclick="showCommentary(\`${m.commentary.replace(/`/g, '\\`')}\`)">
                View Commentary
              </button>
            ` : ''}
          </div>
        `;
      });
      
      return html;
    }
    
    // Show pairings with action buttons
    if (round === 'Quarterfinal') {
      const pairingsRes = await fetch(`${baseURL}/tournament/quarterfinals`);
      const pairings = await pairingsRes.json();
      
      pairings.forEach((p, idx) => {
        html += `
          <div class="bracket-match pending">
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
        `;
      });
    } else if (round === 'Semifinal') {
      const pairingsRes = await fetch(`${baseURL}/tournament/semifinals`);
      const pairings = await pairingsRes.json();
      
      pairings.forEach((p, idx) => {
        html += `
          <div class="bracket-match pending">
            <div class="match-teams">SF${idx + 1}: ${p.teamA.teamName} vs ${p.teamB.teamName}</div>
            <div class="match-actions">
              <button class="play-btn" onclick="playMatch('${p.teamA._id}', '${p.teamB._id}', 'Semifinal')">
                🎮 Play
              </button>
              <button class="sim-btn" onclick="quickSimulate('${p.teamA._id}', '${p.teamB._id}', 'Semifinal')">
                ⚡ Simulate
              </button>
            </div>
          </div>
        `;
      });
    } else if (round === 'Final') {
      const pairingRes = await fetch(`${baseURL}/tournament/final`);
      const pairing = await pairingRes.json();
      
      html += `
        <div class="bracket-match pending final-match">
          <div class="match-teams">🏆 FINAL: ${pairing.teamA.teamName} vs ${pairing.teamB.teamName}</div>
          <div class="match-actions">
            <button class="play-btn" onclick="playMatch('${pairing.teamA._id}', '${pairing.teamB._id}', 'Final')">
              🎮 Play Final
            </button>
            <button class="sim-btn" onclick="quickSimulate('${pairing.teamA._id}', '${pairing.teamB._id}', 'Final')">
              ⚡ Simulate Final
            </button>
          </div>
        </div>
      `;
    }
    
    return html;
  } catch (err) {
    console.error(`Failed to load ${round}:`, err);
    return `<p style="text-align:center;color:#e63946;">Error loading ${round}</p>`;
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
