const baseURL = '/api/visitor';

function setActiveTab(targetId){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById(targetId).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.querySelector(`.tab-btn[data-target="${targetId}"]`).classList.add('active');
}

function setupTabs(){
  document.querySelectorAll('.tab-btn').forEach(btn=>{
    btn.addEventListener('click', ()=> setActiveTab(btn.dataset.target));
  });
}

function confetti(){
  // lightweight confetti: paint emojis briefly
  const el = document.createElement('div');
  el.style.position='fixed'; el.style.inset='0'; el.style.pointerEvents='none'; el.style.zIndex='9999';
  for(let i=0;i<60;i++){
    const s=document.createElement('div');
    s.textContent='🎉'; s.style.position='absolute'; s.style.fontSize=(14+Math.random()*16)+'px';
    s.style.left=(Math.random()*100)+'%'; s.style.top='-10px';
    s.style.transition='transform 1.6s ease, opacity 1.6s ease';
    el.appendChild(s);
    setTimeout(()=>{ s.style.transform=`translateY(${window.innerHeight+30}px) rotate(${(Math.random()*360)|0}deg)`; s.style.opacity='0'; }, 20+i*8);
  }
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 2000);
}

// Bracket rendering
async function loadBracket(){
  const res = await fetch(`${baseURL}/bracket`);
  const data = await res.json();

  const statusBox = document.getElementById('bracketStatus');
  const championBanner = document.getElementById('championBanner');
  const grid = document.getElementById('bracketGrid');

  // Status
  let msg = '';
  if (data.status === 'waiting') msg = `⏳ Waiting for 8 registered teams. Current: ${data.teamCount}/8`;
  else if (data.status === 'ready') msg = '✅ All 8 teams registered. Tournament ready to begin!';
  else if (data.status === 'quarterfinals') msg = '🏃 Quarterfinals in progress';
  else if (data.status === 'semifinals') msg = '🏃 Semifinals in progress';
  else if (data.status === 'completed') msg = '🏁 Tournament Completed';
  statusBox.textContent = msg;

  // Champion
  if (data.champion){
    championBanner.innerHTML = `<div class="champion-banner fade-in"><h2>🏆 CHAMPION: ${data.champion}</h2><p>Aura’s African Football League</p></div>`;
    championBanner.style.display = 'block';
  } else {
    championBanner.style.display = 'none';
  }

  const roundBox = (title, items)=> `<div class="round-box"><h3>${title}</h3>${items.join('')}</div>`;
  const matchCard = (m)=> `
    <div class="match-card completed">
      <div class="match-teams">${m.teamA} vs ${m.teamB}</div>
      <div class="match-score">${m.scoreA} - ${m.scoreB}</div>
      <div class="match-meta">${new Date(m.date).toLocaleString()}${m.resultType && m.resultType!=='90min'?` • ${m.resultType}`:''}</div>
      <div class="match-winner">Winner: ${m.winner || 'TBD'}</div>
    </div>`;
  const pairingCard = (p, label)=> `
    <div class="match-card">
      <div class="match-teams">${label}: ${p.teamA.name} vs ${p.teamB.name}</div>
      <div class="match-meta">Pending</div>
    </div>`;

  const qf = [];
  if (data.rounds.Quarterfinal.matches.length){
    qf.push(...data.rounds.Quarterfinal.matches.map(matchCard));
  } else if (data.rounds.Quarterfinal.pairings.length){
    qf.push(...data.rounds.Quarterfinal.pairings.map((p,i)=> pairingCard(p, `QF${i+1}`)));
  } else {
    qf.push('<div class="info-box">Quarterfinal pairings will appear here once the tournament is ready.</div>');
  }

  const sf = [];
  if (data.rounds.Semifinal.matches.length){
    sf.push(...data.rounds.Semifinal.matches.map(matchCard));
  } else if (data.rounds.Semifinal.pairings.length){
    sf.push(...data.rounds.Semifinal.pairings.map((p,i)=> pairingCard(p, `SF${i+1}`)));
  } else {
    sf.push('<div class="info-box">Semifinal matchups appear after Quarterfinals are completed.</div>');
  }

  const fin = [];
  if (data.rounds.Final.matches.length){
    fin.push(...data.rounds.Final.matches.map(matchCard));
  } else if (data.rounds.Final.pairing){
    fin.push(pairingCard(data.rounds.Final.pairing, 'FINAL'));
  } else {
    fin.push('<div class="info-box">Final will appear after Semifinals are completed.</div>');
  }

  grid.innerHTML = [
    roundBox('Quarterfinals', qf),
    roundBox('Semifinals', sf),
    roundBox('Final', fin)
  ].join('');
}

