import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const noteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mood: { type: Number, required: true },
  missesSarah: { type: Boolean, required: true },
  note: { type: String, default: '' },
  dayRating: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Note = mongoose.models.Note || mongoose.model('Note', noteSchema);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!MONGODB_URI) {
    return res.status(500).json({ error: 'Database not configured' });
  }

  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGODB_URI);
    }

    const { name, mood, missesSarah, note, dayRating } = req.body;
    
    if (!name || mood === null || missesSarah === null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newNote = new Note({ name, mood, missesSarah, note, dayRating });
    await newNote.save();
    
    res.status(200).json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save note' });
  }
}
