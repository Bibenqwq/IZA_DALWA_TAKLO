import React from 'react';
import { ArrowRight, Edit3, Trash2, Heart, Feather } from 'lucide-react';

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

export default function FeaturedSection({
  featuredEntry,
  dailyEntry,
  onReadPiece,
  onEditPiece,
  onDeletePiece,
  onToggleBookmark,
  isBookmarked
}) {
  return (
    <section className="featured-section" id="featured-section">
      <div className="section-container">
        <div className="featured-grid">
          {/* Featured Writing Card */}
          <div className="featured-column featured-column--main">
            <div className="section-header-compact">
              <span className="annotation-label">from the desk ♡</span>
              <h2 className="section-title-compact">featured piece</h2>
            </div>
            <div id="featured-letter-card" className="featured-card-wrapper">
              {featuredEntry ? (
                <div className="stationery-card stationery-card--featured">
                  <div className="stationery-card__wax-seal">♡</div>
                  <div className="stationery-card__meta">
                    <span className="category-badge">{featuredEntry.category}</span>
                    <span className="mood-tag">{featuredEntry.mood}</span>
                    <span className="date-label">{formatDate(featuredEntry.date)}</span>
                  </div>
                  <h3 className="stationery-card__title">{featuredEntry.title}</h3>
                  <p className="stationery-card__excerpt">
                    {featuredEntry.excerpt || (featuredEntry.body && featuredEntry.body.slice(0, 150) + '...')}
                  </p>
                  <div className="stationery-card__footer">
                    <button
                      className="btn btn--paper-action read-featured-btn"
                      onClick={() => onReadPiece(featuredEntry, true)}
                    >
                      <span>read this piece</span>
                      <ArrowRight size={16} />
                    </button>
                    <div className="stationery-card__actions">
                      <button
                        className="card-action-btn edit-piece-btn"
                        title="Edit this entry"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditPiece(featuredEntry);
                        }}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        className="card-action-btn card-action-btn--delete delete-piece-btn"
                        title="Delete this entry"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePiece(featuredEntry);
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        className={`bookmark-btn ${isBookmarked(featuredEntry.id) ? 'is-bookmarked' : ''}`}
                        title={isBookmarked(featuredEntry.id) ? "Remove from favorites" : "Save to favorites"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleBookmark(featuredEntry.id);
                        }}
                      >
                        <Heart size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stationery-card stationery-card--featured" style={{ textAlign: 'center', padding: '36px 20px' }}>
                  <div className="stationery-card__wax-seal">♡</div>
                  <h3 className="stationery-card__title" style={{ marginTop: '16px' }}>your desk is waiting for its first letter</h3>
                  <p className="stationery-card__excerpt" style={{ fontStyle: 'italic', margin: '12px auto 18px', maxWidth: '380px' }}>
                    no writings preserved yet. click below to write your very first letter, poem, or reflection.
                  </p>
                  <button className="btn btn--primary" onClick={() => onEditPiece(null)}>
                    <span>+ write your first piece</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Daily Piece & Quiet Prompt */}
          <div className="featured-column featured-column--daily">
            <div className="section-header-compact">
              <span className="annotation-label">today's reflection ♡</span>
              <h2 className="section-title-compact">daily selection</h2>
            </div>
            <div id="daily-piece-card" className="daily-card-wrapper">
              {dailyEntry ? (
                <div
                  className="stationery-card stationery-card--daily"
                  onClick={() => onReadPiece(dailyEntry, false)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="stationery-card__meta">
                    <span className="category-badge">{dailyEntry.category}</span>
                    <span className="date-label">{formatDate(dailyEntry.date)}</span>
                  </div>
                  <h3 className="stationery-card__title">{dailyEntry.title}</h3>
                  <p className="stationery-card__excerpt">
                    {dailyEntry.excerpt || (dailyEntry.body && dailyEntry.body.slice(0, 110) + '...')}
                  </p>
                  <div className="stationery-card__footer">
                    <span className="read-piece-link">
                      read today's piece <ArrowRight size={14} />
                    </span>
                    <button
                      className={`bookmark-btn ${isBookmarked(dailyEntry.id) ? 'is-bookmarked' : ''}`}
                      title={isBookmarked(dailyEntry.id) ? "Remove from favorites" : "Save to favorites"}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleBookmark(dailyEntry.id);
                      }}
                    >
                      <Heart size={16} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="stationery-card stationery-card--daily" style={{ textAlign: 'center', padding: '28px 18px' }}>
                  <p style={{ fontStyle: 'italic', color: '#9b9285', margin: 0 }}>
                    daily selections will appear here once you write your first pieces ♡
                  </p>
                </div>
              )}
            </div>

            {/* Gentle Quote Box */}
            <div className="philosophy-card">
              <span className="philosophy-card__quote">“Some words are too precious to disappear.”</span>
              <span className="philosophy-card__sub">— iza.dalawa.taklo</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
