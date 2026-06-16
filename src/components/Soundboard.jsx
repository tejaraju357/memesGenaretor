import { useState, useRef, useCallback } from 'react';
import './Soundboard.css';

// Free sound effects via public URLs (freesound/zapsplat alternatives - using public YouTube-compatible sounds)
const SOUNDS = [
  { id: 'bruh', label: '🤦 Bruh', emoji: '🤦', color: '#7c3aed', desc: 'The classic bruh moment', url: 'https://www.myinstants.com/media/sounds/vine-boom.mp3' },
  { id: 'vine', label: '💥 Vine Boom', emoji: '💥', color: '#ef4444', desc: 'Vine boom sound effect', url: 'https://www.myinstants.com/media/sounds/vine-boom.mp3' },
  { id: 'airhorn', label: '📯 Air Horn', emoji: '📯', color: '#f59e0b', desc: 'Achievement unlocked!', url: 'https://www.myinstants.com/media/sounds/airhorn.mp3' },
  { id: 'wow', label: '😮 WOW', emoji: '😮', color: '#06b6d4', desc: 'Owen Wilson "Wow"', url: 'https://www.myinstants.com/media/sounds/wow.mp3' },
  { id: 'nyan', label: '🌈 Nyan Cat', emoji: '🌈', color: '#ec4899', desc: 'Nyan Cat theme', url: 'https://www.myinstants.com/media/sounds/nyan-cat.mp3' },
  { id: 'emotional', label: '😭 Emotional', emoji: '😭', color: '#10b981', desc: 'Emotional damage!', url: 'https://www.myinstants.com/media/sounds/emotional-damage.mp3' },
  { id: 'oof', label: '😱 OOF', emoji: '😱', color: '#8b5cf6', desc: 'Roblox death sound', url: 'https://www.myinstants.com/media/sounds/roblox-death-sound_1.mp3' },
  { id: 'sad', label: '🎺 Sad Trombone', emoji: '🎺', color: '#64748b', desc: 'Wah wah waaaah', url: 'https://www.myinstants.com/media/sounds/sad-trombone.mp3' },
  { id: 'mlg', label: '🎯 MLG Horn', emoji: '🎯', color: '#f59e0b', desc: 'MLG air horn', url: 'https://www.myinstants.com/media/sounds/mlg-airhorn.mp3' },
  { id: 'mission', label: '😎 Mission', emoji: '😎', color: '#06b6d4', desc: 'Mission impossible', url: 'https://www.myinstants.com/media/sounds/mission-impossible-theme-song.mp3' },
  { id: 'crickets', label: '🦗 Crickets', emoji: '🦗', color: '#84cc16', desc: 'Awkward silence...', url: 'https://www.myinstants.com/media/sounds/crickets.mp3' },
  { id: 'dundun', label: '🎭 Dun Dun', emoji: '🎭', color: '#dc2626', desc: 'Dramatic reveal', url: 'https://www.myinstants.com/media/sounds/dun-dun-dun.mp3' },
];

const MEME_REACTIONS = [
  { emoji: '💀', label: 'Dead', count: Math.floor(Math.random() * 9999) + 1000 },
  { emoji: '🔥', label: 'Fire', count: Math.floor(Math.random() * 5000) + 500 },
  { emoji: '😂', label: 'Lmao', count: Math.floor(Math.random() * 8000) + 2000 },
  { emoji: '🤣', label: 'Rofl', count: Math.floor(Math.random() * 4000) + 100 },
  { emoji: '😭', label: 'Crying', count: Math.floor(Math.random() * 6000) + 300 },
  { emoji: '👑', label: 'King', count: Math.floor(Math.random() * 2000) + 50 },
];

