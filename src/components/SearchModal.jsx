import React, { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, entries, onSelectEntry }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();
  const results = q ? entries.filter(e =>
    e.published && (
      (e.title && e.title.toLowerCase().includes(q)) ||
      (e.body && e.body.toLowerCase().includes(q)) ||
      (e.tags && e.tags.some(t => t.toLowerCase().includes(q))) ||
      (e.category && e.category.toLowerCase().includes(q))
    )
  ) : [];

  return (
    <div className="modal search-modal modal--open" id="search-modal" role="dialog" aria-modal="true" aria-label="Search writings">
      <div className="search-modal__container">
        <div className="search-modal__header">
          <Search size={18} className="search-icon" />
          <input
            ref={inputRef}
            type="text"
            id="modal-search-input"
            className="search-modal__input"
            placeholder="search letters, poems, stanzas, or tags..."
            autoComplete="off"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onClose();
            }}
          />
          <button className="btn-icon" id="modal-search-close" aria-label="Close search" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="search-modal__results" id="modal-search-results">
          {q && results.length === 0 ? (
            <div className="search-empty-state" style={{ padding: '30px', textAlign: 'center', color: '#9b9285', fontStyle: 'italic' }}>
              no quiet words found for "{query}".
            </div>
          ) : results.length > 0 ? (
            results.map(item => (
              <div
                key={item.id}
                className="search-result-item"
                onClick={() => {
                  onSelectEntry(item);
                  onClose();
                }}
                style={{ cursor: 'pointer' }}
              >
                <div className="search-result-meta">
                  <span className="category-badge">{item.category}</span>
                  <span className="search-result-date">{item.date}</span>
                </div>
                <h4 className="search-result-title">{item.title}</h4>
                <p className="search-result-snippet">
                  {item.excerpt || (item.body && item.body.slice(0, 100) + '...')}
                </p>
              </div>
            ))
          ) : (
            <div className="search-hint" style={{ padding: '24px', textAlign: 'center', color: '#b5aca1', fontSize: '0.9rem' }}>
              type keywords, emotions (e.g. nostalgic, soft), or titles...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
