import express from 'express';
import Federation from '../models/Federation.js';
import Player from '../models/Player.js';
import Team from '../models/Team.js';
import User from '../models/User.js';

const router = express.Router();

// African countries list
const AFRICAN_COUNTRIES = [
  'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cameroon', 
  'Cape Verde', 'Central African Republic', 'Chad', 'Comoros', 'Congo', 
  'Democratic Republic of Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 
  'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 
  'Guinea-Bissau', 'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 
  'Madagascar', 'Malawi', 'Mali', 'Mauritania', 'Mauritius', 'Morocco', 
  'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 'Sao Tome and Principe', 
  'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 'South Sudan', 
  'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
];

// African first names and last names for random generation
const AFRICAN_FIRST_NAMES = [
  'Kwame', 'Kofi', 'Yaw', 'Ade', 'Sekou', 'Mamadou', 'Ibrahim', 'Youssef',
  'Mohamed', 'Ahmed', 'Omar', 'Hassan', 'Abdel', 'Karim', 'Tariq', 'Rashid',
  'Chibueze', 'Oluwaseun', 'Adebayo', 'Chukwudi', 'Babatunde', 'Tunde', 'Emeka',
  'Nnamdi', 'Mandla', 'Thabo', 'Sipho', 'Bongani', 'Themba', 'Blessing', 'Lucky'
];

const AFRICAN_LAST_NAMES = [
  'Mensah', 'Osei', 'Diallo', 'Keita', 'Traoré', 'Camara', 'Touré', 'Kone',
  'Diop', 'Ndiaye', 'Sy', 'Fall', 'Sow', 'Barry', 'Bah', 'El-Sayed', 'Hassan',
  'Okafor', 'Okonkwo', 'Adeyemi', 'Eze', 'Nwosu', 'Mbatha', 'Dlamini', 'Khumalo',
  'Mokoena', 'Ndlovu', 'Zwane', 'Mkhize', 'Phiri', 'Banda'
];

// Helper: Generate random African player name
function generateRandomName() {
  const firstName = AFRICAN_FIRST_NAMES[Math.floor(Math.random() * AFRICAN_FIRST_NAMES.length)];
  const lastName = AFRICAN_LAST_NAMES[Math.floor(Math.random() * AFRICAN_LAST_NAMES.length)];
  return `${firstName} ${lastName}`;
}

// Helper: Generate player ratings based on natural position
function generatePlayerRatings(naturalPosition) {
  const ratings = { GK: 0, DF: 0, MD: 0, AT: 0 };
  
  ['GK', 'DF', 'MD', 'AT'].forEach(pos => {
    if (pos === naturalPosition) {
      // Natural position: 50-100
      ratings[pos] = Math.floor(Math.random() * 51) + 50;
    } else {
      // Other positions: 0-50
      ratings[pos] = Math.floor(Math.random() * 51);
    }
  });
  
  return ratings;
}

// Helper: Generate squad of 23 players with realistic position distribution
function generateSquad() {
  const positions = [
    // 3 Goalkeepers
    'GK', 'GK', 'GK',
    // 8 Defenders
    'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF', 'DF',
    // 7 Midfielders
    'MD', 'MD', 'MD', 'MD', 'MD', 'MD', 'MD',
    // 5 Attackers
    'AT', 'AT', 'AT', 'AT', 'AT'
  ];

  return positions.map((pos, index) => ({
    name: generateRandomName(),
    naturalPosition: pos,
    ratings: generatePlayerRatings(pos),
    isCaptain: index === 0 // First player is captain by default
  }));
}

// GET /api/federation/countries - Get list of African countries
router.get('/countries', (req, res) => {
  res.json({ countries: AFRICAN_COUNTRIES });
});

// GET /api/federation/check-registration - Check if federation user already registered
router.get('/check-registration', async (req, res) => {
  try {
    // Get user email from header or query (simplified - you'd use JWT in production)
    const userEmail = req.query.email;
    
    if (!userEmail) {
      return res.json({ registered: false });
    }

    const user = await User.findOne({ email: userEmail });
    if (!user) {
      return res.json({ registered: false });
    }

    const federation = await Federation.findOne({ representative: user.email });
    
    if (federation) {
      await federation.populate('players');
      return res.json({ 
        registered: true, 
        federation: {
          country: federation.country,
          manager: federation.manager,
          teamName: federation.teamName,
          countryRating: federation.countryRating,
          players: federation.players
        }
      });
    }

    res.json({ registered: false });
  } catch (err) {
    res.status(500).json({ error: 'Failed to check registration', details: err.message });
  }
});

// POST /api/federation/register - Register federation with country, manager, and 23 players
router.post('/register', async (req, res) => {
  try {
    const { country, representative, manager, teamName, players } = req.body;

    if (!country || !representative || !manager || !teamName) {
      return res.status(400).json({ error: 'Country, representative, manager, and team name are required' });
    }

    // Check if federation for this country already exists
    const existingFederation = await Federation.findOne({ country });
    if (existingFederation) {
      return res.status(400).json({ error: `Federation for ${country} is already registered` });
    }

    // Generate or use provided players
    const squadData = players && players.length === 23 ? players : generateSquad();

    // Create federation document
    const federation = new Federation({
      country,
      representative,
      manager,
      teamName,
      players: []
    });

    await federation.save();

    // Create player documents
    const playerDocs = await Promise.all(
      squadData.map(playerData => 
        Player.create({
          ...playerData,
          federation: federation._id
        })
      )
    );

    // Update federation with player IDs
    federation.players = playerDocs.map(p => p._id);
    await federation.calculateCountryRating();
    await federation.save();

    // Create corresponding Team entry for tournament
    const team = await Team.create({
      teamName,
      federation: country,
      createdBy: federation._id
    });

    // Populate for response
    await federation.populate('players');

    res.status(201).json({
      message: `Federation Registered Successfully: ${country} — Squad Ready for Tournament`,
      federation: {
        id: federation._id,
        country: federation.country,
        manager: federation.manager,
        teamName: federation.teamName,
        countryRating: federation.countryRating,
        players: federation.players,
        registeredAt: federation.registeredAt
      },
      team: {
        id: team._id,
        teamName: team.teamName,
        federation: team.federation
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Federation registration failed', details: err.message });
  }
});

// POST /api/federation/regenerate-squad - Generate new random squad
router.post('/regenerate-squad', (req, res) => {
  try {
    const squad = generateSquad();
    res.json({ squad });
  } catch (err) {
    res.status(500).json({ error: 'Squad generation failed', details: err.message });
  }
});

// GET /api/federation/my-federation - Get federation details for logged-in user
router.get('/my-federation', async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const federation = await Federation.findOne({ representative: email }).populate('players');
    
    if (!federation) {
      return res.status(404).json({ error: 'Federation not found' });
    }

    res.json({ federation });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch federation', details: err.message });
  }
});

export default router;