// Matches
async function loadMatches(){
  const list = document.getElementById('matchesList');
  const res = await fetch(`${baseURL}/matches`);
  const matches = await res.json();
  if (!Array.isArray(matches)) return;
  list.innerHTML = matches.map(m => `
    <div class="card" onclick='showMatchDetails(${JSON.stringify({id:m.id}).replace(/"/g,"&quot;")})'>
      <button class="share-btn" onclick='shareMatch(event, ${JSON.stringify({id:m.id}).replace(/"/g,"&quot;")})'>Share</button>
      <div class="match-teams">${m.teamA} <span style="opacity:.6;">vs</span> ${m.teamB}</div>
      <div class="match-score">${m.scoreA} - ${m.scoreB}</div>
      <div class="match-meta">${new Date(m.date).toLocaleString()} • ${m.round}</div>
      ${m.commentary?'<div class="badge">Played</div>':'<div class="badge" style="background:#2a9d8f;">Simulated</div>'}
    </div>
  `).join('');
  // Preload first
  if (matches.length) showMatchDetails({id: matches[0].id});
}

async function showMatchDetails({id}){
  const box = document.getElementById('matchDetails');
  const res = await fetch(`${baseURL}/matches`);
  const matches = await res.json();
  const m = matches.find(x=>x.id===id);
  if (!m){ box.textContent = 'Match not found.'; return; }
  const goals = (m.goals||[]).map(g=>`⚽ ${g.scorer} ${g.minute}'`).join('<br>');
  if (m.commentary){
    box.innerHTML = `
      <div class="match-teams" style="font-size:1.1rem; font-weight:800;">${m.teamA} vs ${m.teamB}</div>
      <div class="match-score" style="margin:.25rem 0 1rem;">${m.scoreA} - ${m.scoreB} ${m.resultType&&m.resultType!=='90min'?`<span class="match-meta">(${m.resultType})</span>`:''}</div>
      ${goals?`<div class="info-box" style="background:#0b211c;">${goals}</div>`:''}
      <div class="info-box" style="white-space:pre-wrap;">${m.commentary}</div>
    `;
  } else {
    box.innerHTML = `
      <div class="match-teams" style="font-size:1.1rem; font-weight:800;">${m.teamA} vs ${m.teamB}</div>
      <div class="match-score" style="margin:.25rem 0 1rem;">${m.scoreA} - ${m.scoreB} ${m.resultType&&m.resultType!=='90min'?`<span class="match-meta">(${m.resultType})</span>`:''}</div>
      ${goals?`<div class="info-box" style="background:#0b211c;">${goals}</div>`:''}
      <div class="match-meta">This match was simulated.</div>
    `;
  }
}

function shareMatch(e, {id}){
  e.stopPropagation();
  const url = `${location.origin}${location.pathname}?match=${id}`;
  navigator.clipboard.writeText(url);
  const btn = e.currentTarget; const txt = btn.textContent; btn.textContent='Copied!'; setTimeout(()=> btn.textContent=txt, 1000);
}

// Scorers
let scorersData = [];
async function loadScorers(){
  const res = await fetch(`${baseURL}/top-scorers`);
  const { topScorers } = await res.json();
  scorersData = topScorers || [];
  const feds = Array.from(new Set(scorersData.map(s=>s.federation).filter(Boolean))).sort();
  const select = document.getElementById('filterFederation');
  select.innerHTML = '<option value="">All</option>' + feds.map(f=>`<option>${f}</option>`).join('');
  renderScorers();
}

