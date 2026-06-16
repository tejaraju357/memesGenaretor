import { useState, useEffect, useRef, useCallback } from 'react';
import './Studio.css';
import { API_BASE_URL, getMemeUrl } from '../config';

const FONTS = ['Impact', 'Arial', 'Comic Sans MS', 'Verdana', 'Georgia', 'Courier New', 'Outfit', 'Inter', 'Times New Roman', 'Trebuchet MS'];
const STICKERS = ['😂','🔥','💀','👀','😭','🤣','😤','🤔','😎','🥴','💯','🚀','👑','⚡','🌈','🎉','🤦','🙃','😈','🧠','🫡','🤯','💅','🗿','🤌','🫶','💀','🎭','🐸','🦋'];
const FUNNY_TOPS = ['When you', 'Nobody:', 'Me:', 'POV:', 'That moment when', 'Legend has it', 'Day 1 of', 'Tell me you'];
const FUNNY_BOTS = ["hits different", "and it was never the same again", "every single time", "living rent free", "no context needed", "we don't talk about it", '💀💀💀', 'The audacity'];

const BG_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483', '#2d6a4f',
  '#6a0572', '#c77dff', '#ff006e', '#fb5607', '#ffbe0b',
  '#ffffff', '#000000',
];

export default function Studio({ initialState, onSaved, addToast }) {
  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const inlineInputRef = useRef(null);

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateSearch, setTemplateSearch] = useState('');
  const [currentImage, setCurrentImage] = useState(null);
  const [imgEl, setImgEl] = useState(null);

  // Canvas state
  const [texts, setTexts] = useState([
    { id: 1, value: 'TOP TEXT', x: 250, y: 55, color: '#ffffff', fontSize: 36, fontFamily: 'Impact', stroke: '#000000', strokeWidth: 3, bold: true, italic: false, underline: false, align: 'center', rotation: 0, bgBox: false, bgColor: '#000000', bgOpacity: 0.5, opacity: 1, shadowColor: '#000000', shadowBlur: 0, letterSpacing: 0 },
    { id: 2, value: 'BOTTOM TEXT', x: 250, y: 445, color: '#ffffff', fontSize: 36, fontFamily: 'Impact', stroke: '#000000', strokeWidth: 3, bold: true, italic: false, underline: false, align: 'center', rotation: 0, bgBox: false, bgColor: '#000000', bgOpacity: 0.5, opacity: 1, shadowColor: '#000000', shadowBlur: 0, letterSpacing: 0 },
  ]);
  const [stickers, setStickers] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(1);
  const [selectedStickerId, setSelectedStickerId] = useState(null);

  // Drawing
  const [tool, setTool] = useState('select');
  const [brushColor, setBrushColor] = useState('#ff0000');
  const [brushSize, setBrushSize] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPaths, setDrawPaths] = useState([]);

  // Dragging
  const [dragging, setDragging] = useState(null);
  const dragMoved = useRef(false);

  // Inline text editing
  const [inlineEdit, setInlineEdit] = useState(null); // { textId, screenX, screenY, canvasW, canvasH }

  // Canvas background (for blank canvas)
  const [canvasBg, setCanvasBg] = useState('#1a1a2e');
  const [showBgPicker, setShowBgPicker] = useState(false);

  const [saving, setSaving] = useState(false);
  const [imageSize, setImageSize] = useState({ w: 500, h: 500 });
  const [activeRightTab, setActiveRightTab] = useState('text'); // 'text' | 'layers'

  const nextId = useRef(10);

  // Fetch templates
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/templates`)
      .then(r => r.json())
      .then(data => { setTemplates(data); setLoadingTemplates(false); })
      .catch(() => setLoadingTemplates(false));
  }, []);

  // Load initial state (re-edit)
  useEffect(() => {
    if (initialState) {
      if (initialState.texts) setTexts(initialState.texts);
      if (initialState.stickers) setStickers(initialState.stickers);
      if (initialState.drawPaths) setDrawPaths(initialState.drawPaths);
      if (initialState.canvasBg) setCanvasBg(initialState.canvasBg);
      if (initialState.templateUrl) loadImageFromUrl(initialState.templateUrl);
    }
  }, [initialState]);

  // Load image
  const loadImageFromUrl = useCallback((url) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const maxW = 500, maxH = 500;
      let w = img.naturalWidth, h = img.naturalHeight;
      const ratio = Math.min(maxW / w, maxH / h, 1);
      w = Math.round(w * ratio); h = Math.round(h * ratio);
      setImageSize({ w, h });
      setImgEl(img);
      setCurrentImage(url);
    };
    img.onerror = () => addToast('Failed to load image', 'error');
    img.src = getMemeUrl(url);
  }, [addToast]);

  // Create blank canvas
  const createBlank = (bg = canvasBg) => {
    setImgEl(null);
    setCurrentImage(null);
    setImageSize({ w: 500, h: 500 });
    setCanvasBg(bg);
    setTexts([
      { id: 1, value: 'YOUR TEXT HERE', x: 250, y: 250, color: '#ffffff', fontSize: 40, fontFamily: 'Impact', stroke: '#000000', strokeWidth: 3, bold: true, italic: false, underline: false, align: 'center', rotation: 0, bgBox: false, bgColor: '#000000', bgOpacity: 0.5, opacity: 1, shadowColor: '#000000', shadowBlur: 0, letterSpacing: 0 }
    ]);
    setStickers([]);
    setDrawPaths([]);
    setSelectedTextId(1);
    setShowBgPicker(false);
    addToast('✨ Blank canvas created! Add your image or start editing.', 'success');
  };

  // Redraw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = imageSize.w;
    canvas.height = imageSize.h;
    ctx.clearRect(0, 0, imageSize.w, imageSize.h);

    // Background
    if (imgEl) {
      ctx.drawImage(imgEl, 0, 0, imageSize.w, imageSize.h);
    } else {
      ctx.fillStyle = canvasBg;
      ctx.fillRect(0, 0, imageSize.w, imageSize.h);
      // Subtle grid lines on blank canvas
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < imageSize.w; x += 50) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, imageSize.h); ctx.stroke();
      }
      for (let y = 0; y < imageSize.h; y += 50) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(imageSize.w, y); ctx.stroke();
      }
    }

    // Draw paths
    drawPaths.forEach(path => {
      if (!path.points || path.points.length < 2) return;
      ctx.save();
      ctx.globalCompositeOperation = path.erase ? 'destination-out' : 'source-over';
      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) ctx.lineTo(path.points[i].x, path.points[i].y);
      ctx.stroke();
      ctx.restore();
    });

    // Draw stickers
    stickers.forEach(s => {
      ctx.save();
      ctx.globalAlpha = s.opacity ?? 1;
      ctx.font = `${s.size}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (s.id === selectedStickerId) {
        ctx.shadowColor = '#7c3aed';
        ctx.shadowBlur = 14;
      }
      ctx.translate(s.x, s.y);
      ctx.rotate((s.rotation || 0) * Math.PI / 180);
      ctx.fillText(s.emoji, 0, 0);
      // Selection handles
      if (s.id === selectedStickerId) {
        ctx.shadowBlur = 0;
        ctx.strokeStyle = 'rgba(124,58,237,0.9)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 3]);
        ctx.beginPath();
        const r = s.size * 0.6;
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    });

    // Draw texts
    texts.forEach(t => {
      ctx.save();
      ctx.globalAlpha = t.opacity ?? 1;
      ctx.translate(t.x, t.y);
      ctx.rotate((t.rotation || 0) * Math.PI / 180);
      const fontStr = `${t.bold ? 'bold ' : ''}${t.italic ? 'italic ' : ''}${t.fontSize}px "${t.fontFamily}"`;
      ctx.font = fontStr;
      ctx.textAlign = t.align || 'center';
      ctx.textBaseline = 'middle';

      // Shadow
      if (t.shadowBlur > 0) {
        ctx.shadowColor = t.shadowColor || '#000000';
        ctx.shadowBlur = t.shadowBlur;
      }

      // Background box
      if (t.bgBox) {
        const metrics = ctx.measureText(t.value || ' ');
        const w = metrics.width;
        const pad = 10;
        const alpha = t.bgOpacity ?? 0.5;
        const hexToRgb = hex => {
          const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
          return `rgba(${r},${g},${b},${alpha})`;
        };
        ctx.shadowBlur = 0;
        ctx.fillStyle = hexToRgb(t.bgColor || '#000000');
        const offsetX = t.align === 'left' ? 0 : t.align === 'right' ? -w : -w/2;
        ctx.beginPath();
        ctx.roundRect(offsetX - pad, -t.fontSize / 2 - pad, w + pad * 2, t.fontSize + pad * 2, 6);
        ctx.fill();
        // Re-apply shadow for text on top
        if (t.shadowBlur > 0) { ctx.shadowColor = t.shadowColor || '#000000'; ctx.shadowBlur = t.shadowBlur; }
      }

      // Letter spacing helper (draw char by char if spacing)
      const drawTextWithSpacing = (text, x, y, stroke) => {
        if (!t.letterSpacing || t.letterSpacing === 0) {
          if (stroke) ctx.strokeText(text, x, y);
          else ctx.fillText(text, x, y);
          return;
        }
        let curX = x;
        const chars = Array.from(text);
        // pre-measure total for alignment
        let totalW = 0;
        chars.forEach(ch => { totalW += ctx.measureText(ch).width + t.letterSpacing; });
        if (t.align === 'center') curX = x - totalW / 2;
        else if (t.align === 'right') curX = x - totalW;
        ctx.textAlign = 'left';
        chars.forEach(ch => {
          if (stroke) ctx.strokeText(ch, curX, y);
          else ctx.fillText(ch, curX, y);
          curX += ctx.measureText(ch).width + t.letterSpacing;
        });
        ctx.textAlign = t.align || 'center';
      };

      if (t.strokeWidth > 0) {
        ctx.strokeStyle = t.stroke;
        ctx.lineWidth = t.strokeWidth * 2;
        ctx.lineJoin = 'round';
        drawTextWithSpacing(t.value || '', 0, 0, true);
      }
      ctx.fillStyle = t.color;
      drawTextWithSpacing(t.value || '', 0, 0, false);

      // Underline
      if (t.underline) {
        const metrics = ctx.measureText(t.value || ' ');
        const uw = metrics.width;
        const uy = t.fontSize * 0.55;
        const ux = t.align === 'left' ? 0 : t.align === 'right' ? -uw : -uw / 2;
        ctx.strokeStyle = t.color;
        ctx.lineWidth = Math.max(1, t.fontSize / 20);
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(ux, uy); ctx.lineTo(ux + uw, uy); ctx.stroke();
      }

      // Selection ring
      if (t.id === selectedTextId) {
        ctx.shadowBlur = 0;
        const metrics = ctx.measureText(t.value || ' ');
        const w = metrics.width;
        const pad = 12;
        const ox = t.align === 'left' ? 0 : t.align === 'right' ? -w : -w/2;
        ctx.strokeStyle = 'rgba(124,58,237,0.85)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 3]);
        ctx.beginPath();
        ctx.roundRect(ox - pad, -t.fontSize/2 - pad, w + pad*2, t.fontSize + pad*2, 6);
        ctx.stroke();
        ctx.setLineDash([]);
        // Corner handles
        ctx.fillStyle = '#7c3aed';
        const corners = [
          [ox - pad, -t.fontSize/2 - pad],
          [ox + w + pad, -t.fontSize/2 - pad],
          [ox - pad, t.fontSize/2 + pad],
          [ox + w + pad, t.fontSize/2 + pad],
        ];
        corners.forEach(([hx, hy]) => { ctx.beginPath(); ctx.arc(hx, hy, 4, 0, Math.PI*2); ctx.fill(); });
      }
      ctx.restore();
    });
  }, [imgEl, texts, stickers, drawPaths, selectedTextId, selectedStickerId, imageSize, canvasBg]);

  // Get canvas-relative position
  const getCanvasPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      screenX: clientX - rect.left,
      screenY: clientY - rect.top,
      rectW: rect.width,
      rectH: rect.height,
    };
  }, []);

  const hitTestText = useCallback((pos) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      ctx.font = `${t.bold ? 'bold ' : ''}${t.fontSize}px "${t.fontFamily}"`;
      const metrics = ctx.measureText(t.value || ' ');
      const w = metrics.width;
      const pad = 14;
      const ox = t.align === 'left' ? 0 : t.align === 'right' ? -w : -w/2;
      const dx = pos.x - t.x, dy = pos.y - t.y;
      if (dx >= ox - pad && dx <= ox + w + pad && Math.abs(dy) < t.fontSize/2 + pad) return t.id;
    }
    return null;
  }, [texts]);

  const hitTestSticker = useCallback((pos) => {
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      if (Math.hypot(pos.x - s.x, pos.y - s.y) < s.size * 0.6) return s.id;
    }
    return null;
  }, [stickers]);

  // Handle double-click → inline text edit
  const handleCanvasDblClick = useCallback((e) => {
    if (tool !== 'select') return;
    const pos = getCanvasPos(e);
    const textId = hitTestText(pos);
    if (!textId) return;

    const t = texts.find(tx => tx.id === textId);
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;

    setInlineEdit({
      textId,
      screenX: t.x * scaleX,
      screenY: t.y * scaleY,
      canvasW: rect.width,
      canvasH: rect.height,
    });
    setSelectedTextId(textId);

    setTimeout(() => inlineInputRef.current?.focus(), 30);
  }, [tool, getCanvasPos, hitTestText, texts]);

  // Close inline edit
  const closeInlineEdit = useCallback(() => {
    setInlineEdit(null);
  }, []);

  const handleCanvasMouseDown = useCallback((e) => {
    e.preventDefault();
    if (inlineEdit) { closeInlineEdit(); return; }
    const pos = getCanvasPos(e);
    dragMoved.current = false;

    if (tool === 'draw' || tool === 'erase') {
      setIsDrawing(true);
      setDrawPaths(prev => [...prev, { points: [pos], color: brushColor, size: brushSize, erase: tool === 'erase' }]);
      return;
    }

    const textId = hitTestText(pos);
    if (textId) {
      setSelectedTextId(textId);
      setSelectedStickerId(null);
      const t = texts.find(tx => tx.id === textId);
      setDragging({ type: 'text', id: textId, origX: t.x, origY: t.y, startX: pos.x, startY: pos.y });
      setActiveRightTab('text');
      return;
    }
    const stickerId = hitTestSticker(pos);
    if (stickerId) {
      setSelectedStickerId(stickerId);
      setSelectedTextId(null);
      const s = stickers.find(st => st.id === stickerId);
      setDragging({ type: 'sticker', id: stickerId, origX: s.x, origY: s.y, startX: pos.x, startY: pos.y });
      return;
    }
    setSelectedTextId(null);
    setSelectedStickerId(null);
  }, [inlineEdit, closeInlineEdit, getCanvasPos, tool, brushColor, brushSize, hitTestText, hitTestSticker, texts, stickers]);

  const handleCanvasMouseMove = useCallback((e) => {
    e.preventDefault();
    const pos = getCanvasPos(e);

    if (isDrawing && (tool === 'draw' || tool === 'erase')) {
      setDrawPaths(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], points: [...updated[updated.length - 1].points, pos] };
        return updated;
      });
      return;
    }
    if (dragging) {
      dragMoved.current = true;
      const dx = pos.x - dragging.startX;
      const dy = pos.y - dragging.startY;
      if (dragging.type === 'text') {
        setTexts(prev => prev.map(t => t.id === dragging.id ? { ...t, x: dragging.origX + dx, y: dragging.origY + dy } : t));
      } else {
        setStickers(prev => prev.map(s => s.id === dragging.id ? { ...s, x: dragging.origX + dx, y: dragging.origY + dy } : s));
      }
    }
  }, [dragging, isDrawing, tool, getCanvasPos]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDrawing(false);
    setDragging(null);
  }, []);

  useEffect(() => {
    document.addEventListener('mouseup', handleCanvasMouseUp);
    document.addEventListener('mousemove', handleCanvasMouseMove);
    document.addEventListener('touchend', handleCanvasMouseUp);
    document.addEventListener('touchmove', handleCanvasMouseMove, { passive: false });
    return () => {
      document.removeEventListener('mouseup', handleCanvasMouseUp);
      document.removeEventListener('mousemove', handleCanvasMouseMove);
      document.removeEventListener('touchend', handleCanvasMouseUp);
      document.removeEventListener('touchmove', handleCanvasMouseMove);
    };
  }, [handleCanvasMouseMove, handleCanvasMouseUp]);

  const addText = () => {
    const id = ++nextId.current;
    setTexts(prev => [...prev, {
      id, value: 'New Text', x: imageSize.w / 2, y: imageSize.h / 2,
      color: '#ffffff', fontSize: 32, fontFamily: 'Impact',
      stroke: '#000000', strokeWidth: 3, bold: true, italic: false, underline: false,
      align: 'center', rotation: 0, bgBox: false, bgColor: '#000000', bgOpacity: 0.5,
      opacity: 1, shadowColor: '#000000', shadowBlur: 0, letterSpacing: 0
    }]);
    setSelectedTextId(id);
    setActiveRightTab('text');
    addToast('Text layer added! Double-click it on canvas to type.', 'success');
  };

  const removeText = (id) => {
    setTexts(prev => prev.filter(t => t.id !== id));
    if (selectedTextId === id) setSelectedTextId(null);
  };

  const updateText = (id, key, value) => {
    setTexts(prev => prev.map(t => t.id === id ? { ...t, [key]: value } : t));
  };

  const duplicateText = (id) => {
    const src = texts.find(t => t.id === id);
    if (!src) return;
    const newId = ++nextId.current;
    setTexts(prev => [...prev, { ...src, id: newId, x: src.x + 15, y: src.y + 15 }]);
    setSelectedTextId(newId);
    addToast('Layer duplicated!', 'success');
  };

  const addSticker = (emoji) => {
    const id = ++nextId.current;
    setStickers(prev => [...prev, { id, emoji, x: imageSize.w / 2, y: imageSize.h / 2, size: 64, rotation: 0, opacity: 1 }]);
    setSelectedStickerId(id);
    addToast(`${emoji} sticker added!`, 'success');
  };

  const removeSticker = (id) => {
    setStickers(prev => prev.filter(s => s.id !== id));
    setSelectedStickerId(null);
  };

  const clearDrawings = () => { setDrawPaths([]); addToast('Drawings cleared', 'info'); };
  const undoLastDraw = () => { setDrawPaths(prev => prev.slice(0, -1)); };

  const surpriseMe = () => {
    const top = FUNNY_TOPS[Math.floor(Math.random() * FUNNY_TOPS.length)];
    const bot = FUNNY_BOTS[Math.floor(Math.random() * FUNNY_BOTS.length)];
    setTexts(prev => {
      const updated = [...prev];
      if (updated[0]) updated[0] = { ...updated[0], value: top };
      if (updated[1]) updated[1] = { ...updated[1], value: bot };
      return updated;
    });
    if (templates.length > 0) loadImageFromUrl(templates[Math.floor(Math.random() * templates.length)].url);
    addToast('😂 Surprise meme generated!', 'success');
  };

  const downloadMeme = async (save = false) => {
    if (inlineEdit) closeInlineEdit();
    await new Promise(r => setTimeout(r, 50));
    const canvas = canvasRef.current;
    const imageData = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `meme-${Date.now()}.png`;
    link.href = imageData;
    link.click();
    addToast('🎉 Meme downloaded!', 'success');
    if (save) await saveMeme(imageData);
  };

  const saveMeme = async (imageDataOverride) => {
    if (inlineEdit) closeInlineEdit();
    setSaving(true);
    try {
      const canvas = canvasRef.current;
      const imageData = imageDataOverride || canvas.toDataURL('image/png');
      const state = { texts, stickers, drawPaths, templateUrl: currentImage, canvasBg };
      const res = await fetch(`${API_BASE_URL}/api/memes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData, state, templateUrl: currentImage, title: `Meme - ${new Date().toLocaleTimeString()}` })
      });
      const data = await res.json();
      if (data.success) { addToast('✅ Saved to gallery!', 'success'); if (onSaved) onSaved(data.meme); }
      else throw new Error(data.error);
    } catch { addToast('Failed to save meme', 'error'); }
    finally { setSaving(false); }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => loadImageFromUrl(ev.target.result);
    reader.readAsDataURL(file);
    addToast('Custom image loaded!', 'success');
    e.target.value = '';
  };

  const filteredTemplates = templates.filter(t => t.name.toLowerCase().includes(templateSearch.toLowerCase()));
  const selectedText = texts.find(t => t.id === selectedTextId);
  const selectedSticker = stickers.find(s => s.id === selectedStickerId);
  const inlineText = inlineEdit ? texts.find(t => t.id === inlineEdit.textId) : null;

  return (
    <div className="studio-layout">
      {/* ===== LEFT PANEL ===== */}
      <div className="studio-left-panel">

        {/* Templates section */}
        <div className="studio-section">
          <div className="studio-section-header">
            <span className="studio-section-title">🖼️ Templates</span>
            <div style={{ display: 'flex', gap: 5 }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: 'pointer' }} title="Upload your own image">
                📁 Upload
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setShowBgPicker(v => !v)}
                title="Create blank canvas"
              >
                ✨ Create
              </button>
            </div>
          </div>

          {/* Blank canvas creator */}
          {showBgPicker && (
            <div className="bg-picker-panel animate-fade">
              <div className="bg-picker-label">Choose background color:</div>
              <div className="bg-color-swatches">
                {BG_COLORS.map(c => (
                  <button
                    key={c}
                    className={`bg-swatch ${canvasBg === c ? 'selected' : ''}`}
                    style={{ background: c, border: canvasBg === c ? '2px solid #7c3aed' : '2px solid rgba(255,255,255,0.1)' }}
                    onClick={() => setCanvasBg(c)}
                    title={c}
                  />
                ))}
                <input
                  type="color"
                  value={canvasBg}
                  onChange={e => setCanvasBg(e.target.value)}
                  style={{ width: 32, height: 32, borderRadius: 8, cursor: 'pointer', border: 'none', background: 'none' }}
                  title="Custom color"
                />
              </div>
              <button className="btn btn-primary btn-sm" style={{ width: '100%', marginTop: 8 }} onClick={() => createBlank(canvasBg)}>
                🎨 Create Blank Canvas
              </button>
            </div>
          )}

          <input
            className="input-styled"
            placeholder="Search 500+ templates..."
            value={templateSearch}
            onChange={e => setTemplateSearch(e.target.value)}
            style={{ marginBottom: 8 }}
          />
          <div className="template-grid">
            {loadingTemplates
              ? [...Array(6)].map((_, i) => <div key={i} className="skeleton template-thumb" />)
              : filteredTemplates.slice(0, 40).map(t => (
                <img
                  key={t.id} src={t.url} alt={t.name}
                  className={`template-thumb ${currentImage === t.url ? 'selected' : ''}`}
                  title={t.name}
                  onClick={() => loadImageFromUrl(t.url)}
                  loading="lazy"
                />
              ))
            }
          </div>
        </div>

        {/* Tools section */}
        <div className="studio-section">
          <div className="studio-section-title">🛠️ Tools</div>
          <div className="tool-row">
            {[
              { id: 'select', icon: '🖱️', label: 'Select' },
              { id: 'draw', icon: '✏️', label: 'Draw' },
              { id: 'erase', icon: '🧹', label: 'Erase' },
            ].map(t => (
              <button key={t.id} className={`tool-btn ${tool === t.id ? 'active' : ''}`} onClick={() => setTool(t.id)}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          {(tool === 'draw' || tool === 'erase') && (
            <div className="draw-controls">
              <div className="draw-row">
                <label className="draw-label">Color</label>
                <input type="color" value={brushColor} onChange={e => setBrushColor(e.target.value)}
                  style={{ width: 40, height: 32, cursor: 'pointer', background: 'none', border: 'none', borderRadius: 6 }} />
              </div>
              <div className="draw-row">
                <label className="draw-label">Size: {brushSize}px</label>
                <input type="range" min="1" max="60" value={brushSize}
                  onChange={e => setBrushSize(Number(e.target.value))} style={{ flex: 1, accentColor: '#7c3aed' }} />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={undoLastDraw}>↩️ Undo</button>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={clearDrawings}>🗑️ Clear</button>
              </div>
            </div>
          )}
        </div>

        {/* Stickers section */}
        <div className="studio-section">
          <div className="studio-section-title">😂 Stickers</div>
          <div className="sticker-grid">
            {STICKERS.map(s => (
              <button key={s} className="sticker-btn" onClick={() => addSticker(s)} title={`Add ${s}`}>{s}</button>
            ))}
          </div>
          {selectedSticker && (
            <div className="sticker-controls">
              <div className="draw-row">
                <label className="draw-label">Size: {selectedSticker.size}px</label>
                <input type="range" min="16" max="240" value={selectedSticker.size}
                  onChange={e => setStickers(prev => prev.map(s => s.id === selectedStickerId ? { ...s, size: Number(e.target.value) } : s))}
                  style={{ flex: 1, accentColor: '#7c3aed' }} />
              </div>
              <div className="draw-row">
                <label className="draw-label">Rotate: {selectedSticker.rotation || 0}°</label>
                <input type="range" min="-180" max="180" value={selectedSticker.rotation || 0}
                  onChange={e => setStickers(prev => prev.map(s => s.id === selectedStickerId ? { ...s, rotation: Number(e.target.value) } : s))}
                  style={{ flex: 1, accentColor: '#7c3aed' }} />
              </div>
              <div className="draw-row">
                <label className="draw-label">Opacity: {Math.round((selectedSticker.opacity ?? 1) * 100)}%</label>
                <input type="range" min="0.1" max="1" step="0.05" value={selectedSticker.opacity ?? 1}
                  onChange={e => setStickers(prev => prev.map(s => s.id === selectedStickerId ? { ...s, opacity: Number(e.target.value) } : s))}
                  style={{ flex: 1, accentColor: '#7c3aed' }} />
              </div>
              <button className="btn btn-danger btn-sm" style={{ width: '100%' }} onClick={() => removeSticker(selectedStickerId)}>
                🗑️ Remove Sticker
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== CENTER: CANVAS ===== */}
      <div className="studio-center">
        <div className="canvas-topbar">
          <button className="btn btn-secondary btn-sm" onClick={surpriseMe}>🎲 Surprise Me!</button>
          {!imgEl && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowBgPicker(v => !v)}>
              🎨 BG Color
            </button>
          )}
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            <button className="btn btn-secondary btn-sm" onClick={() => saveMeme()} disabled={saving}>
              {saving ? '⏳' : '💾'} Save
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => downloadMeme(true)}>
              ⬇️ Download
            </button>
          </div>
        </div>

        <div className="canvas-wrapper" ref={canvasWrapperRef} style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={imageSize.w}
            height={imageSize.h}
            className="meme-canvas"
            style={{
              cursor:
                tool === 'draw' ? 'crosshair' :
                tool === 'erase' ? 'cell' :
                dragging ? 'grabbing' : 'default'
            }}
            onMouseDown={handleCanvasMouseDown}
            onTouchStart={handleCanvasMouseDown}
            onDoubleClick={handleCanvasDblClick}
          />

          {/* INLINE TEXT EDITOR OVERLAY */}
          {inlineEdit && inlineText && (
            <div
              className="inline-edit-overlay"
              style={{
                position: 'absolute',
                left: inlineEdit.screenX,
                top: inlineEdit.screenY,
                transform: `translate(-50%, -50%) rotate(${inlineText.rotation || 0}deg)`,
                zIndex: 20,
              }}
            >
              <textarea
                ref={inlineInputRef}
                className="inline-edit-input"
                value={inlineText.value}
                onChange={e => updateText(inlineEdit.textId, 'value', e.target.value)}
                onKeyDown={e => { if (e.key === 'Escape' || (e.key === 'Enter' && !e.shiftKey)) { e.preventDefault(); closeInlineEdit(); } }}
                style={{
                  fontFamily: inlineText.fontFamily,
                  fontSize: `${inlineText.fontSize * (inlineEdit.canvasW / imageSize.w)}px`,
                  color: inlineText.color,
                  fontWeight: inlineText.bold ? '900' : '400',
                  fontStyle: inlineText.italic ? 'italic' : 'normal',
                  textAlign: inlineText.align || 'center',
                  WebkitTextStroke: inlineText.strokeWidth > 0 ? `${inlineText.strokeWidth}px ${inlineText.stroke}` : 'none',
                  letterSpacing: `${inlineText.letterSpacing || 0}px`,
                }}
                rows={1}
                spellCheck={false}
              />
              <div className="inline-edit-hint">↵ Enter to confirm · Esc to cancel</div>
            </div>
          )}
        </div>

        <div className="canvas-hint">
          {tool === 'select' && '🖱️ Click to select · Drag to move · Double-click text to type'}
          {tool === 'draw' && '✏️ Click and drag to draw · Use Undo to remove last stroke'}
          {tool === 'erase' && '🧹 Click and drag to erase drawings'}
        </div>
      </div>

      {/* ===== RIGHT PANEL: TEXT EDITOR ===== */}
      <div className="studio-right-panel">

        {/* Tab switcher */}
        <div className="right-panel-tabs">
          <button className={`rpanel-tab ${activeRightTab === 'text' ? 'active' : ''}`} onClick={() => setActiveRightTab('text')}>
            📝 Text Editor
          </button>
          <button className={`rpanel-tab ${activeRightTab === 'layers' ? 'active' : ''}`} onClick={() => setActiveRightTab('layers')}>
            📚 Layers
          </button>
        </div>

        {/* LAYERS TAB */}
        {activeRightTab === 'layers' && (
          <div className="studio-section animate-fade">
            <div className="studio-section-header">
              <span className="studio-section-title">📚 All Layers</span>
              <button className="btn btn-primary btn-sm" onClick={addText}>+ Text</button>
            </div>

            {texts.length === 0 && stickers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                No layers yet. Add text or stickers!
              </div>
            )}

            <div className="layers-list">
              {[...texts].reverse().map(t => (
                <div key={t.id}
                  className={`layer-item ${t.id === selectedTextId ? 'selected' : ''}`}
                  onClick={() => { setSelectedTextId(t.id); setSelectedStickerId(null); setActiveRightTab('text'); }}
                >
                  <span className="layer-type-icon">T</span>
                  <span className="layer-preview">{t.value || '(empty)'}</span>
                  <div className="layer-actions">
                    <button className="layer-action-btn" title="Duplicate" onClick={e => { e.stopPropagation(); duplicateText(t.id); }}>⧉</button>
                    <button className="layer-action-btn danger" title="Delete" onClick={e => { e.stopPropagation(); removeText(t.id); }}>×</button>
                  </div>
                </div>
              ))}
              {[...stickers].reverse().map(s => (
                <div key={s.id}
                  className={`layer-item ${s.id === selectedStickerId ? 'selected' : ''}`}
                  onClick={() => { setSelectedStickerId(s.id); setSelectedTextId(null); }}
                >
                  <span className="layer-type-icon">{s.emoji}</span>
                  <span className="layer-preview">Sticker</span>
                  <div className="layer-actions">
                    <button className="layer-action-btn danger" title="Delete" onClick={e => { e.stopPropagation(); removeSticker(s.id); }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEXT EDITOR TAB */}
        {activeRightTab === 'text' && (
          <>
            <div className="studio-section">
              <div className="studio-section-header">
                <span className="studio-section-title">📝 Text Layers</span>
                <button className="btn btn-primary btn-sm" onClick={addText}>+ Add</button>
              </div>
              <div className="text-layers-list">
                {texts.map(t => (
                  <div key={t.id}
                    className={`text-layer-item ${t.id === selectedTextId ? 'selected' : ''}`}
                    onClick={() => setSelectedTextId(t.id)}
                  >
                    <span className="text-layer-preview">{t.value || '(empty)'}</span>
                    <button className="btn btn-sm" style={{ background: 'rgba(124,58,237,0.15)', color: '#a78bfa', marginLeft: 2, padding: '3px 8px' }}
                      title="Duplicate"
                      onClick={e => { e.stopPropagation(); duplicateText(t.id); }}>⧉</button>
                    <button className="btn btn-icon" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                      onClick={e => { e.stopPropagation(); removeText(t.id); }}>×</button>
                  </div>
                ))}
              </div>
            </div>

            {selectedText && (
              <div className="studio-section text-editor animate-fade">
                <div className="studio-section-title">✏️ Edit: <span style={{ color: 'var(--accent-light)', fontFamily: 'monospace' }}>{selectedText.value?.slice(0,20) || '...'}</span></div>

                {/* Inline hint */}
                <div className="inline-hint-bar">
                  💡 Double-click text on canvas to edit inline
                </div>

                {/* Text content */}
                <div className="editor-field">
                  <label className="editor-label">Text Content</label>
                  <textarea
                    className="input-styled"
                    rows={2}
                    value={selectedText.value}
                    onChange={e => updateText(selectedTextId, 'value', e.target.value)}
                    placeholder="Type your meme text..."
                    style={{ resize: 'vertical', minHeight: 52 }}
                  />
                </div>

                {/* Font + Size */}
                <div className="editor-row">
                  <div className="editor-field half">
                    <label className="editor-label">Font Family</label>
                    <select className="input-styled" value={selectedText.fontFamily}
                      onChange={e => updateText(selectedTextId, 'fontFamily', e.target.value)}>
                      {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                    </select>
                  </div>
                  <div className="editor-field half">
                    <label className="editor-label">Size: {selectedText.fontSize}px</label>
                    <input type="range" min="10" max="120" value={selectedText.fontSize}
                      onChange={e => updateText(selectedTextId, 'fontSize', Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#7c3aed' }} />
                  </div>
                </div>

                {/* Colors */}
                <div className="editor-row">
                  <div className="editor-field half">
                    <label className="editor-label">Text Color</label>
                    <input type="color" value={selectedText.color}
                      onChange={e => updateText(selectedTextId, 'color', e.target.value)}
                      className="color-input-full" />
                  </div>
                  <div className="editor-field half">
                    <label className="editor-label">Stroke Color</label>
                    <input type="color" value={selectedText.stroke}
                      onChange={e => updateText(selectedTextId, 'stroke', e.target.value)}
                      className="color-input-full" />
                  </div>
                </div>

                {/* Stroke + Opacity */}
                <div className="editor-field">
                  <label className="editor-label">Stroke Width: {selectedText.strokeWidth}px</label>
                  <input type="range" min="0" max="12" value={selectedText.strokeWidth}
                    onChange={e => updateText(selectedTextId, 'strokeWidth', Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7c3aed' }} />
                </div>

                <div className="editor-field">
                  <label className="editor-label">Opacity: {Math.round((selectedText.opacity ?? 1) * 100)}%</label>
                  <input type="range" min="0.05" max="1" step="0.05" value={selectedText.opacity ?? 1}
                    onChange={e => updateText(selectedTextId, 'opacity', Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7c3aed' }} />
                </div>

                {/* Letter spacing */}
                <div className="editor-field">
                  <label className="editor-label">Letter Spacing: {selectedText.letterSpacing || 0}px</label>
                  <input type="range" min="-5" max="30" step="0.5" value={selectedText.letterSpacing || 0}
                    onChange={e => updateText(selectedTextId, 'letterSpacing', Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#06b6d4' }} />
                </div>

                {/* Rotation */}
                <div className="editor-field">
                  <label className="editor-label">Rotation: {selectedText.rotation}°</label>
                  <input type="range" min="-180" max="180" value={selectedText.rotation}
                    onChange={e => updateText(selectedTextId, 'rotation', Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#7c3aed' }} />
                </div>

                {/* Shadow */}
                <div className="editor-row">
                  <div className="editor-field half">
                    <label className="editor-label">Shadow Color</label>
                    <input type="color" value={selectedText.shadowColor || '#000000'}
                      onChange={e => updateText(selectedTextId, 'shadowColor', e.target.value)}
                      className="color-input-full" />
                  </div>
                  <div className="editor-field half">
                    <label className="editor-label">Shadow Blur: {selectedText.shadowBlur || 0}px</label>
                    <input type="range" min="0" max="30" value={selectedText.shadowBlur || 0}
                      onChange={e => updateText(selectedTextId, 'shadowBlur', Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#ec4899' }} />
                  </div>
                </div>

                {/* Align + Style */}
                <div className="editor-row" style={{ gap: 8 }}>
                  <div className="editor-field half">
                    <label className="editor-label">Align</label>
                    <div className="align-btns">
                      {[
                        { v: 'left', icon: '⬅' },
                        { v: 'center', icon: '↔' },
                        { v: 'right', icon: '➡' },
                      ].map(a => (
                        <button key={a.v} className={`align-btn ${selectedText.align === a.v ? 'active' : ''}`}
                          onClick={() => updateText(selectedTextId, 'align', a.v)}>{a.icon}</button>
                      ))}
                    </div>
                  </div>
                  <div className="editor-field half">
                    <label className="editor-label">Style</label>
                    <div className="style-btns">
                      <button className={`style-btn ${selectedText.bold ? 'active' : ''}`}
                        style={{ fontWeight: 'bold' }}
                        onClick={() => updateText(selectedTextId, 'bold', !selectedText.bold)}>B</button>
                      <button className={`style-btn ${selectedText.italic ? 'active' : ''}`}
                        style={{ fontStyle: 'italic' }}
                        onClick={() => updateText(selectedTextId, 'italic', !selectedText.italic)}>I</button>
                      <button className={`style-btn ${selectedText.underline ? 'active' : ''}`}
                        style={{ textDecoration: 'underline' }}
                        onClick={() => updateText(selectedTextId, 'underline', !selectedText.underline)}>U</button>
                      <button className={`style-btn ${selectedText.bgBox ? 'active' : ''}`}
                        onClick={() => updateText(selectedTextId, 'bgBox', !selectedText.bgBox)} title="Background box">▣</button>
                    </div>
                  </div>
                </div>

                {/* Background box controls */}
                {selectedText.bgBox && (
                  <div className="editor-row">
                    <div className="editor-field half">
                      <label className="editor-label">Box Color</label>
                      <input type="color" value={selectedText.bgColor || '#000000'}
                        onChange={e => updateText(selectedTextId, 'bgColor', e.target.value)}
                        className="color-input-full" />
                    </div>
                    <div className="editor-field half">
                      <label className="editor-label">Box Opacity: {Math.round((selectedText.bgOpacity ?? 0.5) * 100)}%</label>
                      <input type="range" min="0.05" max="1" step="0.05" value={selectedText.bgOpacity ?? 0.5}
                        onChange={e => updateText(selectedTextId, 'bgOpacity', Number(e.target.value))}
                        style={{ width: '100%', accentColor: '#f59e0b' }} />
                    </div>
                  </div>
                )}

                {/* X/Y position */}
                <div className="editor-row" style={{ gap: 8 }}>
                  <div className="editor-field half">
                    <label className="editor-label">X: {Math.round(selectedText.x)}</label>
                    <input type="range" min="0" max={imageSize.w} value={selectedText.x}
                      onChange={e => updateText(selectedTextId, 'x', Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#06b6d4' }} />
                  </div>
                  <div className="editor-field half">
                    <label className="editor-label">Y: {Math.round(selectedText.y)}</label>
                    <input type="range" min="0" max={imageSize.h} value={selectedText.y}
                      onChange={e => updateText(selectedTextId, 'y', Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#06b6d4' }} />
                  </div>
                </div>

                {/* Quick position presets */}
                <div className="editor-field">
                  <label className="editor-label">Quick Position</label>
                  <div className="position-grid">
                    {[
                      { label: '↖', x: imageSize.w * 0.1, y: imageSize.h * 0.1 },
                      { label: '↑', x: imageSize.w * 0.5, y: imageSize.h * 0.1 },
                      { label: '↗', x: imageSize.w * 0.9, y: imageSize.h * 0.1 },
                      { label: '←', x: imageSize.w * 0.1, y: imageSize.h * 0.5 },
                      { label: '⊕', x: imageSize.w * 0.5, y: imageSize.h * 0.5 },
                      { label: '→', x: imageSize.w * 0.9, y: imageSize.h * 0.5 },
                      { label: '↙', x: imageSize.w * 0.1, y: imageSize.h * 0.9 },
                      { label: '↓', x: imageSize.w * 0.5, y: imageSize.h * 0.9 },
                      { label: '↘', x: imageSize.w * 0.9, y: imageSize.h * 0.9 },
                    ].map(p => (
                      <button key={p.label} className="pos-btn"
                        onClick={() => { updateText(selectedTextId, 'x', Math.round(p.x)); updateText(selectedTextId, 'y', Math.round(p.y)); }}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duplicate & Reset buttons */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                    onClick={() => duplicateText(selectedTextId)}>⧉ Duplicate</button>
                  <button className="btn btn-danger btn-sm" style={{ flex: 1 }}
                    onClick={() => removeText(selectedTextId)}>🗑️ Delete</button>
                </div>
              </div>
            )}

            {!selectedText && !selectedSticker && (
              <div className="studio-section" style={{ textAlign: 'center', padding: '24px 16px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>👈</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Click a text layer above or click a text on the canvas to edit it</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: 8 }}>
                  💡 Double-click text on canvas to type inline
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
