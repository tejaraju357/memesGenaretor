import { useState, useEffect, useCallback } from 'react';
import './Gallery.css';
import { API_BASE_URL, getMemeUrl } from '../config';

export default function Gallery({ onReEdit, addToast, refreshTrigger }) {
  const [memes, setMemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [viewMeme, setViewMeme] = useState(null);

  const fetchMemes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/memes`);
      const data = await res.json();
      setMemes(data);
    } catch {
      addToast('Failed to load gallery', 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => { fetchMemes(); }, [fetchMemes, refreshTrigger]);

  const deleteMeme = async (id) => {
    if (!window.confirm('Delete this meme? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await fetch(`${API_BASE_URL}/api/memes/${id}`, { method: 'DELETE' });
      setMemes(prev => prev.filter(m => m.id !== id));
      addToast('Meme deleted', 'info');
      if (viewMeme?.id === id) setViewMeme(null);
    } catch {
      addToast('Failed to delete meme', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const downloadMeme = async (url, title) => {
    addToast('⬇️ Downloading...', 'info');
    try {
      const fullUrl = getMemeUrl(url);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${title || 'meme'}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      addToast('🎉 Download completed!', 'success');
    } catch (err) {
      console.error(err);
      const link = document.createElement('a');
      link.download = `${title || 'meme'}.png`;
      link.href = getMemeUrl(url);
      link.target = '_blank';
      link.click();
      addToast('Opened in new tab to download', 'info');
    }
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="gallery-page">
      <div className="gallery-header">
        <div>
          <h2 className="gallery-title">🎭 My Meme Gallery</h2>
          <p className="gallery-subtitle">Your saved and downloaded memes — click any to re-edit or download</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-purple">{memes.length} saved</span>
          <button className="btn btn-secondary btn-sm" onClick={fetchMemes}>🔄 Refresh</button>
        </div>
      </div>

      {loading ? (
        <div className="gallery-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="gallery-card skeleton" style={{ height: 280 }} />)}
        </div>
      ) : memes.length === 0 ? (
        <div className="gallery-empty">
          <div className="gallery-empty-icon">🎭</div>
          <h3>No memes yet!</h3>
          <p>Go to Studio, create an amazing meme, and save it here</p>
          <div className="gallery-empty-steps">
            <div className="empty-step"><span>1</span>Open Studio tab</div>
            <div className="empty-step"><span>2</span>Pick a template</div>
            <div className="empty-step"><span>3</span>Add text & effects</div>
            <div className="empty-step"><span>4</span>Save or Download</div>
          </div>
        </div>
      ) : (
        <div className="gallery-grid">
          {memes.map(m => (
            <div key={m.id} className="gallery-card" onClick={() => setViewMeme(m)}>
              <div className="gallery-card-img-wrap">
                <img src={getMemeUrl(m.url)} alt={m.title} className="gallery-card-img" loading="lazy" />
                <div className="gallery-card-overlay">
                  <button className="btn btn-primary btn-sm" onClick={e => { e.stopPropagation(); onReEdit(m); }}>
                    ✏️ Re-Edit
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); downloadMeme(m.url, m.title); }}>
                    ⬇️ Download
                  </button>
                </div>
                <div className="gallery-card-date">{formatDate(m.createdAt)}</div>
                {m.state && <div className="gallery-card-badge">✏️ Editable</div>}
              </div>
              <div className="gallery-card-info">
                <p className="gallery-card-title">{m.title}</p>
                <div className="gallery-card-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1 }}
                    onClick={e => { e.stopPropagation(); downloadMeme(m.url, m.title); }}
                  >⬇️</button>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1 }}
                    onClick={e => { e.stopPropagation(); onReEdit(m); }}
                  >✏️ Edit</button>
                  <button
                    className="btn btn-danger btn-sm btn-icon"
                    disabled={deleting === m.id}
                    onClick={e => { e.stopPropagation(); deleteMeme(m.id); }}
                  >{deleting === m.id ? '⏳' : '🗑️'}</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {viewMeme && (
        <div className="lightbox" onClick={() => setViewMeme(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setViewMeme(null)}>✕</button>
            <img src={getMemeUrl(viewMeme.url)} alt={viewMeme.title} className="lightbox-img" />
            <div className="lightbox-info">
              <p className="lightbox-title">{viewMeme.title}</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                Saved {formatDate(viewMeme.createdAt)}
                {viewMeme.state && ' · Has edit state'}
              </p>
              <div className="lightbox-actions">
                <button className="btn btn-primary" onClick={() => { onReEdit(viewMeme); setViewMeme(null); }}>✏️ Re-Edit in Studio</button>
                <button className="btn btn-secondary" onClick={() => downloadMeme(viewMeme.url, viewMeme.title)}>⬇️ Download</button>
                <button className="btn btn-danger btn-sm" onClick={() => deleteMeme(viewMeme.id)}>🗑️ Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