export default function Soundboard({ addToast }) {
  const [playing, setPlaying] = useState(null);
  const [volume, setVolume] = useState(0.7);
  const [reactions, setReactions] = useState(MEME_REACTIONS);
  const [clickedSound, setClickedSound] = useState(null);
  const audioRef = useRef(null);

  const playSound = useCallback((sound) => {
    // Stop existing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const audio = new Audio();
    audio.volume = volume;
    audio.crossOrigin = 'anonymous';

    // Use Web Audio API beep as fallback since external audio may be blocked
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      playBeep(ctx, sound.id);
    }

    setPlaying(sound.id);
    setClickedSound(sound.id);
    setTimeout(() => setClickedSound(null), 200);
    setTimeout(() => setPlaying(null), 1500);

    addToast(`${sound.emoji} ${sound.label}!`, 'success');
  }, [volume, addToast]);

  const playBeep = (ctx, soundId) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);

    // Different sound profiles per button
    const profiles = {
      bruh: { type: 'sawtooth', freq: 80, duration: 0.6, endFreq: 60 },
      vine: { type: 'square', freq: 200, duration: 0.15, endFreq: 80 },
      airhorn: { type: 'sawtooth', freq: 440, duration: 1.2, endFreq: 480 },
      wow: { type: 'sine', freq: 300, duration: 0.5, endFreq: 200 },
      nyan: { type: 'square', freq: 800, duration: 1.5, endFreq: 1200 },
      emotional: { type: 'sine', freq: 440, duration: 0.8, endFreq: 220 },
      oof: { type: 'sawtooth', freq: 180, duration: 0.3, endFreq: 120 },
      sad: { type: 'sine', freq: 300, duration: 1.2, endFreq: 150 },
      mlg: { type: 'sawtooth', freq: 520, duration: 0.8, endFreq: 560 },
      mission: { type: 'square', freq: 660, duration: 1.0, endFreq: 880 },
      crickets: { type: 'sine', freq: 2000, duration: 1.5, endFreq: 2200 },
      dundun: { type: 'sawtooth', freq: 120, duration: 0.9, endFreq: 80 },
    };

    const p = profiles[soundId] || { type: 'sine', freq: 440, duration: 0.5, endFreq: 440 };
    oscillator.type = p.type;
    oscillator.frequency.setValueAtTime(p.freq, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(p.endFreq, ctx.currentTime + p.duration);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + p.duration);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + p.duration);
  };

  const react = (idx) => {
    setReactions(prev => prev.map((r, i) => i === idx ? { ...r, count: r.count + 1, just: true } : r));
    setTimeout(() => setReactions(prev => prev.map((r, i) => i === idx ? { ...r, just: false } : r)), 600);
  };

  return (
    <div className="soundboard-page">
      <div className="soundboard-header">
        <div>
          <h2 className="soundboard-title">🎵 Meme Soundboard</h2>
          <p className="soundboard-subtitle">Click any sound to unleash chaos • Volume: {Math.round(volume * 100)}%</p>
        </div>
        <div className="volume-control">
          <span style={{ fontSize: '1.2rem' }}>{volume === 0 ? '🔇' : volume < 0.4 ? '🔈' : volume < 0.8 ? '🔉' : '🔊'}</span>
          <input
            type="range"
            min="0" max="1" step="0.05"
            value={volume}
            onChange={e => setVolume(Number(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>

      {/* Sound Grid */}
      <div className="sound-grid">
        {SOUNDS.map(s => (
          <button
            key={s.id}
            className={`sound-btn ${playing === s.id ? 'playing' : ''} ${clickedSound === s.id ? 'clicked' : ''}`}
            onClick={() => playSound(s)}
            style={{ '--color': s.color, '--glow': s.color + '55' }}
          >
            <div className="sound-emoji">{s.emoji}</div>
            <div className="sound-label">{s.label}</div>
            <div className="sound-desc">{s.desc}</div>
            {playing === s.id && (
              <div className="sound-bars">
                {[...Array(5)].map((_, i) => <div key={i} className="sound-bar" style={{ animationDelay: `${i * 0.1}s` }} />)}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Reaction board */}
      <div className="reaction-section">
        <h3 className="reaction-title">⚡ Meme Reactions</h3>
        <p className="reaction-sub">Click to react to the vibe</p>
        <div className="reaction-grid">
          {reactions.map((r, i) => (
            <button
              key={i}
              className={`reaction-btn ${r.just ? 'reacted' : ''}`}
              onClick={() => react(i)}
            >
              <span className="reaction-emoji">{r.emoji}</span>
              <span className="reaction-label">{r.label}</span>
              <span className="reaction-count">{r.count.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Fun facts */}
      <div className="fun-facts">
        <h3 className="fun-facts-title">🧠 Meme Fun Facts</h3>
        <div className="fun-facts-grid">
          {[
            { icon: '📅', fact: 'The word "meme" was coined by Richard Dawkins in 1976' },
            { icon: '🐱', fact: 'Grumpy Cat\'s real name was Tardar Sauce. She passed in 2019.' },
            { icon: '💸', fact: 'The most expensive meme NFT sold for $4 million (Doge)' },
            { icon: '🎂', fact: 'Nyan Cat turned 13 in 2024. Still going strong!' },
            { icon: '📱', fact: '55% of Gen Z communicates primarily through memes' },
            { icon: '🧐', fact: 'There are over 500 million memes shared daily on the internet' },
          ].map((f, i) => (
            <div key={i} className="fun-fact-card">
              <span className="fun-fact-icon">{f.icon}</span>
              <p className="fun-fact-text">{f.fact}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
