import React, { useState, useEffect } from 'react';
import { Lock, X, Files, Feather, Settings, Eye, Check, Download, Upload, Database, Key, Cloud } from 'lucide-react';
import storageAdapter from '../services/storage';

export default function AdminCmsModal({
  isOpen,
  onClose,
  entries,
  editingEntry,
  onSaveEntry,
  onDeleteEntry,
  onDuplicateEntry,
  onResetEntries,
  toast
}) {
  const [activeTab, setActiveTab] = useState('manage');
  const [livePreview, setLivePreview] = useState(false);

  // Form State
  const [formId, setFormId] = useState(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('letters');
  const [mood, setMood] = useState('soft');
  const [date, setDate] = useState('');
  const [tags, setTags] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [body, setBody] = useState('');
  const [published, setPublished] = useState(true);
  const [featured, setFeatured] = useState(false);

  // New PIN state
  const [newPin, setNewPin] = useState('');

  useEffect(() => {
    if (editingEntry) {
      setFormId(editingEntry.id);
      setTitle(editingEntry.title || '');
      setCategory(editingEntry.category || 'letters');
      setMood(editingEntry.mood || 'soft');
      setDate(editingEntry.date || new Date().toISOString().slice(0, 10));
      setTags(editingEntry.tags ? editingEntry.tags.join(', ') : '');
      setExcerpt(editingEntry.excerpt || '');
      setBody(editingEntry.body || '');
      setPublished(editingEntry.published !== false);
      setFeatured(!!editingEntry.featured);
      setActiveTab('write');
    } else {
      setFormId(null);
      setTitle('');
      setCategory('letters');
      setMood('soft');
      setDate(new Date().toISOString().slice(0, 10));
      setTags('');
      setExcerpt('');
      setBody('');
      setPublished(true);
      setFeatured(false);
    }
  }, [editingEntry]);

  if (!isOpen) return null;

  const handleStartWriteNew = () => {
    setFormId(null);
    setTitle('');
    setCategory('letters');
    setMood('soft');
    setDate(new Date().toISOString().slice(0, 10));
    setTags('');
    setExcerpt('');
    setBody('');
    setPublished(true);
    setFeatured(false);
    setActiveTab('write');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast("Please enter a title and words for your entry ♡");
      return;
    }

    const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
    const entryData = {
      id: formId,
      title: title.trim(),
      category,
      mood,
      date: date || new Date().toISOString().slice(0, 10),
      tags: tagList,
      excerpt: excerpt.trim(),
      body,
      published,
      featured
    };

    await onSaveEntry(entryData);
    toast(published ? "saved and published to journal ♡" : "saved as private draft ♡");
    setActiveTab('manage');
  };

  const handleExportJson = async () => {
    const dataStr = await storageAdapter.exportAllDataAsJSON();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iza_dalawa_taklo_journal_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast("complete journal backup downloaded ♡");
  };

  const handleImportJson = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const count = await storageAdapter.importDataFromJSON(evt.target.result);
        toast(`successfully restored ${count} writing pieces ♡`);
        onResetEntries();
      } catch (err) {
        toast("Failed to import backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = async () => {
    if (confirm("Reset archive to initial poetic sample entries? (Current entries will be replaced unless previously exported)")) {
      await storageAdapter.resetToDefaults();
      toast("restored original sample collection ♡");
      onResetEntries();
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      toast("PIN should be at least 4 characters long");
      return;
    }
    await storageAdapter.setSetting('admin_pin', newPin);
    toast("secret key updated safely ♡");
    setNewPin('');
  };

  const wordsCount = body.trim() ? body.trim().split(/\s+/).length : 0;
  const charsCount = body.length;

  return (
    <div className="modal cms-modal modal--open" id="admin-cms-modal" role="dialog" aria-modal="true" aria-label="Writing Desk CMS">
      <div className="cms-modal__container">
        {/* CMS Header */}
        <div className="cms-header">
          <div className="cms-header__brand">
            <h2 className="cms-title">iza's writing desk</h2>
            <span className="cms-subtitle">preserve, edit, and curate your words</span>
          </div>
          <div className="cms-header__actions">
            <button className="btn btn--subtle" id="admin-logout-btn" onClick={onClose}>
              <Lock size={15} />
              <span>lock desk</span>
            </button>
            <button className="btn-icon" id="admin-cms-close" aria-label="Close writing desk" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* CMS Tabs Navbar */}
        <div className="cms-tabs-bar">
          <button
            className={`cms-tab-btn ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <Files size={16} />
            <span>manage entries</span>
          </button>
          <button
            className={`cms-tab-btn ${activeTab === 'write' ? 'active' : ''}`}
            onClick={handleStartWriteNew}
          >
            <Feather size={16} />
            <span>write new</span>
          </button>
          <button
            className={`cms-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={16} />
            <span>settings & backup</span>
          </button>
        </div>

        {/* CMS Tab 1: Manage Entries */}
        {activeTab === 'manage' && (
          <div className="cms-tab-content active" id="cms-tab-manage">
            <div className="cms-table-wrapper">
              <table className="cms-entries-table">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Mood</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody id="cms-entries-table-body">
                  {entries.map(entry => (
                    <tr key={entry.id}>
                      <td>
                        <span className={`status-pill ${entry.published !== false ? 'status-pill--pub' : 'status-pill--draft'}`}>
                          {entry.published !== false ? 'Published' : 'Draft'}
                        </span>
                        {entry.featured && <span className="status--featured" title="Featured on home"> ★</span>}
                      </td>
                      <td style={{ fontWeight: 500 }}>{entry.title}</td>
                      <td><span className="category-badge">{entry.category}</span></td>
                      <td>{entry.mood}</td>
                      <td>{entry.date}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn-icon cms-edit-btn"
                            title="Edit this entry"
                            onClick={() => {
                              onSaveEntry(entry, true);
                              setActiveTab('write');
                            }}
                          >
                            ✏️
                          </button>
                          <button
                            className="btn-icon cms-dup-btn"
                            title="Duplicate entry"
                            onClick={() => onDuplicateEntry(entry)}
                          >
                            📋
                          </button>
                          <button
                            className="btn-icon btn-icon--danger cms-delete-btn"
                            title="Delete entry"
                            onClick={() => onDeleteEntry(entry)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CMS Tab 2: Write / Edit Form */}
        {activeTab === 'write' && (
          <div className="cms-tab-content active" id="cms-tab-write">
            <div className="cms-editor-toolbar">
              <h3 className="cms-editor-heading">
                {formId ? 'edit writing piece' : 'write a new letter or poem'}
              </h3>
              <div className="cms-editor-quick-actions">
                <button
                  type="button"
                  className={`btn btn--subtle ${livePreview ? 'active' : ''}`}
                  onClick={() => setLivePreview(prev => !prev)}
                >
                  <span>live paper preview</span>
                  <Eye size={16} />
                </button>
              </div>
            </div>

            {/* Live Preview Sheet */}
            {livePreview && (
              <div className="editor-preview-stage">
                <div className="stationery-preview-sheet">
                  <h2 className="preview-title">{title || 'Untitled Piece'}</h2>
                  <span className="preview-meta">{category} · {mood} · {date}</span>
                  <div className="preview-body" style={{ whiteSpace: 'pre-wrap', marginTop: '16px' }}>
                    {body || 'Start writing to see the preview here...'}
                  </div>
                </div>
              </div>
            )}

            {/* Form Inputs */}
            <form id="cms-editor-form" className="cms-editor-form" onSubmit={handleFormSubmit}>
              <div id="editor-inputs-stage">
                <div className="form-row form-row--2col">
                  <div className="form-group">
                    <label htmlFor="editor-title">Title of Piece *</label>
                    <input
                      type="text"
                      id="editor-title"
                      className="form-input"
                      placeholder="e.g. Letters at Dusk"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="editor-category">Category *</label>
                    <select
                      id="editor-category"
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="letters">letters</option>
                      <option value="poetry">poetry</option>
                      <option value="journal">journal</option>
                      <option value="little-thoughts">little thoughts</option>
                      <option value="memories">memories</option>
                      <option value="unsent-letters">unsent letters</option>
                    </select>
                  </div>
                </div>

                <div className="form-row form-row--3col">
                  <div className="form-group">
                    <label htmlFor="editor-mood">Mood / Tone</label>
                    <select
                      id="editor-mood"
                      className="form-select"
                      value={mood}
                      onChange={(e) => setMood(e.target.value)}
                    >
                      <option value="soft">soft</option>
                      <option value="hopeful">hopeful</option>
                      <option value="nostalgic">nostalgic</option>
                      <option value="bittersweet">bittersweet</option>
                      <option value="sleepy">sleepy</option>
                      <option value="happy">happy</option>
                      <option value="unsent">unsent</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="editor-date">Date</label>
                    <input
                      type="date"
                      id="editor-date"
                      className="form-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="editor-tags">Tags (comma-separated)</label>
                    <input
                      type="text"
                      id="editor-tags"
                      className="form-input"
                      placeholder="dusk, rain, love"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="editor-excerpt">Excerpt / Preview Snippet</label>
                  <input
                    type="text"
                    id="editor-excerpt"
                    className="form-input"
                    placeholder="A gentle 1-2 sentence teaser for cards..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <div className="label-with-counter">
                    <label htmlFor="editor-body">Words & Stanzas (Paste letters, poems, or reflections) *</label>
                    <span className="counter-text" id="editor-word-count">
                      {wordsCount} words · {charsCount} characters
                    </span>
                  </div>
                  <textarea
                    id="editor-body"
                    className="form-textarea"
                    rows="12"
                    placeholder="Write or paste your words here...
All line breaks, stanza indents, emojis, and Unicode text are preserved faithfully."
                    required
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                  />
                </div>

                <div className="form-row form-row--switches">
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      id="editor-published"
                      checked={published}
                      onChange={(e) => setPublished(e.target.checked)}
                    />
                    <span className="switch-text">Publish to Journal (Public readers can read)</span>
                  </label>
                  <label className="switch-label">
                    <input
                      type="checkbox"
                      id="editor-featured"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                    />
                    <span className="switch-text">Pin as Featured Piece on Homepage</span>
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn--subtle"
                  id="editor-cancel-btn"
                  onClick={() => setActiveTab('manage')}
                >
                  <span>cancel</span>
                </button>
                <button type="submit" className="btn btn--primary" id="editor-save-btn">
                  <span>save words to journal</span>
                  <Check size={16} />
                </button>
              </div>
            </form>
          </div>
        )}

        {/* CMS Tab 3: Settings & Backup */}
        {activeTab === 'settings' && (
          <div className="cms-tab-content active" id="cms-tab-settings">
            <div className="settings-grid">
              <div className="settings-card">
                <div className="settings-card__header">
                  <Database size={20} />
                  <h4>backup & data recovery</h4>
                </div>
                <p className="settings-card__desc">
                  Your writings are safely saved in your local browser storage (IndexedDB). Download a JSON
                  backup anytime to keep a permanent archive on your computer.
                </p>
                <div className="settings-card__actions">
                  <button className="btn btn--secondary" id="cms-export-json-btn" onClick={handleExportJson}>
                    <Download size={16} />
                    <span>export full journal backup (.json)</span>
                  </button>
                  <label className="btn btn--subtle file-upload-btn">
                    <Upload size={16} />
                    <span>restore from backup file</span>
                    <input
                      type="file"
                      id="cms-import-file-input"
                      accept=".json"
                      className="sr-only"
                      onChange={handleImportJson}
                    />
                  </label>
                  <button className="btn btn--subtle text-danger" id="cms-reset-data-btn" onClick={handleResetData}>
                    <span>reset to sample poems</span>
                  </button>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-card__header">
                  <Key size={20} />
                  <h4>change personal desk key</h4>
                </div>
                <p className="settings-card__desc">
                  Update the passkey required to open this writing desk in this browser.
                </p>
                <form id="cms-change-pin-form" className="pin-change-form" onSubmit={handleChangePin}>
                  <input
                    type="password"
                    id="cms-new-pin-input"
                    className="form-input"
                    placeholder="enter new key (min 4 chars)"
                    required
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                  />
                  <button type="submit" className="btn btn--secondary">
                    <span>update key</span>
                  </button>
                </form>
              </div>

              <div className="settings-card settings-card--info">
                <div className="settings-card__header">
                  <Cloud size={20} />
                  <h4>remote cloud synchronization (supabase)</h4>
                </div>
                <p className="settings-card__desc">
                  Connected to Supabase Project: <strong>xpkiqxvdcivkfceikidk</strong> 🟢
                  <br /><br />
                  To create or sync the tables in your Supabase project, open your Supabase Dashboard, go to <strong>SQL Editor</strong>, and paste & run the script from <code>supabase_schema.sql</code>.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
