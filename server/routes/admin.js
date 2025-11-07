import express from 'express';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { playMatchWithCommentary, simulateQuickMatch, createQuarterfinalPairings } from '../services/tournamentService.js';
import { sendMatchResultEmail } from '../services/emailService.js';

const router = express.Router();

// Middleware to mock authentication (replace with real JWT verification)
router.use(async (req, res, next) => {
  // In production decode JWT and fetch user. Here we just pick first admin.
  const admin = await User.findOne({ role: 'administrator' });
  req.adminUser = admin || { name: 'Administrator', _id: null };
  next();
});

// GET dashboard stats
router.get('/dashboard', async (req, res) => {
  try {
    const federationCount = await User.countDocuments({ role: 'federation' });
    const teamCount = await Team.countDocuments();
    const matchCount = await Match.countDocuments();
    res.json({
      adminName: req.adminUser?.name || 'Administrator',
      federationCount,
      teamCount,
      matchCount
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load dashboard', details: err.message });
  }
});

// GET teams list for dropdowns
router.get('/teams', async (req, res) => {
  try {
    const teams = await Team.find().sort({ teamName: 1 });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load teams', details: err.message });
  }
});

// POST simulate match
router.post('/simulate-match', async (req, res) => {
  try {
    const { teamA, teamB } = req.body;
    if (!teamA || !teamB || teamA === teamB) {
      return res.status(400).json({ error: 'Choose two different teams' });
    }

    const scoreA = Math.floor(Math.random() * 5);
    const scoreB = Math.floor(Math.random() * 5);

    const match = await Match.create({
      teamA: new mongoose.Types.ObjectId(teamA),
      teamB: new mongoose.Types.ObjectId(teamB),
      scoreA,
      scoreB,
      simulatedBy: req.adminUser?._id || null
    });

    const populated = await match.populate(['teamA', 'teamB']);

    res.json({
      message: 'Match simulated',
      match: {
        id: match._id,
        teamA: populated.teamA.teamName,
        teamB: populated.teamB.teamName,
        scoreA,
        scoreB,
        date: match.date
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to simulate match', details: err.message });
  }
});

// GET match history
router.get('/matches', async (req, res) => {
  try {
    const matches = await Match.find().populate(['teamA', 'teamB']).sort({ date: -1 }).limit(100);
    res.json(matches.map(m => ({
      id: m._id,
      teamA: m.teamA?.teamName || 'Unknown',
      teamB: m.teamB?.teamName || 'Unknown',
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      date: m.date
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load matches', details: err.message });
  }
});

// GET leaderboard (wins/losses)
router.get('/leaderboard', async (req, res) => {
  try {
    const matches = await Match.find().populate(['teamA', 'teamB']);
    const table = new Map();

    const ensure = (teamName) => {
      if (!table.has(teamName)) {
        table.set(teamName, { teamName, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 });
      }
      return table.get(teamName);
    };

    for (const m of matches) {
      const a = ensure(m.teamA?.teamName || 'Unknown');
      const b = ensure(m.teamB?.teamName || 'Unknown');
      a.played++; b.played++;
      a.goalsFor += m.scoreA; a.goalsAgainst += m.scoreB;
      b.goalsFor += m.scoreB; b.goalsAgainst += m.scoreA;
      if (m.scoreA === m.scoreB) { a.draws++; b.draws++; a.points += 1; b.points += 1; }
      else if (m.scoreA > m.scoreB) { a.wins++; b.losses++; a.points += 3; }
      else { b.wins++; a.losses++; b.points += 3; }
    }

    const leaderboard = Array.from(table.values())
      .sort((x, y) => y.points - x.points || (y.goalsFor - y.goalsAgainst) - (x.goalsFor - x.goalsAgainst));

    res.json(leaderboard);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load leaderboard', details: err.message });
  }
});

// GET tournament status - check if ready to start
router.get('/tournament/status', async (req, res) => {
  try {
    const teamCount = await Team.countDocuments();
    const quarterfinalsPlayed = await Match.countDocuments({ round: 'Quarterfinal' });
    const semifinalsPlayed = await Match.countDocuments({ round: 'Semifinal' });
    const finalPlayed = await Match.countDocuments({ round: 'Final' });

    res.json({
      teamCount,
      canStart: teamCount >= 8,
      quarterfinalsPlayed,
      semifinalsPlayed,
      finalPlayed,
      status: finalPlayed > 0 ? 'completed' : semifinalsPlayed > 0 ? 'semifinals' : quarterfinalsPlayed > 0 ? 'quarterfinals' : 'not_started'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to get tournament status', details: err.message });
  }
});

// GET quarterfinal pairings
router.get('/tournament/quarterfinals', async (req, res) => {
  try {
    const teams = await Team.find().limit(8);
    if (teams.length < 8) {
      return res.status(400).json({ error: 'Need 8 teams to create quarterfinals' });
    }

    const pairings = createQuarterfinalPairings(teams);
    res.json(pairings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create pairings', details: err.message });
  }
});

// POST play match with AI commentary
router.post('/tournament/play-match', async (req, res) => {
  try {
    const { teamAId, teamBId, round } = req.body;
    
    const teamA = await Team.findById(teamAId);
    const teamB = await Team.findById(teamBId);
    
    if (!teamA || !teamB) {
      return res.status(404).json({ error: 'Teams not found' });
    }

    // Generate match with AI commentary
    const result = await playMatchWithCommentary(teamA, teamB);

    // Determine winner ID
    let winnerId = null;
    if (result.winner === 'teamA') winnerId = teamA._id;
    else if (result.winner === 'teamB') winnerId = teamB._id;

    // Save match to database
    const match = await Match.create({
      teamA: teamA._id,
      teamB: teamB._id,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      goals: result.goals,
      commentary: result.commentary,
      resultType: result.resultType,
      winner: winnerId,
      round: round || 'Quarterfinal',
      simulatedBy: req.adminUser?._id
    });

    // Get federation emails
    const federations = await User.find({ role: 'federation' });
    const emails = federations.map(f => f.email);

    // Send email notifications
    if (emails.length > 0) {
      await sendMatchResultEmail(emails, {
        teamA: teamA.teamName,
        teamB: teamB.teamName,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        goals: result.goals,
        winner: result.winner === 'teamA' ? teamA.teamName : result.winner === 'teamB' ? teamB.teamName : 'Draw',
        commentary: result.commentary,
        resultType: result.resultType
      });
    }

    res.json({
      match: {
        id: match._id,
        teamA: teamA.teamName,
        teamB: teamB.teamName,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        goals: result.goals,
        commentary: result.commentary,
        resultType: result.resultType,
        winner: result.winner === 'teamA' ? teamA.teamName : result.winner === 'teamB' ? teamB.teamName : 'Draw',
        round
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to play match', details: err.message });
  }
});

// POST simulate match quickly (no commentary)
router.post('/tournament/simulate-match', async (req, res) => {
  try {
    const { teamAId, teamBId, round } = req.body;
    
    const teamA = await Team.findById(teamAId);
    const teamB = await Team.findById(teamBId);
    
    if (!teamA || !teamB) {
      return res.status(404).json({ error: 'Teams not found' });
    }

    const result = simulateQuickMatch(teamA, teamB);

    let winnerId = null;
    if (result.winner === 'teamA') winnerId = teamA._id;
    else if (result.winner === 'teamB') winnerId = teamB._id;

    const match = await Match.create({
      teamA: teamA._id,
      teamB: teamB._id,
      scoreA: result.scoreA,
      scoreB: result.scoreB,
      goals: result.goals,
      resultType: result.resultType,
      winner: winnerId,
      round: round || 'Quarterfinal',
      simulatedBy: req.adminUser?._id
    });

    // Send email notifications
    const federations = await User.find({ role: 'federation' });
    const emails = federations.map(f => f.email);
    
    if (emails.length > 0) {
      await sendMatchResultEmail(emails, {
        teamA: teamA.teamName,
        teamB: teamB.teamName,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        goals: result.goals,
        winner: result.winner === 'teamA' ? teamA.teamName : result.winner === 'teamB' ? teamB.teamName : 'Draw',
        commentary: null,
        resultType: result.resultType
      });
    }

    res.json({
      match: {
        id: match._id,
        teamA: teamA.teamName,
        teamB: teamB.teamName,
        scoreA: result.scoreA,
        scoreB: result.scoreB,
        goals: result.goals,
        resultType: result.resultType,
        winner: result.winner === 'teamA' ? teamA.teamName : result.winner === 'teamB' ? teamB.teamName : 'Draw',
        round
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to simulate match', details: err.message });
  }
});

// POST restart tournament
router.post('/tournament/restart', async (req, res) => {
  try {
    // Delete all tournament matches
    await Match.deleteMany({});
    
    res.json({ 
      message: 'Tournament reset to Quarterfinals',
      success: true 
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restart tournament', details: err.message });
  }
});

// GET tournament matches by round
router.get('/tournament/matches/:round', async (req, res) => {
  try {
    const { round } = req.params;
    const matches = await Match.find({ round }).populate(['teamA', 'teamB', 'winner']).sort({ date: 1 });
    
    res.json(matches.map(m => ({
      id: m._id,
      teamA: m.teamA?.teamName || 'Unknown',
      teamB: m.teamB?.teamName || 'Unknown',
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      goals: m.goals,
      commentary: m.commentary,
      resultType: m.resultType,
      winner: m.winner?.teamName || 'Draw',
      round: m.round,
      date: m.date
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load matches', details: err.message });
  }
});

export default router;
