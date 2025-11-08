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
