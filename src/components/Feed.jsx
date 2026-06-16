import { useState, useEffect, useCallback } from 'react';
import './Feed.css';
import { API_BASE_URL } from '../config';

const SUBREDDITS = [
  { id: 'memes', label: '🔥 Hot Memes', emoji: '🔥' },
  { id: 'dankmemes', label: '💀 Dank Memes', emoji: '💀' },
  { id: 'me_irl', label: '😭 Me IRL', emoji: '😭' },
  { id: 'AdviceAnimals', label: '🐶 Advice Animals', emoji: '🐶' },
  { id: 'funny', label: '😂 Funny', emoji: '😂' },
  { id: 'Humor', label: '🤣 Humor', emoji: '🤣' },
];

export default function Feed({ onSelectTemplate, addToast }) {
  const [activeSub, setActiveSub] = useState('memes');
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [viewMeme, setViewMeme] = useState(null);

  const fetchMemes = useCallback(async (sub, append = false) => {
    if (!append) { setLoading(true); setMemes([]); }
    else setLoadingMore(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reddit-memes/${sub}`);
      const data = await res.json();
      const filtered = (data || []).filter(m =>
        m.url && (m.url.endsWith('.jpg') || m.url.endsWith('.jpeg') || m.url.endsWith('.png') || m.url.endsWith('.gif') || m.url.includes('redd.it') || m.url.includes('i.redd.it'))
      );
      if (append) {
        setMemes(prev => [...prev, ...filtered]);
        setPage(p => p + 1);
      } else {
        setMemes(filtered);
        setPage(0);
      }
    } catch {
      addToast('Failed to load memes. Trying again...', 'error');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchMemes(activeSub);
  }, [activeSub, fetchMemes]);

  const handleSubClick = (sub) => {
    setActiveSub(sub);
  };

  const useAsTemplate = (url, title) => {
    onSelectTemplate(url, title);
    addToast(`🎨 "${title}" loaded in Studio!`, 'success');
  };

  const copyLink = (url) => {
    navigator.clipboard.writeText(url).then(() => addToast('Link copied! 📋', 'success'));
  };

  return (
    <div className="feed-page">
      {/* Subreddit tabs */}
      <div className="feed-tabs-wrapper">
        <div className="feed-tabs">
          {SUBREDDITS.map(s => (
            <button
              key={s.id}
              className={`feed-tab ${activeSub === s.id ? 'active' : ''}`}
              onClick={() => handleSubClick(s.id)}
            >
              {s.emoji} <span className="hide-mobile">{s.label.split(' ').slice(1).join(' ')}</span>
            </button>
          ))}
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => fetchMemes(activeSub)} style={{ flex: 'none' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Feed header */}
      <div className="feed-header">
        <div>
          <h2 className="feed-title">{SUBREDDITS.find(s => s.id === activeSub)?.label || ''}</h2>
          <p className="feed-subtitle">Fresh memes from r/{activeSub} · Click any to use as template</p>
        </div>
        <span className="badge badge-purple">{memes.length} memes</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="feed-grid">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="feed-card skeleton" style={{ height: 240 }} />
          ))}
        </div>
      ) : (
        <>
          <div className="feed-grid">
            {memes.map((m, i) => (
              <div key={i} className="feed-card" onClick={() => setViewMeme(m)}>
                <div className="feed-card-img-wrap">
                  <img
                    src={m.url}
                    alt={m.title}
                    loading="lazy"
                    className="feed-card-img"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                  <div className="feed-card-overlay">
                    <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); useAsTemplate(m.url, m.title); }}>
                      🎨 Use Template
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); copyLink(m.url); }}>
                      📋 Copy
                    </button>
                  </div>
                </div>
                <div className="feed-card-info">
                  <p className="feed-card-title">{m.title}</p>
                  <div className="feed-card-meta">
                    {m.ups !== undefined && <span className="feed-card-stat">👍 {m.ups?.toLocaleString()}</span>}
                    {m.author && <span className="feed-card-stat">u/{m.author}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {memes.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
              <button className="btn btn-secondary btn-lg" onClick={() => fetchMemes(activeSub, true)} disabled={loadingMore}>
                {loadingMore ? '⏳ Loading...' : '🔄 Load More Memes'}
              </button>
            </div>
          )}
          {memes.length === 0 && (
            <div className="feed-empty">
              <div style={{ fontSize: 64 }}>🤔</div>
              <h3>No memes found</h3>
              <p>Try a different category or refresh</p>
              <button className="btn btn-primary" onClick={() => fetchMemes(activeSub)}>Try Again</button>
            </div>
          )}
        </>
      )}

      {/* Lightbox */}
      {viewMeme && (
        <div className="lightbox" onClick={() => setViewMeme(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setViewMeme(null)}>✕</button>
            <img src={viewMeme.url} alt={viewMeme.title} className="lightbox-img" />
            <div className="lightbox-info">
              <p className="lightbox-title">{viewMeme.title}</p>
              <div className="lightbox-actions">
                <button className="btn btn-primary" onClick={() => { useAsTemplate(viewMeme.url, viewMeme.title); setViewMeme(null); }}>
                  🎨 Open in Studio
                </button>
                <a href={viewMeme.url} download target="_blank" rel="noreferrer" className="btn btn-secondary">
                  ⬇️ Download
                </a>
                <button className="btn btn-secondary" onClick={() => copyLink(viewMeme.url)}>
                  📋 Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
