import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from './models/User.js';
import Team from './models/Team.js';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Team.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Hash demo passwords
    const adminPass = await bcrypt.hash('admin123', 10);
    const fedPass = await bcrypt.hash('fed123', 10);

    // Create admin user with real bcrypt hash
    const admin = await User.create({
      name: 'Administrator',
      email: 'admin@aurafootball.com',
      passwordHash: adminPass,
      role: 'administrator'
    });
    console.log('👤 Created admin user');

    // Create federation users
    await User.create([
      { name: 'South African FA', email: 'federation@aurafootball.com', passwordHash: fedPass, role: 'federation' },
      { name: 'Nigerian FA', email: 'nigeria@aurafootball.com', passwordHash: fedPass, role: 'federation' }
    ]);
    console.log('👥 Created federation users');

    // Create 7 predefined teams (8th team must be added by federation)
    await Team.create([
      { teamName: 'Kaizer Chiefs', federation: 'South Africa', createdBy: admin._id },
      { teamName: 'Orlando Pirates', federation: 'South Africa', createdBy: admin._id },
      { teamName: 'Mamelodi Sundowns', federation: 'South Africa', createdBy: admin._id },
      { teamName: 'SuperSport United', federation: 'South Africa', createdBy: admin._id },
      { teamName: 'TP Mazembe', federation: 'Congo', createdBy: admin._id },
      { teamName: 'Al Ahly', federation: 'Egypt', createdBy: admin._id },
      { teamName: 'Wydad Casablanca', federation: 'Morocco', createdBy: admin._id }
    ]);
    console.log('⚽ Created 7 predefined teams (waiting for 8th team from federation)');

    console.log('\n✅ Seed data created successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
};

seedData();
