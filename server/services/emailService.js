import nodemailer from 'nodemailer';

let transporter = null;

// Initialize email transporter
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export async function sendMatchResultEmail(federationEmails, matchData) {
  if (!transporter) {
    console.log('Email not configured. Match result:', matchData);
    return { success: false, message: 'Email not configured' };
  }

  const { teamA, teamB, scoreA, scoreB, goals, winner, commentary, resultType } = matchData;

  let goalsText = '';
  goals.forEach(goal => {
    const team = goal.team === 'A' ? teamA : teamB;
    goalsText += `  • ${goal.scorer} (${team}) - ${goal.minute}'\n`;
  });

  const winnerText = winner === 'draw' ? 'Match ended in a draw' : `Winner: ${winner}`;

  const emailHTML = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5;">
      <div style="background: linear-gradient(135deg, #0b3d0b, #063d2d); padding: 20px; text-align: center; color: white;">
        <h1 style="margin: 0;">⚽ Aura's African Football League</h1>
        <p style="margin: 5px 0;">Match Result Notification</p>
      </div>
      
      <div style="background: white; padding: 20px; margin-top: 10px; border-radius: 8px;">
        <h2 style="color: #0b3d0b; text-align: center;">
          ${teamA} vs ${teamB}
        </h2>
        
        <div style="text-align: center; font-size: 2em; font-weight: bold; color: #d4af37; margin: 20px 0;">
          ${scoreA} - ${scoreB}
        </div>
        
        <h3 style="color: #0b3d0b;">Goal Scorers:</h3>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${goalsText}</pre>
        
        <p style="font-weight: bold; color: #0b3d0b;">${winnerText}</p>
        
        ${resultType !== '90min' ? `<p style="color: #666;"><em>Result decided by ${resultType}</em></p>` : ''}
        
        ${commentary ? `
          <h3 style="color: #0b3d0b;">Match Commentary:</h3>
          <p style="line-height: 1.6; color: #333;">${commentary}</p>
        ` : ''}
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 0.9em;">
        <p>Aura's African Football League Tournament System</p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: `"AAFL Tournament" <${process.env.EMAIL_USER}>`,
      to: federationEmails.join(', '),
      subject: `Match Result: ${teamA} vs ${teamB}`,
      html: emailHTML
    });

    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error.message);
    return { success: false, error: error.message };
  }
}
