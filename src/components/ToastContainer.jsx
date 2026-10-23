import React from 'react';

export default function ToastContainer({ toasts }) {
  return (
    <div id="toast-container" className="toast-container" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className="toast-message toast-message--visible">
          {t.text}
        </div>
      ))}
    </div>
  );
}
