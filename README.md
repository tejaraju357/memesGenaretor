# 🎨 MemeStudio Pro — The Ultimate Meme Creation Suite

[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Render](https://img.shields.io/badge/Render-Deployed-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com/)

**MemeStudio Pro** is a premium, feature-rich, full-stack web application designed for creating, editing, exploring, and sharing memes. Built with a robust **HTML5 Canvas engine**, a live **Reddit Meme Feed API**, a persistent **Saved Gallery** with re-edit capabilities, and an interactive **Meme Soundboard**, it offers a state-of-the-art playground for meme creators.

---

## ✨ Key Features

### 🎨 1. Studio Tab (Meme Canvas Editor)
*   **HTML5 Canvas Core**: Operates on a pure canvas engine rather than basic HTML overlays, yielding high-definition outputs.
*   **Create from Scratch**: Next to template uploading, click **"Create"** to choose a custom background color and start on a clean, empty workspace.
*   **Multi-Layer Text Layers**: Add unlimited text layers. Drag, resize, and rotate elements freely.
*   **Double-Click Inline Editing**: Double-click directly on any text overlay on the canvas to edit its text value instantly in place.
*   **Advanced Typography Controls**:
    *   *Fonts & Styling*: Select between 10+ premium fonts, font size, bold, italic, and underline.
    *   *Colors & Stroke*: Pick custom text colors, outline stroke colors, and stroke width.
    *   *Shadow & Glow*: Apply soft drop-shadows with blur-radius sliders and shadow color pickers.
    *   *Layout*: Fine-tune line-height, letter spacing, alignment, and layer opacity.
    *   *Quick Grid Align*: Instantly snap text layers to 9 key positions (top-left, center, bottom-right, etc.).
*   **Stickers & Emojis**: Browse, scale, rotate, adjust opacity, and place any of 30+ stickers.
*   **Freehand Drawing Brush**: Sketch custom highlights or drawings with adjustable brush size, color, and an **undo stroke** system.

### 🔥 2. Live Meme Feed
*   **Trending Aggregator**: Fetches fresh meme templates from hot subreddits including `r/memes`, `r/dankmemes`, `r/me_irl`, `r/AdviceAnimals`, and `r/funny`.
*   **Instant Editing**: Click **"Use Template"** on any trending meme to load it directly into the Studio canvas.
*   **Light-box Viewer**: Preview memes in high resolution, copy their direct links, or download them instantly.

### 🎭 3. Saved Gallery (Persistent Database)
*   **JSON Database Storage**: Saves edit states (canvas coordinates, texts, drawing paths, backgrounds) alongside the generated image.
*   **True Re-Editing**: Click **"Re-Edit"** on any of your saved memes to load its exact configuration back into the canvas for tweaks.
*   **Smart Cross-Origin Downloader**: Downloads saved memes by fetching them as binary blobs, bypassing typical browser security restrictions to guarantee files save directly to local storage.

### 🎵 4. Meme Soundboard
*   **12 Iconic Sound Effects**: High-fidelity sound bytes (Bruh, Vine Boom, Air Horn, Emotional Damage, Roblox OOF, etc.) powered by the Web Audio API.
*   **Interactive Counter**: Increments a counter for funny soundboard reactions.

---

## 🛠️ Architecture & Tech Stack

### Frontend
-   **React 19** (Functional hooks, contexts, callbacks)
-   **Vite** (Optimized module bundler)
-   **CSS3** (Harmonious glassmorphism dark theme, smooth micro-animations, flexbox/grid layouts)

### Backend
-   **Express 5** (REST API endpoints)
-   **Multer** (Profile and custom media upload pipelines)
-   **CORS** (Configured to support multi-origin development and production hosting)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Local Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   cd memesGenaretor
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Launch development servers:
   ```bash
   npm run dev
   ```
   This fires up **concurrently**:
   - The Vite Frontend Server: `http://localhost:5173`
   - The Express Backend Server: `http://localhost:3001`

---

## 🌐 Production Deployment

### Backend Hosting (Render, Railway, Heroku)
The project is configured with a production start script that triggers the server entry point automatically:
```json
"scripts": {
  "start": "node server/index.js"
}
```
Deploy the backend folder to Render and configure the following environment values if necessary.

### Centralized Config Settings
To target the online Render backend, the API base URL is declared centrally inside `src/config.js`:
```javascript
export const API_BASE_URL = 'https://memesgenaretor.onrender.com';
```

To compile production-ready assets for static web hosting:
```bash
npm run build
```
The compiled output is saved to the `/dist` folder.
