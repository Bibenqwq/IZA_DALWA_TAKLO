import React from 'react';
import { Plus, Edit3, Trash2 } from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
}

export default function StickyNotesSection({
  notes,
  onAddStickyNote,
  onEditStickyNote,
  onDeleteStickyNote
}) {
  return (
    <section className="little-notes-section" id="little-notes-section">
      <div className="section-container">
        <div className="section-header section-header--with-action">
          <div className="section-header__text">
            <span className="annotation-label">little notes on paper margins ♡</span>
            <h2 className="section-title">thoughts left on sticky paper</h2>
            <p className="section-subtitle">
              short reflections, pinned polaroid photos, and reminders to be gentle with yourself.
            </p>
          </div>
          <button
            className="btn btn--journal-write"
            id="btn-add-sticky-note"
            title="Add a sticky note with photo"
            onClick={onAddStickyNote}
          >
            <Plus size={16} />
            <span>+ add sticky note</span>
          </button>
        </div>

        <div className="little-notes-grid" id="little-notes-grid">
          {notes.length === 0 ? (
            <div
              className="little-note-card little-note--butter"
              style={{
                gridColumn: '1 / -1',
                maxWidth: '460px',
                margin: '20px auto',
                textAlign: 'center',
                padding: '36px 24px',
                cursor: 'default'
              }}
            >
              <div className="little-note-pin"></div>
              <p className="little-note-text" style={{ fontStyle: 'italic', marginBottom: '18px' }}>
                no sticky notes pinned yet. leave your first reflection, gentle reminder, or polaroid photo on the wall ♡
              </p>
              <button
                className="btn btn--journal-write"
                onClick={onAddStickyNote}
                style={{ margin: '0 auto', display: 'inline-flex' }}
              >
                <Plus size={16} />
                <span>+ pin your first note</span>
              </button>
            </div>
          ) : (
            notes.map(note => {
              const colorClass = note.color ? `little-note--${note.color}` : 'little-note--butter';
              return (
                <div key={note.id} className={`little-note-card ${colorClass}`}>
                  <div className="little-note-pin"></div>
                  <div className="little-note-actions">
                    <button
                      className="little-note-btn little-note-btn--edit"
                      title="Edit sticky note"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditStickyNote(note);
                      }}
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="little-note-btn little-note-btn--delete"
                      title="Delete sticky note"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteStickyNote(note);
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {note.image && (
                    <div className="little-note-image-wrapper">
                      <img src={note.image} alt="Sticky note polaroid" className="little-note-image" />
                    </div>
                  )}

                  <p className="little-note-text">{note.body}</p>
                  <div className="little-note-footer">
                    <span className="little-note-author">{note.author || 'iza ♡'}</span>
                    {note.date && (
                      <span className="little-note-date">{formatDate(note.date)}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
