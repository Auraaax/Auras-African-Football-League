# Aura's African Football League (AAFL)

A full-stack prototype platform for managing African football federations, teams, and a knockout tournament. Includes secure federation self‑registration, admin match simulation with AI/fallback commentary, and progressive tournament bracket visualization (Quarterfinals → Semifinals → Final → Champion).

---
## Features
- Federation Registration (password hashed with bcrypt)
- Role-based Login (administrator, federation, visitor passwordless)
- JWT Authentication (12h expiry)
- Knockout Tournament Engine (auto progression of winners)
- Match Simulation:
  - Quick simulate (random scores + penalties if draw)
  - Play with commentary (OpenAI if API key supplied, otherwise fallback generator)
- Leaderboard (aggregate results across simulated matches)
- Administrator Dashboard (stats, teams, matches, bracket, deletion)
- Dynamic Bracket Rendering (completed vs pending matches clearly separated)
- Email Notification Hook (nodemailer integration placeholder)
- Secure Password Storage (bcryptjs)
- Modular Services (tournamentService, emailService)

---
## Tech Stack
| Layer      | Technology |
|------------|------------|
| Frontend   | HTML, CSS, Vanilla JS |
| Backend    | Node.js, Express.js |
| Database   | MongoDB Atlas (Mongoose ODM) |
| Auth       | JWT + bcrypt password hashing |
| Email      | Nodemailer (optional) |
| AI Commentary | OpenAI API (optional) |

---
## Repository Structure
```
Index.html/            # Repo root (frontend + server folder)
  index.html           # Landing page
  register.html/.css/.js
  login.html/.css/.js
  admin_home.html/.css/.js
  federation_home.html/.css/.js
  visitor_home.html/.css/.js
  style.css, script.js # Global/home assets
  server/              # Backend source
    server.js          # Express entrypoint
    routes/            # admin, auth, federation, visitor routes
    models/            # Mongoose models (User, Team, Match, etc.)
    services/          # Tournament + email services
    seed.js            # Database seeding (admin + initial teams)
    .env               # Environment variables (NOT committed)
```

> NOTE: The git repository root is the `Index.html` folder (historical naming). Consider renaming to `aafl-app/` for production clarity.

---
## Environment Variables (`server/.env`)
| Variable        | Required | Description |
|-----------------|----------|-------------|
| `MONGODB_URI`   | Yes      | MongoDB connection string |
| `JWT_SECRET`    | Yes      | Secret for signing JWT tokens |
| `OPENAI_API_KEY`| No       | Enables AI match commentary |
| `EMAIL_USER`    | No       | SMTP user for nodemailer |
| `EMAIL_PASS`    | No       | SMTP password for nodemailer |

Example:
```
MONGODB_URI=mongodb+srv://user:pass@cluster-url/dbname
JWT_SECRET=super_secret_string
OPENAI_API_KEY=sk-xxx
EMAIL_USER=example@gmail.com
EMAIL_PASS=app-specific-password
```

---
## Setup & Installation
```bash
# Clone repository
git clone https://github.com/Auraaax/Auras-African-Football-League.git
cd Auras-African-Football-League/Index.html

# Install backend dependencies
npm install --prefix server

# (Optional) Install root-level deps if any
npm install

# Create environment file
cp server/.env.example server/.env
# Edit server/.env with real values

# Seed database (creates admin + initial teams, skips federation demos)
npm run seed --prefix server

# Start server
npm start --prefix server
# Server runs on http://localhost:3002
```
Open frontend pages directly via http://localhost:3002/ e.g. `/login.html`, `/register.html`.

---
## Auth Flow
### Registration (Federation)
POST `/api/auth/register`
Payload:
```
{
  "federationName": "Ghana Football Federation",
  "country": "Ghana",
  "contactPerson": "Ama Kusi",
  "email": "federation@example.com",
  "password": "StrongPass1!"
}
```
Response: `201 Created` with `token` + `user` object.

### Login
POST `/api/auth/login`
- visitor: `{ "role":"visitor", "email":"optional", "name":"Fan" }`
- federation/admin: `{ "email":"...", "password":"...", "role":"federation" }`

Response: `200 OK` with `token` + `user`.

### Token Usage
Attach token to protected endpoints (future expansion) via header:
`Authorization: Bearer <token>`

