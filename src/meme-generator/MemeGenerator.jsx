import { useState, useEffect, useRef } from 'react';
import './MemeGenerator.css';

function MemeGenerator() {
  const [memeImage, setMemeImage] = useState('');
  const [memes, setMemes] = useState([]);
  const [texts, setTexts] = useState([
    { value: '', pos: { x: 50, y: 20 }, color: '#ffffff', fontSize: 28 }
  ]);
  const [dragging, setDragging] = useState(null);
  const memeRef = useRef(null);

  useEffect(() => { 
    const fetchMemes = async () => {
      const apiUrl = 'https://api.imgflip.com/get_memes';
      const response = await fetch(apiUrl);
      const data = await response.json();
      setMemes(data.data.memes);
    };
    fetchMemes();
  }, []);

  const generateMeme = () => {
    if (memes.length > 0) {
      const randomIndex = Math.floor(Math.random() * memes.length);
      setMemeImage(memes[randomIndex].url);
      setTexts(texts.map((t, i) => ({
        ...t,
        pos: { x: 50, y: 20 + i * 40 }
      })));
    }
  };

  // Add a new text input
  const addText = () => {
    setTexts([...texts, { value: '', pos: { x: 50, y: 20 + texts.length * 40 }, color: '#ffffff', fontSize: 28 }]);
  };

  const handleTextChange = (idx, value) => {
    setTexts(texts.map((t, i) => i === idx ? { ...t, value } : t));
  };

  const handleColorChange = (idx, color) => {
    setTexts(texts.map((t, i) => i === idx ? { ...t, color } : t));
  };

  const handleFontSizeChange = (idx, size) => {
    setTexts(texts.map((t, i) => i === idx ? { ...t, fontSize: Number(size) } : t));
  };

  const handleMouseDown = (idx, e) => {
    setDragging({ idx, offsetX: e.nativeEvent.offsetX, offsetY: e.nativeEvent.offsetY });
  };

  const handleMouseUp = () => setDragging(null);

  const handleMouseMove = (e) => {
    if (!dragging || !memeRef.current) return;
    const rect = memeRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragging.offsetX;
    const y = e.clientY - rect.top - dragging.offsetY;
    setTexts(texts =>
      texts.map((t, i) =>
        i === dragging.idx ? { ...t, pos: { x, y } } : t
      )
    );
  };

  useEffect(() => {
    if (dragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  });

  return (
    <div className="meme-generator-container">
      <h1 className="meme-generator-title">Meme Generator</h1>
      <div>
        {texts.map((t, idx) => (
          <div key={idx} className="meme-input-row">
            <input
              type="text"
              placeholder={`Text ${idx + 1}`}
              value={t.value}
              onChange={e => handleTextChange(idx, e.target.value)}
              className="meme-input"
            />
            <input
              type="color"
              value={t.color}
              onChange={e => handleColorChange(idx, e.target.value)}
              className="meme-color-picker"
              title="Pick text color"
            />
            <input
              type="number"
              min="10"
              max="80"
              value={t.fontSize}
              onChange={e => handleFontSizeChange(idx, e.target.value)}
              className="meme-fontsize-input"
              title="Font size"
              style={{ width: 60 }}
            />
            {texts.length > 1 && (
              <button
                onClick={() => removeText(idx)}
                className="meme-remove-btn"
                title="Remove this text"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="meme-btn-group">
        <button
          onClick={addText}
          className="meme-add-btn"
        >
          + Add Text
        </button>
        <button
          onClick={generateMeme}
          className="meme-generate-btn"
        >
          Generate Meme
        </button>
      </div>
      {memeImage && (
        <div
          ref={memeRef}
          className="meme-image-area"
        >
          <img
            src={memeImage}
            alt="Meme"
            draggable={false}
          />
          {texts.map((t, idx) => (
            <div
              key={idx}
              onMouseDown={e => handleMouseDown(idx, e)}
              className="meme-text"
              style={{
                left: t.pos.x,
                top: t.pos.y,
                color: t.color,
                fontSize: `${t.fontSize}px`,
                outline: dragging && dragging.idx === idx ? '2px solid #007bff' : 'none',
                background: dragging && dragging.idx === idx ? '#007bff22' : 'transparent'
              }}
            >
              {t.value}
            </div>
          ))}
        </div>
      )}
      <div className="meme-helper">
        Drag any text to position it anywhere on the meme.<br />
        Use the color picker and font size input for each text!
      </div>
    </div>
  );
}

export default MemeGenerator;