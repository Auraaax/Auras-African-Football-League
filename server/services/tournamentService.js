import OpenAI from 'openai';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Simulate match with AI commentary
export async function playMatchWithCommentary(teamA, teamB, players) {
  if (!openai) {
    // Fallback if no API key
    return generateFallbackMatch(teamA, teamB);
  }

  try {
    const prompt = `You are a football commentator for an African Football League match between ${teamA.teamName} and ${teamB.teamName}. 
    
Generate exciting, realistic match commentary for a 90-minute game. Include:
- Key moments and dramatic plays
- Goals with scorer names and minutes (use realistic African player names)
- Final score (random but realistic: 0-4 goals per team)
- Match winner or if it's a draw

Keep it engaging but concise (300-400 words). End with the final score and winner.

Format the response as JSON:
{
  "commentary": "full match commentary text",
  "scoreA": number,
  "scoreB": number,
  "goals": [{"scorer": "name", "team": "A or B", "minute": number}],
  "resultType": "90min",
  "winner": "teamA or teamB or draw"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
      max_tokens: 800
    });

    const result = JSON.parse(response.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('OpenAI API error:', error.message);
    return generateFallbackMatch(teamA, teamB);
  }
}

// Quick simulation without commentary
export function simulateQuickMatch(teamA, teamB) {
  const scoreA = Math.floor(Math.random() * 5);
  const scoreB = Math.floor(Math.random() * 5);
  
  const goals = [];
  const africanNames = [
    'M. Dlamini', 'K. Okocha', 'S. Mensah', 'A. Salah', 'P. Mahrez',
    'Y. Touré', 'D. Drogba', 'S. Eto\'o', 'J. Mane', 'W. Ndidi'
  ];

  // Generate goals for team A
  for (let i = 0; i < scoreA; i++) {
    goals.push({
      scorer: africanNames[Math.floor(Math.random() * africanNames.length)],
      team: 'A',
      minute: Math.floor(Math.random() * 90) + 1
    });
  }

  // Generate goals for team B
  for (let i = 0; i < scoreB; i++) {
    goals.push({
      scorer: africanNames[Math.floor(Math.random() * africanNames.length)],
      team: 'B',
      minute: Math.floor(Math.random() * 90) + 1
    });
  }

  goals.sort((a, b) => a.minute - b.minute);

  let winner = scoreA > scoreB ? 'teamA' : scoreB > scoreA ? 'teamB' : 'draw';
  let resultType = '90min';

  // If draw, decide by penalties
  if (winner === 'draw') {
    winner = Math.random() > 0.5 ? 'teamA' : 'teamB';
    resultType = 'Penalties';
  }

  return {
    scoreA,
    scoreB,
    goals,
    resultType,
    winner,
    commentary: null
  };
}

// Fallback match generation without AI
function generateFallbackMatch(teamA, teamB) {
  const result = simulateQuickMatch(teamA, teamB);
  
  let commentary = `⚽ ${teamA.teamName} vs ${teamB.teamName}\n\n`;
  commentary += `An intense match at the stadium! `;
  
  result.goals.forEach(goal => {
    const team = goal.team === 'A' ? teamA.teamName : teamB.teamName;
    commentary += `${goal.scorer} scores for ${team} in the ${goal.minute}' minute! `;
  });
  
  commentary += `\n\nFinal Score: ${teamA.teamName} ${result.scoreA} - ${result.scoreB} ${teamB.teamName}`;
  
  if (result.resultType === 'Penalties') {
    commentary += ` (Decided on penalties)`;
  }
  
  const winnerTeam = result.winner === 'teamA' ? teamA.teamName : result.winner === 'teamB' ? teamB.teamName : 'Draw';
  commentary += `\n\nWinner: ${winnerTeam}`;
  
  return { ...result, commentary };
}

// Create tournament bracket (quarterfinals)
export function createQuarterfinalPairings(teams) {
  // Shuffle teams randomly for fair pairing
  const shuffled = [...teams].sort(() => Math.random() - 0.5);
  
  return [
    { teamA: shuffled[0], teamB: shuffled[1] },
    { teamA: shuffled[2], teamB: shuffled[3] },
    { teamA: shuffled[4], teamB: shuffled[5] },
    { teamA: shuffled[6], teamB: shuffled[7] }
  ];
}
