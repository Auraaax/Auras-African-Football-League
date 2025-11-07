import mongoose from 'mongoose';

const TeamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, index: true },
  federation: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Team', TeamSchema);