function renderScorers(){
  const list = document.getElementById('scorersList');
  const fed = document.getElementById('filterFederation').value;
  const sortBy = document.getElementById('sortBy').value;
  let items = scorersData.slice();
  if (fed) items = items.filter(s=>s.federation===fed);
  if (sortBy==='name') items.sort((a,b)=> a.player.localeCompare(b.player));
  else if (sortBy==='team') items.sort((a,b)=> a.team.localeCompare(b.team));
  else items.sort((a,b)=> b.goals-a.goals);

  list.innerHTML = items.map((s,idx)=> `
    <div class="card scorer">
      <div class="scorer-name">${idx===0?`<span class='badge'>Top Scorer <span class='trophy'>🏆</span></span> `:''}${s.player}</div>
      <div class="match-meta">${s.team} • ${s.federation||'—'}</div>
      <div class="match-score" style="font-size:1rem;">${s.goals} goals</div>
    </div>
  `).join('');
}

// History
async function loadHistory(){
  const res = await fetch(`${baseURL}/history`);
  const items = await res.json();
  const list = document.getElementById('historyList');
  if (!Array.isArray(items) || items.length===0){
    list.innerHTML = '<div class="info-box">No past finals recorded yet.</div>';
    return;
  }
  list.innerHTML = items.map(h => `
    <div class="timeline-item">
      <div class="timeline-year">${h.year}</div>
      <div style="margin-top:.25rem; font-weight:700;">${h.finalistA} vs ${h.finalistB}</div>
      <div class="match-score" style="margin:.25rem 0;">${h.scoreline}</div>
      <div class="match-winner">Winner: ${h.winner || '—'}</div>
    </div>
  `).join('');
}

// Analytics
let winsChart, goalsChart;
async function loadAnalytics(){
  const res = await fetch(`${baseURL}/analytics`);
  const data = await res.json();
  const overview = document.getElementById('analyticsOverview');
  const avg = (data.overview?.averageGoalsPerMatch||0).toFixed(2);
  const topFed = data.overview?.federationWithMostWins;
  overview.innerHTML = `
    <div><strong>Total Matches:</strong> ${data.overview?.matches||0}</div>
    <div><strong>Avg Goals/Match:</strong> ${avg}</div>
    <div><strong>Top Federation:</strong> ${topFed? `${topFed.federation} (${topFed.wins} wins)` : '—'}</div>
  `;

  const labels = data.teams.map(t=>t.teamName);
  const wins = data.teams.map(t=>t.wins);
  const gf = data.teams.map(t=>t.goalsFor);
  const ga = data.teams.map(t=>t.goalsAgainst);

  const ctx1 = document.getElementById('winsChart').getContext('2d');
  const ctx2 = document.getElementById('goalsChart').getContext('2d');

  if (winsChart) winsChart.destroy();
  if (goalsChart) goalsChart.destroy();

  winsChart = new Chart(ctx1, {
    type: 'bar',
    data: { labels, datasets: [{ label: 'Wins', data: wins, backgroundColor: '#d4af37' }]},
    options: { responsive:true, plugins:{ legend:{ labels:{ color:'#fff' } } }, scales:{ x:{ ticks:{ color:'#fff' } }, y:{ ticks:{ color:'#fff' } } } }
  });

  goalsChart = new Chart(ctx2, {
    type: 'bar',
    data: { labels, datasets: [
      { label: 'Goals For', data: gf, backgroundColor:'#2a9d8f' },
      { label: 'Goals Against', data: ga, backgroundColor:'#e63946' }
    ]},
    options: { responsive:true, plugins:{ legend:{ labels:{ color:'#fff' } } }, scales:{ x:{ ticks:{ color:'#fff' } }, y:{ ticks:{ color:'#fff' } } } }
  });
}

window.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('filterFederation').addEventListener('change', renderScorers);
  document.getElementById('sortBy').addEventListener('change', renderScorers);

  setupAuthUI();

  await loadBracket();
  await loadMatches();
  await loadScorers();
  await loadHistory();
  await loadAnalytics();

  // If share link has match param
  const params = new URLSearchParams(location.search);
  if (params.get('match')) {
    showMatchDetails({id: params.get('match')});
    setActiveTab('matches');
  }
});