---
## Tournament Progression
Knockout bracket logic (single elimination):
1. Needs 8 teams to start Quarterfinals.
2. Quarterfinal winners → 2 Semifinal matches.
3. Semifinal winners → Final.
4. Final winner → Champion banner + Restart enabled.

Endpoints:
- `GET /api/admin/tournament/status` – overall stage & counts
- `GET /api/admin/tournament/quarterfinals` – mixed pending/played QF pairings
- `GET /api/admin/tournament/semifinals` – pending/played SF slots
- `GET /api/admin/tournament/final` – pending or completed final pairing
- `POST /api/admin/tournament/play-match` – AI/fallback simulation with commentary
- `POST /api/admin/tournament/simulate-match` – quick simulation
- `POST /api/admin/tournament/restart` – clear matches (only used after champion)
- `GET /api/admin/tournament/matches/:round` – list matches per round

Match Object (simplified):
```
{
  id, teamA, teamB,
  scoreA, scoreB,
  goals:[{ scorer, team, minute }],
  commentary, resultType,
  winner, round, date
}
```

---
## Seeding
`server/seed.js` creates:
- Administrator user (email: admin@aurafootball.com / password: admin123)
- 7 initial teams (waiting for federation to add 8th)
- Skips federation demo accounts (production-safe)

Run again ONLY if you want a clean slate:
```bash
npm run seed --prefix server
```
(Warning: This wipes existing users & teams.)

---
## Deployment (Vercel)
Since frontend & backend live together, you can:
1. Move `server/` to repo root (optional refactor), OR
2. Configure Vercel to use a custom build & start:
   - Build Command: `npm install --prefix server`
   - Output: (None, run as serverless/Node server)
   - Start Command (Development): `npm start --prefix server`

For a production API, consider:
- Converting to serverless functions (split routes) OR
- Deploying backend separately (Render/Heroku) and pointing frontend to API base URL.

Set Environment Variables in Vercel dashboard matching `.env`.

---
## Security & Hardening
- Bcrypt password hashing (salt rounds = 10)
- JWT expiration (12 hours) – consider refresh tokens for long sessions
- Validation present on registration; can extend with stricter complexity checks
- No federation accounts seeded—must self-register
- Recommend enabling HTTPS & setting `SameSite` attributes when converting token to cookie-based auth

Future Improvements:
- Rate limiting (express-rate-limit) for auth endpoints
- Email verification & password reset flows
- Centralized error format & logging (winston/pino)
- Role-based authorization middleware

---
## Development Scripts
| Script | Command | Description |
|--------|---------|-------------|
| Start  | `npm start --prefix server` | Run production server locally |
| Dev    | `npm run dev --prefix server` | Nodemon auto-restart during development |
| Seed   | `npm run seed --prefix server` | Reset & seed database |

---
## Troubleshooting
| Issue | Cause | Fix |
|-------|-------|-----|
| 404 on /api/auth/register | Server not running or wrong base URL | Start server, use `http://localhost:3002` |
| Login fails after registration | Mismatched password | Re-enter correct password (bcrypt hash stored) |
| Final doesn’t appear | Semifinals not both completed | Play remaining SF matches |
| Restart shows too early | Cached JS | Hard refresh (Cmd+Shift+R) |
| OpenAI errors | Missing/invalid API key | Set `OPENAI_API_KEY` or rely on fallback commentary |

---
## License
MIT © 2025 Aura's African Football League (Prototype)

---
## Contributing
1. Fork repo
2. Create feature branch: `git checkout -b feature/xyz`
3. Commit changes: `git commit -m "Add xyz"`
4. Push: `git push origin feature/xyz`
5. Open Pull Request

---
## Acknowledgements
- African football inspiration
- OpenAI for optional commentary generation
- MongoDB Atlas for managed database

Enjoy building the league! ⚽🌍
Aura’s African Football League
1. Introduction
The Aura’s African Football League system is a full-stack web application that simulates a continental football tournament for African federations. It allows each country to register its national team, manage its players, and participate in a simulated football competition managed by an administrator. The system also provides visitors with access to tournament information, statistics, and analytics.

This project was developed using Node.js, Express, MongoDB, and vanilla JavaScript, and deployed using Vercel.
2. Rationale
The rationale behind this system is to digitally represent and manage a football tournament structure that promotes fair participation among African federations while automating game simulation, analytics, and data presentation.

The system addresses the following key objectives:

Automation: Simulating matches without requiring manual intervention.

Accessibility: Allowing federations, administrators, and visitors to access the platform from anywhere.

