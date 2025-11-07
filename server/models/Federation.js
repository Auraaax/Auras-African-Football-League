import mongoose from 'mongoose';

const FederationSchema = new mongoose.Schema({
  country: { 
    type: String, 
    required: true,
    unique: true 
  },
  representative: { 
    type: String, 
    required: true 
  },
  manager: { 
    type: String, 
    required: true 
  },
  players: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Player' 
  }],
  countryRating: { 
    type: Number, 
    default: 0 
  },
  teamName: {
    type: String,
    required: true
  },
  registeredAt: { 
    type: Date, 
    default: Date.now 
  }
}, { timestamps: true });

// Method to calculate country rating based on all players' natural position ratings
FederationSchema.methods.calculateCountryRating = async function() {
  await this.populate('players');
  
  if (!this.players || this.players.length === 0) {
    this.countryRating = 0;
    return 0;
  }

  const totalRating = this.players.reduce((sum, player) => {
    return sum + player.getPrimaryRating();
  }, 0);

  this.countryRating = Math.round((totalRating / this.players.length) * 10) / 10;
  return this.countryRating;
};

export default mongoose.model('Federation', FederationSchema);
