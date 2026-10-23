import React, { useState, useEffect, useRef } from 'react';
import { Lock, Unlock, X } from 'lucide-react';
import storageAdapter from '../services/storage';

export default function AdminPinModal({ isOpen, onClose, onSuccess, toast }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isValid = await storageAdapter.verifyAdminPin(pin);
    if (isValid) {
      toast("welcome home to your private desk ♡");
      onSuccess();
    } else {
      setError("Incorrect key. Try default: 1234");
    }
  };

  return (
    <div className="modal pin-modal modal--open" id="admin-pin-modal" role="dialog" aria-modal="true">
      <div className="pin-modal__container">
        <button className="btn-icon pin-modal__close" id="admin-pin-close" aria-label="Close PIN modal" onClick={onClose}>
          <X size={18} />
        </button>
        <div className="pin-modal__header">
          <Lock size={28} className="pin-icon" />
          <h3 className="pin-modal__title" id="pin-modal-title">private writing desk</h3>
          <p className="pin-modal__desc">Enter your personal desk key to write, edit, and organize your words.</p>
        </div>
        <form onSubmit={handleSubmit} className="pin-input-group">
          <input
            ref={inputRef}
            type="password"
            id="admin-pin-input"
            className="pin-input"
            placeholder="enter key (default: 1234)"
            maxLength="20"
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setError('');
            }}
          />
          <button type="submit" className="btn btn--primary" id="admin-pin-submit">
            <span>unlock desk</span>
            <Unlock size={16} />
          </button>
        </form>
        {error && <p className="pin-error">{error}</p>}
        <p className="pin-hint">default passkey: <strong>1234</strong> (can be changed in desk settings)</p>
      </div>
    </div>
  );
}
