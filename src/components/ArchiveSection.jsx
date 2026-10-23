import React, { useState, useMemo } from 'react';
import { PlusCircle, Sliders, Search, Heart, Feather, Edit3, Trash2 } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', label: 'all words' },
  { id: 'letters', label: 'letters' },
  { id: 'poetry', label: 'poetry' },
  { id: 'journal', label: 'journal' },
  { id: 'little-thoughts', label: 'little thoughts' },
  { id: 'memories', label: 'memories' },
  { id: 'unsent-letters', label: 'unsent letters' }
];

const MOODS = [
  { id: 'all', label: 'any feeling' },
  { id: 'soft', label: 'soft' },
  { id: 'hopeful', label: 'hopeful' },
  { id: 'nostalgic', label: 'nostalgic' },
  { id: 'bittersweet', label: 'bittersweet' },
  { id: 'sleepy', label: 'sleepy' },
  { id: 'happy', label: 'happy' },
  { id: 'unsent', label: 'unsent' }
];

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export default function ArchiveSection({
  entries,
  activeCategory,
  onSelectCategory,
  onWriteNew,
  onOpenDesk,
  onReadPiece,
  onEditPiece,
  onDeletePiece,
  onToggleBookmark,
  isBookmarked
}) {
  const [activeMood, setActiveMood] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [sortOrder, setSortOrder] = useState('newest');

  const filteredEntries = useMemo(() => {
    let list = entries.filter(e => e.published);

    if (activeCategory && activeCategory !== 'all') {
      list = list.filter(e => e.category === activeCategory);
    }

    if (activeMood && activeMood !== 'all') {
      list = list.filter(e => e.mood === activeMood);
    }

    if (onlyFavorites) {
      list = list.filter(e => isBookmarked(e.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(e =>
        (e.title && e.title.toLowerCase().includes(q)) ||
        (e.body && e.body.toLowerCase().includes(q)) ||
        (e.excerpt && e.excerpt.toLowerCase().includes(q)) ||
        (e.tags && e.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    list.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return list;
  }, [entries, activeCategory, activeMood, onlyFavorites, searchQuery, sortOrder, isBookmarked]);

  return (
    <section className="archive-section" id="archive-section">
      <div className="section-container">
        <div className="section-header">
          <span className="annotation-label">the written sanctuary ♡</span>
          <h2 className="section-title">the archive of quiet words</h2>
          <p className="section-subtitle">
            browse letters, stanzas, and fragments preserved across the seasons.
          </p>
        </div>

        {/* Archive Filter Toolbar */}
        <div className="archive-toolbar">
          {/* Action Banner */}
          <div className="archive-action-banner">
            <div className="archive-action-banner__left">
              <h3 className="archive-banner-title">personal poetry & journal collection</h3>
              <p className="archive-banner-sub">list, write, edit, and preserve your words.</p>
            </div>
            <div className="archive-action-banner__right">
              <button className="btn btn--primary trigger-write-new" id="archive-write-new-btn" onClick={onWriteNew}>
                <PlusCircle size={18} />
                <span>+ write new entry</span>
              </button>
              <button className="btn btn--secondary trigger-open-desk" id="archive-manage-desk-btn" onClick={onOpenDesk}>
                <Sliders size={18} />
                <span>manage all entries</span>
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="category-tabs" role="tablist" aria-label="Writing Categories">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                onClick={() => onSelectCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Mood Filter Row */}
          <div className="mood-filter-row">
            <span className="filter-label">mood:</span>
            <div className="mood-tags-container">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  className={`mood-filter-tag ${m.id !== 'all' ? `mood-filter-tag--${m.id}` : ''} ${activeMood === m.id ? 'active' : ''}`}
                  onClick={() => setActiveMood(m.id)}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search & Controls Subbar */}
          <div className="archive-controls-bar">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                id="archive-search-input"
                className="search-input"
                placeholder="filter by title, verse, or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="archive-right-controls">
              {/* Favorites Toggle */}
              <button
                className={`btn-toggle-favorites ${onlyFavorites ? 'active' : ''}`}
                id="archive-favorites-toggle"
                title="Show only bookmarked words"
                onClick={() => setOnlyFavorites(prev => !prev)}
              >
                <Heart size={16} fill={onlyFavorites ? "currentColor" : "none"} />
                <span>favorites</span>
              </button>

              {/* Sort Order Dropdown */}
              <div className="sort-wrapper">
                <label htmlFor="archive-sort-select" className="sr-only">Sort entries</label>
                <select
                  id="archive-sort-select"
                  className="sort-select"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="newest">newest first</option>
                  <option value="oldest">oldest first</option>
                </select>
              </div>

              <span className="archive-count" id="archive-count-label">
                {filteredEntries.length} {filteredEntries.length === 1 ? 'piece' : 'pieces'}
              </span>
            </div>
          </div>
        </div>

        {/* Archive Cards Grid */}
        <div className="archive-grid" id="archive-grid">
          {entries.length === 0 ? (
            <div className="empty-archive-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#9b9285' }}>
              <p style={{ fontStyle: 'italic', fontSize: '1.2rem', marginBottom: '16px' }}>
                no writings in your archive yet — your sanctuary is ready for your letters and poems ♡
              </p>
              <button className="btn btn--primary" onClick={onWriteNew} style={{ margin: '0 auto' }}>
                <PlusCircle size={18} />
                <span>+ write your first entry</span>
              </button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="empty-archive-state" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 20px', color: '#9b9285' }}>
              <p style={{ fontStyle: 'italic', fontSize: '1.2rem', marginBottom: '12px' }}>no writings found matching your filters.</p>
              <button className="btn btn--secondary" onClick={() => { setSearchQuery(''); setActiveMood('all'); setOnlyFavorites(false); onSelectCategory('all'); }}>
                clear filters
              </button>
            </div>
          ) : (
            filteredEntries.map(entry => {
              const bookmarked = isBookmarked(entry.id);
              const readTime = Math.max(1, Math.ceil((entry.body ? entry.body.split(/\s+/).length : 50) / 180));
              return (
                <article
                  key={entry.id}
                  className={`stationery-card stationery-card--archive stationery-card--${entry.category || 'letter'}`}
                >
                  <div className="stationery-card__wax-seal">♡</div>
                  <div className="stationery-card__meta">
                    <span className="category-badge">{entry.category}</span>
                    <span className="mood-tag">{entry.mood}</span>
                    <span className="date-label">{formatDate(entry.date)}</span>
                  </div>
                  <h3 className="stationery-card__title">{entry.title}</h3>
                  <p className="stationery-card__excerpt">
                    {entry.excerpt || (entry.body && entry.body.slice(0, 130) + '...')}
                  </p>
                  <div className="stationery-card__footer">
                    <button
                      className="btn btn--paper-action read-piece-btn"
                      onClick={() => onReadPiece(entry, false)}
                    >
                      <span>read</span>
                      <Feather size={14} />
                    </button>
                    <div className="stationery-card__actions">
                      <button
                        className="card-action-btn edit-piece-btn"
                        title="Edit this entry"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPiece(entry);
                        }}
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="card-action-btn card-action-btn--delete delete-piece-btn"
                        title="Delete this entry"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePiece(entry);
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                      <span className="read-time">{readTime} min</span>
                      <button
                        className={`bookmark-btn ${bookmarked ? 'is-bookmarked' : ''}`}
                        title={bookmarked ? "Remove from favorites" : "Save to favorites"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(entry.id);
                        }}
                      >
                        <Heart size={15} />
                      </button>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
