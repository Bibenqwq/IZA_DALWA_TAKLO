import React, { useState, useEffect, useRef } from 'react';
import { X, Check, ImagePlus } from 'lucide-react';

const COLORS = [
  { id: 'butter', label: 'butter', title: 'Butter Cream' },
  { id: 'blush', label: 'blush', title: 'Blush Rose' },
  { id: 'matcha', label: 'matcha', title: 'Soft Matcha' },
  { id: 'lavender', label: 'lavender', title: 'Pale Lavender' },
  { id: 'sky', label: 'sky', title: 'Quiet Sky' }
];

// Helper to downscale image on offscreen canvas to avoid Supabase/LocalStorage payload limits
function compressImage(file, maxWidth = 640, maxHeight = 640, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = readerEvent.target.result;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function StickyNoteModal({
  isOpen,
  onClose,
  editingNote,
  onSaveNote,
  toast
}) {
  const [text, setText] = useState('');
  const [author, setAuthor] = useState('iza ♡');
  const [date, setDate] = useState('');
  const [color, setColor] = useState('butter');
  const [image, setImage] = useState(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (editingNote) {
      setText(editingNote.body || '');
      setAuthor(editingNote.author || 'iza ♡');
      setDate(editingNote.date || new Date().toISOString().slice(0, 10));
      setColor(editingNote.color || 'butter');
      setImage(editingNote.image || null);
    } else {
      setText('');
      setAuthor('iza ♡');
      setDate(new Date().toISOString().slice(0, 10));
      setColor('butter');
      setImage(null);
    }
  }, [editingNote, isOpen]);

  if (!isOpen) return null;

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast('Please select an image file (PNG, JPG, etc.)');
      return;
    }

    try {
      setIsProcessingImage(true);
      const compressedDataUrl = await compressImage(file);
      setImage(compressedDataUrl);
      toast('photo attached in polaroid frame ♡');
    } catch (err) {
      toast('Failed to process image, please try another');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) {
      toast('Please write your thought or reflection.');
      return;
    }

    const noteData = {
      id: editingNote ? editingNote.id : undefined,
      body: text.trim(),
      author: author.trim() || 'iza ♡',
      date: date || new Date().toISOString().slice(0, 10),
      color,
      image,
      category: 'little-thoughts',
      published: true
    };

    onSaveNote(noteData);
    toast(editingNote ? 'sticky note updated successfully ♡' : 'pinned to your sticky notes collection ♡');
    onClose();
  };

  return (
    <div className="modal-overlay" id="sticky-note-modal" role="dialog" aria-modal="true">
      <div className="modal-backdrop" onClick={onClose}></div>
      <div className="modal-window sticky-modal-window">
        <div className="modal-header">
          <div className="modal-header__left">
            <span className="modal-badge">sticky paper note ♡</span>
            <h3 className="modal-title" id="sticky-modal-title">
              {editingNote ? 'edit sticky paper note' : 'new sticky paper note'}
            </h3>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            id="sticky-modal-close-btn"
            aria-label="Close modal"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        <form id="sticky-note-form" className="sticky-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="sticky-note-text" className="form-label">your thought or reflection</label>
            <textarea
              id="sticky-note-text"
              className="form-textarea sticky-textarea"
              rows="4"
              placeholder="write what you wish to preserve on paper..."
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="sticky-note-author" className="form-label">author signature</label>
              <input
                type="text"
                id="sticky-note-author"
                className="form-input"
                placeholder="iza ♡"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
              />
            </div>
            <div className="form-group flex-1">
              <label htmlFor="sticky-note-date" className="form-label">date</label>
              <input
                type="date"
                id="sticky-note-date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          {/* Pastel Color Swatch Selector */}
          <div className="form-group">
            <label className="form-label">paper color & tint</label>
            <div className="sticky-color-picker" id="sticky-color-picker">
              {COLORS.map(c => (
                <label key={c.id} className={`sticky-color-swatch swatch-${c.id}`} title={c.title}>
                  <input
                    type="radio"
                    name="sticky-color"
                    value={c.id}
                    checked={color === c.id}
                    onChange={() => setColor(c.id)}
                  />
                  <span className="swatch-indicator"></span>
                  <span className="swatch-name">{c.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Photo / Image Upload Attachment */}
          <div className="form-group">
            <label className="form-label">attach photo (polaroid style)</label>
            <div
              className="sticky-upload-zone"
              id="sticky-upload-zone"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                id="sticky-image-input"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => handleImageFile(e.target.files && e.target.files[0])}
              />
              {!image ? (
                <div className="sticky-upload-prompt" id="sticky-upload-prompt">
                  <ImagePlus size={24} />
                  <span>{isProcessingImage ? 'processing photo...' : 'click to choose or upload a photo'}</span>
                  <small className="upload-hint">png, jpg, webp (auto-fitted for polaroid)</small>
                </div>
              ) : (
                <div className="sticky-upload-preview" id="sticky-upload-preview" onClick={(e) => e.stopPropagation()}>
                  <img src={image} id="sticky-preview-img" alt="Uploaded polaroid preview" />
                  <button
                    type="button"
                    className="btn-remove-attachment"
                    id="btn-remove-sticky-image"
                    title="Remove photo"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImage(null);
                    }}
                  >
                    <X size={14} /> remove photo
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn--subtle" id="sticky-modal-cancel-btn" onClick={onClose}>
              <span>cancel</span>
            </button>
            <button type="submit" className="btn btn--primary" id="sticky-modal-submit-btn">
              <Check size={16} />
              <span>{editingNote ? 'update sticky note ♡' : 'pin to sticky notes ♡'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
