import React, { useState } from 'react';
import { Compass, MailOpen, Plus } from 'lucide-react';
import CursorPortrait from './CursorPortrait';
import Hero3DScene from './Hero3DScene';

export default function Hero({ onWander, onOpenLetter, onWriteNew }) {
  const [view3D, setView3D] = useState(false);

  return (
    <section className="hero" id="hero">
      <div className="hero__container">
        {/* Hero Left: Text Content */}
        <div className="hero__text">
          <div className="hero__annotation-top"></div>

          <div className="hero__wordmark-wrapper">
            <h1 className="hero__wordmark" id="wordmark">
              <span className="hero__wordmark-line hero__wordmark-line--1">iza</span>
              <span className="hero__wordmark-dot">.</span>
              <span className="hero__wordmark-line hero__wordmark-line--2">dalawa</span>
              <span className="hero__wordmark-dot">.</span>
              <span className="hero__wordmark-line hero__wordmark-line--3">taklo</span>
            </h1>
          </div>

          <p className="hero__subtitle">
            "Satsat nang satsat."
          </p>

          <p className="hero__secondary-line">
            letters, poems, and pieces of a heart preserved in the quiet.
          </p>

          <div className="hero__cta-group">
            <button className="btn btn--primary" id="cta-wander" onClick={onWander}>
              <span>wander through the words</span>
              <Compass size={18} />
            </button>
            <button className="btn btn--secondary" id="cta-open-letter" onClick={onOpenLetter}>
              <span>open a letter</span>
              <MailOpen size={18} />
            </button>
            <button className="btn btn--journal-write trigger-write-new" id="hero-write-btn" onClick={onWriteNew}>
              <Plus size={18} />
              <span>+ write in journal</span>
            </button>
          </div>

          {/* Hero View Switcher */}
          <div className="hero__view-switch-wrapper">
            <span className="hero__view-switch-label">experience:</span>
            <button
              className="hero__view-switch-btn"
              id="hero-view-switcher"
              onClick={() => setView3D(prev => !prev)}
              title={view3D ? "Switch to interactive portrait view" : "Switch to 3D envelope view"}
            >
              <span>{view3D ? "view gaze portrait ♡" : "open 3d envelope ✉"}</span>
            </button>
          </div>
        </div>

        {/* Hero Right: Interactive Visual */}
        <div className="hero__visual-container">
          {view3D ? (
            <Hero3DScene onLetterClick={onOpenLetter} />
          ) : (
            <CursorPortrait />
          )}
        </div>
      </div>
    </section>
  );
}
