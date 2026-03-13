import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const activitySchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  text: { type: String, required: true },
  addedBy: { type: String, required: true },
  isDone: { type: Boolean, default: false },
  rotation: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!MONGODB_URI) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    if (req.method === 'GET') {
      const activities = await Activity.find().sort({ createdAt: -1 });
      return res.status(200).json(activities);
    }

    if (req.method === 'POST') {
      const { id, text, addedBy, isDone, rotation } = req.body;
      
      if (!id || !text || !addedBy) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const activity = new Activity({ id, text, addedBy, isDone, rotation });
      await activity.save();
      return res.status(200).json({ success: true });
    }

    if (req.method === 'PATCH') {
      const { id, isDone } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Activity ID is required' });
      }

      await Activity.updateOne({ id }, { isDone });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      
      if (!id) {
        return res.status(400).json({ error: 'Activity ID is required' });
      }

      await Activity.deleteOne({ id });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process request' });
  }
}
