import { VercelRequest, VercelResponse } from '@vercel/node';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  postalCode: { type: String, required: true },
  block: { type: String, required: true },
  unitNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Address = mongoose.models.Address || mongoose.model('Address', addressSchema);

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
    const address = await Address.findOne({ name });
    
    res.status(200).json({ exists: !!address });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to check address' });
  }
}