Transparency: Presenting results, brackets, and analytics in real-time to all users.

Efficiency: Reducing administrative workload through AI-generated commentary and automated communication via email.

The project also demonstrates key information systems principles, including database design, user management, and system integration using AI and cloud services.
3. System Components
The system is divided into three main user roles, each with specific functionalities:

3.1 Federation Representative
- Registers a country to participate in the tournament.
- Inputs or auto-generates a list of 23 players.
- Assigns player positions (Goalkeeper, Defender, Midfielder, Attacker).
- Selects a team captain.
- The system auto-allocates player ratings using the following logic:
  - Natural position rating: 50–100
  - Other positions: 0–50
- The country’s rating is the average of its players’ natural position ratings.

3.2 Administrator
- Manages the overall tournament flow.
- Seeds seven pre-existing teams; the tournament only starts once the eighth team is registered.
- Can simulate or play matches (with AI-generated commentary).
- Automatically advances winners through Quarterfinals, Semifinals, and Finals.
- Sends email notifications to federations after every match.
- Can restart the tournament at any stage.

3.3 Visitor
- Can access public pages without logging in.
- Views tournament brackets, match summaries, and team analytics.
- Accesses top goal scorers, past winners, and match results.
- Can distinguish between “played” matches (with commentary) and “simulated” matches (score only).
4. System Architecture
Below is the high-level architecture diagram of the Aura’s African Football League System.

Client Layer (Browser - HTML, CSS, JS) → Application Layer (Node.js + Express Server - Handles routes and APIs, Controls user roles, Manages tournament flow) → Database Layer (MongoDB Atlas - Stores teams, players, matches, and results) → External Integrations (OpenAI API: AI commentary generation, Nodemailer: Sends email notifications)
5. System Components Overview
Component: Frontend (Public Folder) - HTML, CSS, and JavaScript files for Admin, Federation, and Visitor pages.
Backend (Server) - Node.js with Express for API handling, routing, and tournament logic.
Database (MongoDB Atlas) - Stores users, federations, players, match results, and tournament states.
AI Service (OpenAI API) - Generates text-based match commentary during “Play Mode”.
Email Service (Nodemailer) - Sends result notifications to federations after each match.
6. Installation and Setup
Step 1: Clone the Repository
```
git clone https://github.com/<your-username>/auras-african-football-league.git
cd auras-african-football-league
```
Step 2: Install Dependencies
```
npm install
```
Step 3: Environment Configuration
Create a .env file in the root directory and include:
```
PORT=3000
MONGODB_URI=mongodb+srv://<your-cluster>
AI_API_KEY=<your-openai-api-key>
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
```
Step 4: Seed the Database
```
node server/seed.js
```
Step 5: Run the Application
```
npm start
```
Access the system at: https://vercel.com/auraaaxs-projects/auras-african-football-league

7. Deployment
This project is deployed using Vercel.

Framework Preset:
Select “Other” when prompted, as the project uses a custom Node.js and Express backend.

vercel.json
```
{
  "version": 2,
  "builds": [
    { "src": "server.js", "use": "@vercel/node" },
    { "src": "public/**", "use": "@vercel/static" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "server.js" },
    { "src": "/(.*)", "dest": "/public/$1" }
  ]
}
```

8. How to Use the System
Federation Registration: Access /federation_home.html to register a new team and submit player information.
Administrator Actions: Access /admin_home.html to view registered teams and start the tournament once all eight are registered. Choose to “Play” or “Simulate” each match.
Visitor Access: Access /visitor_home.html to view the bracket, match details, and analytics.
Restarting the Tournament: Administrators can reset the tournament to begin from the Quarterfinal stage.
9. System Rationale and Benefits
Benefit: Scalability - MongoDB ensures scalability as new federations or tournaments are added.
Automation - Match commentary, scoring, and emails are fully automated.
Accessibility - Web-based interface allows easy access for all roles.
Transparency - Public access to match data promotes openness.
Innovation - AI integration for match commentary enhances realism.
10. Testing
Verify seven teams are seeded on initial launch.
Register an eighth team to enable tournament start.
Confirm correct match progression through Quarterfinal, Semifinal, and Final.
Check automatic email notifications after each match.
Confirm visitor pages display results and analytics correctly.
Test the tournament restart functionality.
<img width="468" height="642" alt="image" src="https://github.com/user-attachments/assets/da5cdab4-9d43-4c41-8117-ca25b9a26514" />
