import express from 'express';
import Team from '../models/Team.js';
import Match from '../models/Match.js';
import { createQuarterfinalPairings } from '../services/tournamentService.js';

const router = express.Router();

// Helper to format match for public
function formatMatch(m) {
  return {
    id: m._id,
    teamA: m.teamA?.teamName || 'Unknown',
    teamB: m.teamB?.teamName || 'Unknown',
    teamAFederation: m.teamA?.federation || '',
    teamBFederation: m.teamB?.federation || '',
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    goals: m.goals || [],
    commentary: m.commentary || null,
    resultType: m.resultType || '90min',
    winner: m.winner?.teamName || null,
    round: m.round,
    date: m.date
  };
}

// GET /api/visitor/bracket
router.get('/bracket', async (req, res) => {
  try {
    const teamCount = await Team.countDocuments();
    const teams = await Team.find().sort({ teamName: 1 });

    // Completed matches
    const qfMatches = await Match.find({ round: 'Quarterfinal' }).populate(['teamA','teamB','winner']).sort({ date: 1 });
    const sfMatches = await Match.find({ round: 'Semifinal' }).populate(['teamA','teamB','winner']).sort({ date: 1 });
    const finalMatches = await Match.find({ round: 'Final' }).populate(['teamA','teamB','winner']).sort({ date: 1 });

    // Build upcoming pairings if needed
    let qfPairings = [];
    if (qfMatches.length === 0 && teamCount >= 8) {
      qfPairings = createQuarterfinalPairings(teams.slice(0, 8)).map(p => ({
        teamA: { id: p.teamA._id, name: p.teamA.teamName, federation: p.teamA.federation },
        teamB: { id: p.teamB._id, name: p.teamB.teamName, federation: p.teamB.federation }
      }));
    }

    let sfPairings = [];
    if (qfMatches.length === 4 && sfMatches.length === 0 && qfMatches.every(m => m.winner)) {
      sfPairings = [
        { teamA: qfMatches[0].winner, teamB: qfMatches[1].winner },
        { teamA: qfMatches[2].winner, teamB: qfMatches[3].winner }
      ].map(p => ({
        teamA: { id: p.teamA._id, name: p.teamA.teamName, federation: p.teamA.federation },
        teamB: { id: p.teamB._id, name: p.teamB.teamName, federation: p.teamB.federation }
      }));
    }

    let finalPairing = null;
    if (sfMatches.length === 2 && finalMatches.length === 0 && sfMatches.every(m => m.winner)) {
      finalPairing = {
        teamA: { id: sfMatches[0].winner._id, name: sfMatches[0].winner.teamName, federation: sfMatches[0].winner.federation },
        teamB: { id: sfMatches[1].winner._id, name: sfMatches[1].winner.teamName, federation: sfMatches[1].winner.federation }
      };
    }

    const status = finalMatches.length > 0 ? 'completed' : (sfMatches.length > 0 ? 'semifinals' : (qfMatches.length > 0 ? 'quarterfinals' : (teamCount >= 8 ? 'ready' : 'waiting')));

    const champion = finalMatches.length > 0 && finalMatches[0].winner ? finalMatches[0].winner.teamName : null;

    res.json({
      status,
      teamCount,
      champion,
      rounds: {
        Quarterfinal: {
          matches: qfMatches.map(formatMatch),
          pairings: qfPairings
        },
        Semifinal: {
          matches: sfMatches.map(formatMatch),
          pairings: sfPairings
        },
        Final: {
          matches: finalMatches.map(formatMatch),
          pairing: finalPairing
        }
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load bracket', details: err.message });
  }
});

// GET /api/visitor/matches - all matches with details
router.get('/matches', async (req, res) => {
  try {
    const matches = await Match.find().populate(['teamA','teamB','winner']).sort({ date: -1 });
    res.json(matches.map(m => ({ ...formatMatch(m), played: !!m.commentary })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load matches', details: err.message });
  }
});

// GET /api/visitor/top-scorers - aggregate by scorer name from goals
router.get('/top-scorers', async (req, res) => {
  try {
    const matches = await Match.find().populate(['teamA','teamB']);
    const map = new Map();

    for (const m of matches) {
      for (const g of (m.goals || [])) {
        const key = g.scorer.trim();
        const team = g.team === 'A' ? m.teamA : m.teamB;
        const entry = map.get(key) || { player: key, goals: 0, team: team?.teamName || 'Unknown', federation: team?.federation || '' };
        entry.goals += 1;
        // Update team/federation if empty
        entry.team = team?.teamName || entry.team;
        entry.federation = team?.federation || entry.federation;
        map.set(key, entry);
      }
    }

    const scorers = Array.from(map.values()).sort((a,b) => b.goals - a.goals);
    res.json({ topScorers: scorers, count: scorers.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load top scorers', details: err.message });
  }
});

// GET /api/visitor/history - past finals from Match collection
router.get('/history', async (req, res) => {
  try {
    const finals = await Match.find({ round: 'Final' }).populate(['teamA','teamB','winner']).sort({ date: -1 });
    const history = finals.map(f => ({
      year: new Date(f.date).getFullYear(),
      finalistA: f.teamA?.teamName || 'Unknown',
      finalistB: f.teamB?.teamName || 'Unknown',
      federationA: f.teamA?.federation || '',
      federationB: f.teamB?.federation || '',
      scoreline: `${f.scoreA} - ${f.scoreB}${f.resultType && f.resultType !== '90min' ? ` (${f.resultType})` : ''}`,
      winner: f.winner?.teamName || null
    }));
    res.json(history);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load history', details: err.message });
  }
});

// GET /api/visitor/analytics - team performance and overview
router.get('/analytics', async (req, res) => {
  try {
    const matches = await Match.find().populate(['teamA','teamB','winner']).sort({ date: 1 });

    const teamStats = new Map();
    const ensure = (team) => {
      const key = team?._id?.toString();
      if (!key) return null;
      if (!teamStats.has(key)) {
        teamStats.set(key, {
          teamId: key,
          teamName: team.teamName,
          federation: team.federation || '',
          played: 0, wins: 0, losses: 0, draws90: 0,
          goalsFor: 0, goalsAgainst: 0
        });
      }
      return teamStats.get(key);
    };

    const federationWins = new Map();

    let totalGoals = 0;

    for (const m of matches) {
      const a = ensure(m.teamA);
      const b = ensure(m.teamB);
      if (!a || !b) continue;

      a.played++; b.played++;
      a.goalsFor += m.scoreA; a.goalsAgainst += m.scoreB;
      b.goalsFor += m.scoreB; b.goalsAgainst += m.scoreA;

      if (m.scoreA === m.scoreB) { a.draws90++; b.draws90++; }

      if (m.winner) {
        const winnerId = m.winner._id.toString();
        if (winnerId === a.teamId) { a.wins++; b.losses++; }
        else { b.wins++; a.losses++; }
        const fed = m.winner.federation || 'Unknown';
        federationWins.set(fed, (federationWins.get(fed) || 0) + 1);
      }

      totalGoals += (m.scoreA + m.scoreB);
    }

    const teams = Array.from(teamStats.values()).sort((x,y) => y.wins - x.wins || (y.goalsFor - y.goalsAgainst) - (x.goalsFor - x.goalsAgainst));
    const matchesCount = matches.length;

    let topFederation = null;
    if (federationWins.size > 0) {
      const arr = Array.from(federationWins.entries()).sort((a,b) => b[1]-a[1]);
      topFederation = { federation: arr[0][0], wins: arr[0][1] };
    }

    res.json({
      overview: {
        matches: matchesCount,
        averageGoalsPerMatch: matchesCount > 0 ? (totalGoals / matchesCount) : 0,
        federationWithMostWins: topFederation
      },
      teams
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load analytics', details: err.message });
  }
});

export default router;
