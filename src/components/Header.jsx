import React, { useState } from 'react';
import { Sparkle, Sparkles, PenTool, Search, Feather } from 'lucide-react';

export default function Header({
  onRandomThought,
  onWriteNew,
  onOpenSearch,
  onToggleAmbient,
  ambientMode,
  onOpenDesk,
  onFilterCategory
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (cat) => {
    if (cat && onFilterCategory) {
      onFilterCategory(cat);
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="site-header" id="site-header">
      <div className="site-header__container">
        {/* Brand Wordmark */}
        <a href="#hero" className="site-logo" aria-label="iza.dalawa.taklo home">
          <span className="site-logo__part site-logo__part--1">iza</span>
          <span className="site-logo__dot">.</span>
          <span className="site-logo__part site-logo__part--2">dalawa</span>
          <span className="site-logo__dot">.</span>
          <span className="site-logo__part site-logo__part--3">taklo</span>
        </a>

        {/* Navigation Links */}
        <nav className={`nav-links ${mobileMenuOpen ? 'nav-links--open' : ''}`} id="nav-links" aria-label="Main Navigation">
          <a href="#hero" className="nav-link" onClick={() => handleNavClick(null)}>Home</a>
          <a href="#archive-section" className="nav-link" onClick={() => handleNavClick('letters')}>Letters</a>
          <a href="#archive-section" className="nav-link" onClick={() => handleNavClick('poetry')}>Poetry</a>
          <a href="#archive-section" className="nav-link" onClick={() => handleNavClick('memories')}>Memories</a>
          <a href="#little-notes-section" className="nav-link" onClick={() => setMobileMenuOpen(false)}>Notes</a>
          <a href="#todo-section" className="nav-link" onClick={() => setMobileMenuOpen(false)}>To-Do List</a>
        </nav>

        {/* Navigation Actions */}
        <div className="nav-actions">
          {/* Random Thought Button */}
          <button
            className="nav-btn trigger-random-thought"
            title="give me a random thought ♡"
            aria-label="Random Thought"
            onClick={onRandomThought}
          >
            <Sparkle size={16} />
            <span className="nav-btn__label">random thought</span>
          </button>

          {/* Write New Journal Entry Button */}
          <button
            className="nav-btn nav-btn--write trigger-write-new"
            id="nav-write-new-btn"
            title="Write a new journal entry"
            aria-label="Write new entry"
            onClick={onWriteNew}
          >
            <PenTool size={16} />
            <span className="nav-btn__label">+ write</span>
          </button>

          {/* Search Button */}
          <button
            className="nav-btn"
            id="nav-search-btn"
            title="Search writings (Ctrl+K)"
            aria-label="Search writings"
            onClick={onOpenSearch}
          >
            <Search size={16} />
          </button>

          {/* Ambient Mode Toggle */}
          <button
            className={`nav-btn ${ambientMode ? 'nav-btn--active' : ''}`}
            id="ambient-mode-toggle"
            title="Ambient motion toggle"
            aria-label="Toggle ambient mode"
            onClick={onToggleAmbient}
          >
            <Sparkles size={16} />
          </button>

          {/* Journal Desk Entry */}
          <button
            className="nav-btn nav-btn--admin trigger-open-desk"
            id="nav-admin-btn"
            title="Personal Writing Desk"
            aria-label="Journal Desk"
            onClick={onOpenDesk}
          >
            <Feather size={16} />
          </button>

          {/* Mobile Navigation Toggle */}
          <button
            className={`mobile-nav-toggle ${mobileMenuOpen ? 'active' : ''}`}
            id="mobile-nav-toggle"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(prev => !prev)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
