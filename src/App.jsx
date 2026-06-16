import { useState, useCallback } from 'react';
import './App.css';
import { useToast } from './hooks/useToast.jsx';
import Studio from './components/Studio';
import Feed from './components/Feed';
import Gallery from './components/Gallery';
import Soundboard from './components/Soundboard';

const NAV_ITEMS = [
  { id: 'studio', icon: '🎨', label: 'Studio', badge: null, desc: 'Create & Edit' },
  { id: 'feed', icon: '🔥', label: 'Meme Feed', badge: 'Live', desc: 'Trending Memes' },
  { id: 'gallery', icon: '🎭', label: 'My Gallery', badge: null, desc: 'Saved Memes' },
  { id: 'soundboard', icon: '🎵', label: 'Soundboard', badge: 'Fun', desc: 'Meme Sounds' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('studio');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [studioState, setStudioState] = useState(null);
  const [galleryRefresh, setGalleryRefresh] = useState(0);
  const { addToast, ToastContainer } = useToast();

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const handleReEdit = useCallback((meme) => {
    setStudioState(meme.state ? { ...meme.state } : { templateUrl: meme.url });
    setActiveTab('studio');
    addToast('🎨 Meme loaded in Studio!', 'success');
  }, [addToast]);

  const handleSelectTemplate = useCallback((url) => {
    setStudioState({ templateUrl: url });
    setActiveTab('studio');
  }, []);

  const handleSaved = useCallback(() => {
    setGalleryRefresh(p => p + 1);
  }, []);

  const currentPage = NAV_ITEMS.find(n => n.id === activeTab);

  return (
    <div className="app-shell">
      {/* Sidebar overlay (mobile) */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'show' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="logo-icon" style={{ animation: 'float 3s ease-in-out infinite' }}>😂</div>
            <div>
              <div className="logo-text">MemeStudio</div>
              <div className="logo-tagline">Pro Edition</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Create</div>
          {NAV_ITEMS.slice(0, 1).map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="nav-section-label">Explore</div>
          {NAV_ITEMS.slice(1, 2).map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="nav-section-label">Library</div>
          {NAV_ITEMS.slice(2, 3).map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}

          <div className="nav-section-label">Fun</div>
          {NAV_ITEMS.slice(3).map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleNavClick(item.id)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-text">
            🚀 MemeStudio Pro · v2.0
            <br />
            Made with 💜 & chaos
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)}>
              ☰
            </button>
            <div>
              <div className="topbar-title">
                {currentPage?.icon} {currentPage?.label}
              </div>
            </div>
          </div>

          <div className="topbar-actions">
            <div style={{ display: 'flex', gap: 6 }}>
              {NAV_ITEMS.map(item => (
                <button
                  key={item.id}
                  className={`hide-mobile btn btn-sm ${activeTab === item.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => handleNavClick(item.id)}
                  style={{ gap: 4 }}
                >
                  {item.icon} {item.label}
                  {item.badge && <span className="badge badge-cyan" style={{ marginLeft: 2, padding: '1px 5px', fontSize: '0.6rem' }}>{item.badge}</span>}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="page-content">
          {activeTab === 'studio' && (
            <Studio
              key={JSON.stringify(studioState)}
              initialState={studioState}
              onSaved={handleSaved}
              addToast={addToast}
            />
          )}
          {activeTab === 'feed' && (
            <Feed
              onSelectTemplate={handleSelectTemplate}
              addToast={addToast}
            />
          )}
          {activeTab === 'gallery' && (
            <Gallery
              onReEdit={handleReEdit}
              addToast={addToast}
              refreshTrigger={galleryRefresh}
            />
          )}
          {activeTab === 'soundboard' && (
            <Soundboard addToast={addToast} />
          )}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}