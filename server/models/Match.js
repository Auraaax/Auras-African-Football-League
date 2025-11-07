import mongoose from 'mongoose';

const MatchSchema = new mongoose.Schema({
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  scoreA: { type: Number, required: true },
  scoreB: { type: Number, required: true },
  goals: [{ 
    scorer: String, 
    team: String, 
    minute: Number 
  }],
  commentary: { type: String },
  resultType: { type: String, enum: ['90min', 'Extra Time', 'Penalties'], default: '90min' },
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  round: { type: String, enum: ['Quarterfinal', 'Semifinal', 'Final'], default: 'Quarterfinal' },
  simulatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  date: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model('Match', MatchSchema);
