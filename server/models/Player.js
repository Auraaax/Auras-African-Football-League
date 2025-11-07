import mongoose from 'mongoose';

const PlayerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  naturalPosition: { 
    type: String, 
    enum: ['GK', 'DF', 'MD', 'AT'], 
    required: true 
  },
  ratings: {
    GK: { type: Number, min: 0, max: 100, required: true },
    DF: { type: Number, min: 0, max: 100, required: true },
    MD: { type: Number, min: 0, max: 100, required: true },
    AT: { type: Number, min: 0, max: 100, required: true }
  },
  isCaptain: { type: Boolean, default: false },
  federation: { type: mongoose.Schema.Types.ObjectId, ref: 'Federation' }
}, { timestamps: true });

// Method to get player's primary rating (based on natural position)
PlayerSchema.methods.getPrimaryRating = function() {
  return this.ratings[this.naturalPosition];
};

export default mongoose.model('Player', PlayerSchema);
