import React from 'react';
import { ArrowUp } from 'lucide-react';

export default function Footer({ onOpenDesk }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="site-footer">
      <div className="site-footer__container">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <span className="footer-wordmark">iza.dalawa.taklo</span>
            <p className="footer-tagline">"GUSTO KONG MARAMDAMAN MO NA
              MASAYA ANG BUHAY KASAMA AKO."</p>
          </div>
          <div className="site-footer__nav">
            <a href="#hero">home</a>
            <a href="#archive-section">archive</a>
            <a href="#little-notes-section">notes</a>
            <a href="#todo-section">to-do list</a>
            <button className="footer-link-btn" id="footer-admin-btn" onClick={onOpenDesk}>
              desk
            </button>
          </div>
        </div>

        <div className="site-footer__bottom">
          <p className="footer-closing">multiverse ni eli</p>
          <button className="back-to-top-btn" id="back-to-top-btn" title="Back to top" aria-label="Back to top" onClick={scrollToTop}>
            <span>return to the beginning</span>
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </footer>
  );
}
