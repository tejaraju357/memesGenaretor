import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Ensure data file exists
const dataFile = path.join(__dirname, 'memes.json');
if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify([]));

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use('/uploads', express.static(uploadsDir));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });

// Read memes from JSON store
const readMemes = () => {
  try {
    const raw = fs.readFileSync(dataFile, 'utf-8');
    return JSON.parse(raw);
  } catch { return []; }
};

// Write memes to JSON store
const writeMemes = (data) => {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
};

// GET all saved memes (gallery)
app.get('/api/memes', (req, res) => {
  const memes = readMemes();
  res.json(memes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// POST - Save a new meme (base64 image + canvas state)
app.post('/api/memes', (req, res) => {
  try {
    const { imageData, state, templateUrl, title } = req.body;
    if (!imageData) return res.status(400).json({ error: 'No image data provided' });

    const id = uuidv4();
    const filename = `${id}.png`;
    const filePath = path.join(uploadsDir, filename);

    // Save base64 image
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
    fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));

    const meme = {
      id,
      filename,
      url: `/uploads/${filename}`,
      templateUrl: templateUrl || null,
      title: title || 'My Meme',
      state: state || null,
      createdAt: new Date().toISOString()
    };

    const memes = readMemes();
    memes.push(meme);
    writeMemes(memes);

    res.json({ success: true, meme });
  } catch (err) {
    console.error('Save error:', err);
    res.status(500).json({ error: 'Failed to save meme' });
  }
});

// DELETE a meme
app.delete('/api/memes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const memes = readMemes();
    const meme = memes.find(m => m.id === id);
    if (!meme) return res.status(404).json({ error: 'Meme not found' });

    // Delete file
    const filePath = path.join(uploadsDir, meme.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    writeMemes(memes.filter(m => m.id !== id));
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete meme' });
  }
});

// GET memes from Imgflip API
app.get('/api/templates', async (req, res) => {
  try {
    const r = await fetch('https://api.imgflip.com/get_memes');
    const data = await r.json();
    res.json(data.data.memes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET trending memes from meme-api (Reddit)
app.get('/api/reddit-memes', async (req, res) => {
  try {
    const subreddits = ['memes', 'dankmemes', 'me_irl', 'AdviceAnimals', 'funny'];
    const sub = subreddits[Math.floor(Math.random() * subreddits.length)];
    const r = await fetch(`https://meme-api.com/gimme/${sub}/25`);
    const data = await r.json();
    res.json(data.memes || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch Reddit memes' });
  }
});

// GET memes by subreddit
app.get('/api/reddit-memes/:subreddit', async (req, res) => {
  try {
    const { subreddit } = req.params;
    const r = await fetch(`https://meme-api.com/gimme/${subreddit}/20`);
    const data = await r.json();
    res.json(data.memes || []);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch memes' });
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Meme Server running at http://localhost:${PORT}\n`);
});
