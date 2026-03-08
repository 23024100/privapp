import express from 'express';
import { createServer as createViteServer } from 'vite';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not found in environment variables. Database features will be disabled.');
  console.log('To fix this:');
  console.log('1. Create a MongoDB Atlas cluster');
  console.log('2. Whitelist 0.0.0.0/0 in Atlas Network Access');
  console.log('3. Add MONGODB_URI to your environment variables');
} else {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging
  })
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
      console.error('❌ MongoDB connection error:', err.message);
      console.log('\n💡 TIP: This is usually an IP Whitelist issue.');
      console.log('Go to MongoDB Atlas > Network Access > Add IP Address > "Allow Access From Anywhere" (0.0.0.0/0)\n');
    });
}

const addressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  postalCode: { type: String, required: true },
  block: { type: String, required: true },
  unitNumber: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Address = mongoose.model('Address', addressSchema);

const statsSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  firstVisitDate: { type: Date, default: Date.now }
});

const Stats = mongoose.model('Stats', statsSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/stats/:name', async (req, res) => {
    try {
      let stats = await Stats.findOne({ name: req.params.name });
      if (!stats) {
        stats = new Stats({ name: req.params.name });
        await stats.save();
      }
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  app.get('/api/address/check/:name', async (req, res) => {
    try {
      const address = await Address.findOne({ name: req.params.name });
      res.json({ exists: !!address });
    } catch (error) {
      res.status(500).json({ error: 'Failed to check address' });
    }
  });

  app.post('/api/address', async (req, res) => {
    try {
      const { name, postalCode, block, unitNumber } = req.body;
      const newAddress = new Address({ name, postalCode, block, unitNumber });
      await newAddress.save();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save address' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