// ---------- Auth (Visitor / Demo) ----------
function setupAuthUI(){
  const openBtn = document.getElementById('openLogin');
  const modal = document.getElementById('loginModal');
  const cancelBtn = document.getElementById('cancelLogin');
  const form = document.getElementById('loginForm');
  const roleSelect = document.getElementById('loginRole');
  const passwordRow = document.getElementById('passwordRow');
  const signOutBtn = document.getElementById('signOut');

  updateAuthStatus();

  openBtn.addEventListener('click', ()=> { 
    modal.style.display='flex';
    // default visitor for passwordless convenience
    if (roleSelect && !roleSelect.value) {
      roleSelect.value = 'visitor';
    }
    if (roleSelect.value === 'visitor') passwordRow.style.display='none'; else passwordRow.style.display='block';
  });
  cancelBtn.addEventListener('click', ()=> { modal.style.display='none'; });
  roleSelect.addEventListener('change', ()=> {
    if (roleSelect.value === 'visitor') passwordRow.style.display='none'; else passwordRow.style.display='block';
  });
  form.addEventListener('submit', handleLogin);
  form.addEventListener('keyup', (e)=> {
    if (e.key === 'Enter') {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  // Unified logout handler with storage sweep & visual feedback
  const handleLogout = () => {
    console.log('[LOGOUT] Sign out button clicked');
    console.log('[LOGOUT] Before clear - authToken:', localStorage.getItem('authToken'));
    console.log('[LOGOUT] Before clear - currentUser:', localStorage.getItem('currentUser'));
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    
    console.log('[LOGOUT] After clear - authToken:', localStorage.getItem('authToken'));
    console.log('[LOGOUT] After clear - currentUser:', localStorage.getItem('currentUser'));
    
    // Immediate UI update
    signOutBtn.textContent = 'Signing out...';
    signOutBtn.style.display = 'none';
    openBtn.style.display = 'inline-block';
    statusEl.textContent = 'You are browsing as Guest';
    
    // Final update after brief delay
    setTimeout(()=> {
      signOutBtn.textContent = 'Sign out';
      console.log('[LOGOUT] Auth status updated');
    }, 150);
  };
  
  if (signOutBtn) {
    signOutBtn.addEventListener('click', handleLogout);
    console.log('[AUTH] Sign out button listener attached');
  } else {
    console.error('[AUTH] Sign out button not found!');
  }
}

function updateAuthStatus(){
  const statusEl = document.getElementById('authStatus');
  const signOutBtn = document.getElementById('signOut');
  const openBtn = document.getElementById('openLogin');
  const userJSON = localStorage.getItem('currentUser');
  
  console.log('[AUTH STATUS] Checking auth status...');
  console.log('[AUTH STATUS] currentUser in localStorage:', userJSON);
  
  if (!userJSON){
    console.log('[AUTH STATUS] No user found - showing guest mode');
    statusEl.textContent = 'You are browsing as Guest';
    openBtn.style.display='inline-block';
    signOutBtn.style.display='none';
    return;
  }
  const user = JSON.parse(userJSON);
  console.log('[AUTH STATUS] User found:', user);
  statusEl.textContent = `Signed in as ${user.name} (${user.role})`;
  openBtn.style.display='none';
  signOutBtn.style.display='inline-block';
}

async function handleLogin(e){
  e.preventDefault();
  console.log('[LOGIN] Form submitted');
  
  const email = document.getElementById('loginEmail').value.trim();
  const name = document.getElementById('loginName').value.trim() || 'Visitor';
  const role = document.getElementById('loginRole').value;
  const password = document.getElementById('loginPassword').value.trim();

  console.log('[LOGIN] Attempting login with role:', role);

  const payload = role === 'visitor'
    ? { email, name, role }
    : { email, password, role };

  try {
    const res = await fetch('/api/auth/login', {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok){
      console.error('[LOGIN] Login failed:', data.error);
      alert(data.error || 'Login failed');
      return;
    }
    
    console.log('[LOGIN] Login successful:', data.user);
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    console.log('[LOGIN] Tokens stored in localStorage');
    
    document.getElementById('loginModal').style.display='none';
    updateAuthStatus();
  } catch(err){
    console.error('[LOGIN] Login error:', err);
    alert('Login error: '+ err.message);
  }
}
