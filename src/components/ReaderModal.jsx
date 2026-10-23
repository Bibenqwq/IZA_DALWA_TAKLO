import React, { useState, useEffect } from 'react';
import { Edit3, Trash2, Heart, Copy, Share2, Download, X, ArrowLeft, ArrowRight } from 'lucide-react';

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

export default function ReaderModal({
  isOpen,
  entry,
  playEnvelopeAnimation,
  onClose,
  onEdit,
  onDelete,
  onToggleBookmark,
  isBookmarked,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  toast
}) {
  const [animStage, setAnimStage] = useState(false);

  useEffect(() => {
    if (isOpen && playEnvelopeAnimation) {
      setAnimStage(true);
      const timer = setTimeout(() => {
        setAnimStage(false);
      }, 1600);
      return () => clearTimeout(timer);
    } else {
      setAnimStage(false);
    }
  }, [isOpen, playEnvelopeAnimation]);

  if (!isOpen || !entry) return null;

  const bookmarked = isBookmarked(entry.id);

  const handleCopy = () => {
    const textToCopy = `${entry.title}\n\n${entry.body}\n\n— iza.dalawa.taklo`;
    navigator.clipboard.writeText(textToCopy);
    toast("copied to clipboard ♡");
  };

  const handleShare = () => {
    const url = `${window.location.origin}${window.location.pathname}?piece=${encodeURIComponent(entry.id)}`;
    navigator.clipboard.writeText(url);
    toast("letter link copied to clipboard ♡");
  };

  const handleExport = () => {
    const md = `# ${entry.title}\n\n*Date: ${entry.date || 'Undated'}*  \n*Category: ${entry.category}*  \n*Mood: ${entry.mood || 'soft'}*\n\n---\n\n${entry.body}\n\n---\n*Preserved in iza.dalawa.taklo journal*\n`;
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("piece exported as markdown ♡");
  };

  return (
    <div className={`modal reader-modal modal--open`} id="reader-modal" role="dialog" aria-modal="true">
      <div className="reader-modal__backdrop" onClick={onClose}></div>
      <div className="reader-modal__container">
        {/* Stage A: Envelope Opening Animation Sequence */}
        {animStage && (
          <div className="reader-envelope-stage" id="reader-envelope-stage">
            <div className="envelope-box open">
              <div className="envelope-flap" id="envelope-flap"></div>
              <div className="envelope-paper-peeking">
                <span className="envelope-stamp">iza.dalawa.taklo</span>
              </div>
              <div className="envelope-seal-badge">♡</div>
            </div>
            <button
              className="btn btn--subtle skip-envelope-btn"
              id="skip-envelope-animation"
              onClick={() => setAnimStage(false)}
            >
              <span>skip animation</span>
            </button>
          </div>
        )}

        {/* Stage B: Paper Letter Reading Stage */}
        {!animStage && (
          <div className="reader-letter-stage" id="reader-letter-stage">
            {/* Reading Header Toolbar */}
            <div className="reader-toolbar">
              <div className="reader-toolbar__left">
                <span className="category-badge" id="reader-category">{entry.category}</span>
                {entry.mood && (
                  <span className="mood-tag" id="reader-mood">{entry.mood}</span>
                )}
                <span className="date-label" id="reader-date">{formatDate(entry.date)}</span>
              </div>
              <div className="reader-toolbar__right">
                <button
                  className="reader-action-btn reader-action-btn--edit"
                  title="Edit this entry"
                  aria-label="Edit entry"
                  onClick={() => onEdit(entry)}
                >
                  <Edit3 size={16} />
                </button>
                <button
                  className="reader-action-btn reader-action-btn--delete"
                  title="Delete this entry"
                  aria-label="Delete entry"
                  onClick={() => onDelete(entry)}
                >
                  <Trash2 size={16} />
                </button>
                <button
                  className="reader-action-btn"
                  title={bookmarked ? "Remove bookmark" : "Bookmark this piece"}
                  aria-label="Bookmark"
                  onClick={() => onToggleBookmark(entry.id)}
                >
                  <Heart size={16} fill={bookmarked ? "currentColor" : "none"} />
                </button>
                <button
                  className="reader-action-btn"
                  title="Copy text to clipboard"
                  aria-label="Copy text"
                  onClick={handleCopy}
                >
                  <Copy size={16} />
                </button>
                <button
                  className="reader-action-btn"
                  title="Copy shareable link"
                  aria-label="Share link"
                  onClick={handleShare}
                >
                  <Share2 size={16} />
                </button>
                <button
                  className="reader-action-btn"
                  title="Export as Markdown (.md)"
                  aria-label="Export Markdown"
                  onClick={handleExport}
                >
                  <Download size={16} />
                </button>
                <button
                  className="reader-action-btn reader-action-btn--close"
                  title="Close reading view"
                  aria-label="Close reader"
                  onClick={onClose}
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Deckle-Edged Paper Letter Body */}
            <div className="reader-paper-sheet">
              <div className="reader-paper-sheet__inner">
                <div className="reader-postmark-stamp" aria-hidden="true">
                  <span className="stamp-circle">iza.dalawa.taklo</span>
                  <span className="stamp-stars">★ ★ ★</span>
                </div>

                <h2 className="reader-title" id="reader-title">{entry.title}</h2>

                <div className="reader-body-content" id="reader-body">
                  {entry.body}
                </div>

                {entry.tags && entry.tags.length > 0 && (
                  <div className="reader-tags-row" id="reader-tags">
                    {entry.tags.map(t => (
                      <span key={t} className="reader-tag">#{t}</span>
                    ))}
                  </div>
                )}

                <div className="reader-signature">
                  <span className="reader-signature__line">lovingly preserved in the journal,</span>
                  <span className="reader-signature__name">iza ♡</span>
                </div>
              </div>
            </div>

            {/* Reading Footer Navigation */}
            <div className="reader-navigation">
              <button
                className="btn btn--subtle"
                id="reader-prev-btn"
                disabled={!hasPrev}
                onClick={onPrev}
                style={{ opacity: hasPrev ? 1 : 0.4 }}
              >
                <ArrowLeft size={16} />
                <span>previous piece</span>
              </button>
              <button
                className="btn btn--subtle"
                id="reader-next-btn"
                disabled={!hasNext}
                onClick={onNext}
                style={{ opacity: hasNext ? 1 : 0.4 }}
              >
                <span>next piece</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
