import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const statsSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  firstVisitDate: { type: Date, default: Date.now }
});

const Stats = mongoose.models.Stats || mongoose.model('Stats', statsSchema);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!MONGODB_URI) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const { name } = req.query;
    
    let stats = await Stats.findOne({ name });
    if (!stats) {
      stats = new Stats({ name });
      await stats.save();
    }
    
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
}
