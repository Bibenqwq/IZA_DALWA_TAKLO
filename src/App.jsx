import React, { useState, useEffect, useCallback } from 'react';
import storageAdapter from './services/storage';
import Header from './components/Header';
import Hero from './components/Hero';
import FeaturedSection from './components/FeaturedSection';
import ArchiveSection from './components/ArchiveSection';
import StickyNotesSection from './components/StickyNotesSection';
import TodoSection from './components/TodoSection';
import Footer from './components/Footer';
import ReaderModal from './components/ReaderModal';
import SearchModal from './components/SearchModal';
import AdminPinModal from './components/AdminPinModal';
import AdminCmsModal from './components/AdminCmsModal';
import StickyNoteModal from './components/StickyNoteModal';
import ParticlesCanvas from './components/ParticlesCanvas';
import ToastContainer from './components/ToastContainer';
import './styles.css';

export default function App() {
  const [entries, setEntries] = useState([]);
  const [notes, setNotes] = useState([]);
  const [todos, setTodos] = useState([]);
  const [bookmarks, setBookmarks] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem('iza_bookmarks') || '[]'));
    } catch {
      return new Set();
    }
  });

  const [ambientMode, setAmbientMode] = useState(() => {
    return localStorage.getItem('iza_ambient_mode') === 'true';
  });

  const [toasts, setToasts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');

  // Modals state
  const [readerState, setReaderState] = useState({ isOpen: false, entry: null, playAnimation: false });
  const [searchOpen, setSearchOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [cmsOpen, setCmsOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [stickyModal, setStickyModal] = useState({ isOpen: false, note: null });

  const toast = useCallback((text, duration = 3200) => {
    const id = Date.now() + Math.random().toString(36).slice(2, 6);
    setToasts(prev => [...prev, { id, text }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const refreshData = useCallback(async () => {
    const all = await storageAdapter.getAllEntries();
    setEntries(all);

    const sticky = await storageAdapter.getStickyNotes();
    setNotes(sticky);

    const todoList = await storageAdapter.getTodos();
    setTodos(todoList);
  }, []);

  useEffect(() => {
    refreshData();

    // Check deep link
    const params = new URLSearchParams(window.location.search);
    const pieceId = params.get('piece');
    if (pieceId) {
      storageAdapter.getEntryById(pieceId).then(found => {
        if (found) {
          setReaderState({ isOpen: true, entry: found, playAnimation: false });
        }
      });
    }

    // Keyboard shortcut Ctrl+K
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [refreshData]);

  const toggleAmbientMode = () => {
    setAmbientMode(prev => {
      const next = !prev;
      localStorage.setItem('iza_ambient_mode', String(next));
      toast(next ? "Still paper mode enabled ♡" : "Ambient soft motion restored ♡");
      return next;
    });
  };

  const isBookmarked = useCallback((id) => bookmarks.has(id), [bookmarks]);

  const toggleBookmark = (id) => {
    setBookmarks(prev => {
      const next = new Set(prev);
      const wasFav = next.has(id);
      if (wasFav) {
        next.delete(id);
        toast("removed from favorites");
      } else {
        next.add(id);
        toast("saved to favorite words ♡");
      }
      localStorage.setItem('iza_bookmarks', JSON.stringify([...next]));
      return next;
    });
  };

  // Featured and Daily entries
  const publishedEntries = entries.filter(e => e.published);
  const featuredEntry = publishedEntries.find(e => e.featured) || publishedEntries[0] || null;
  const dailyEntry = publishedEntries.find(e => e.id !== featuredEntry?.id) || publishedEntries[1] || featuredEntry;

  // Actions
  const handleOpenLetter = () => {
    if (featuredEntry) {
      setReaderState({ isOpen: true, entry: featuredEntry, playAnimation: true });
    }
  };

  const handleWander = () => {
    const el = document.getElementById('archive-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    toast("wandered into a quiet thought ♡");
  };

  const handleRandomThought = () => {
    const littleThoughts = publishedEntries.filter(e => e.category === 'little-thoughts');
    const pool = littleThoughts.length > 0 ? littleThoughts : publishedEntries;
    if (pool.length > 0) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setReaderState({ isOpen: true, entry: pick, playAnimation: true });
      toast("wandered into a quiet thought ♡");
    }
  };

  const handleReadPiece = (entry, playAnim = false) => {
    setReaderState({ isOpen: true, entry, playAnimation: playAnim });
  };

  const handleOpenDesk = () => {
    setPinOpen(true);
  };

  const handleUnlockDeskSuccess = () => {
    setPinOpen(false);
    setCmsOpen(true);
  };

  const handleWriteNew = () => {
    setEditingEntry(null);
    setPinOpen(true);
  };

  const handleEditPiece = (entry) => {
    setEditingEntry(entry);
    setPinOpen(true);
  };

  const handleDeleteEntry = async (entry) => {
    if (!entry) return;
    if (confirm(`Are you sure you want to delete "${entry.title}"?`)) {
      await storageAdapter.deleteEntry(entry.id);
      toast("entry deleted gently ♡");
      if (readerState.entry?.id === entry.id) {
        setReaderState({ isOpen: false, entry: null, playAnimation: false });
      }
      await refreshData();
    }
  };

  const handleSaveEntry = async (entryData, keepEditing = false) => {
    if (keepEditing) {
      setEditingEntry(entryData);
      return;
    }
    await storageAdapter.saveEntry(entryData);
    await refreshData();
  };

  const handleDuplicateEntry = async (entry) => {
    const dup = {
      ...entry,
      id: undefined,
      title: `${entry.title} (Draft Copy)`,
      published: false,
      featured: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await storageAdapter.saveEntry(dup);
    toast("entry duplicated as draft ♡");
    await refreshData();
  };

  // Reader next/prev navigation
  const currentIndex = readerState.entry
    ? publishedEntries.findIndex(e => e.id === readerState.entry.id)
    : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < publishedEntries.length - 1;

  const handlePrevPiece = () => {
    if (hasPrev) {
      setReaderState(prev => ({ ...prev, entry: publishedEntries[currentIndex - 1], playAnimation: false }));
    }
  };

  const handleNextPiece = () => {
    if (hasNext) {
      setReaderState(prev => ({ ...prev, entry: publishedEntries[currentIndex + 1], playAnimation: false }));
    }
  };

  // Sticky notes handlers
  const handleAddStickyNote = () => {
    setStickyModal({ isOpen: true, note: null });
  };

  const handleEditStickyNote = (note) => {
    setStickyModal({ isOpen: true, note });
  };

  const handleDeleteStickyNote = async (note) => {
    if (confirm('Would you like to delete this sticky note?')) {
      await storageAdapter.deleteStickyNote(note.id);
      toast('sticky note deleted ♡');
      await refreshData();
    }
  };

  const handleSaveStickyNote = async (noteData) => {
    await storageAdapter.saveStickyNote(noteData);
    await refreshData();
  };

  // To-do handlers
  const handleAddTodo = async (title, category) => {
    await storageAdapter.saveTodo({ title, category });
    toast('new intention added to your to-do list ♡');
    await refreshData();
  };

  const handleToggleTodo = async (id) => {
    const updated = await storageAdapter.toggleTodo(id);
    if (updated?.completed) {
      toast('a quiet victory! task completed ♡');
    }
    await refreshData();
  };

  const handleEditTodo = async (item) => {
    const newTitle = prompt('Edit this intention or task:', item.title);
    if (newTitle && newTitle.trim()) {
      await storageAdapter.saveTodo({ ...item, title: newTitle.trim() });
      toast('task updated successfully ♡');
      await refreshData();
    }
  };

  const handleDeleteTodo = async (id) => {
    if (confirm('Would you like to delete this task from the list?')) {
      await storageAdapter.deleteTodo(id);
      toast('task deleted ♡');
      await refreshData();
    }
  };

  const handleClearCompletedTodos = async () => {
    if (confirm('Would you like to clear all completed tasks?')) {
      await storageAdapter.clearCompletedTodos();
      toast('cleared completed tasks ♡');
      await refreshData();
    }
  };

  return (
    <div className={`app-root ${ambientMode ? 'ambient-mode' : ''}`}>
      <ParticlesCanvas ambientMode={ambientMode} />
      <ToastContainer toasts={toasts} />

      <Header
        onRandomThought={handleRandomThought}
        onWriteNew={handleWriteNew}
        onOpenSearch={() => setSearchOpen(true)}
        onToggleAmbient={toggleAmbientMode}
        ambientMode={ambientMode}
        onOpenDesk={handleOpenDesk}
        onFilterCategory={(cat) => {
          setActiveCategory(cat);
          const el = document.getElementById('archive-section');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <main>
        <Hero
          onWander={handleWander}
          onOpenLetter={handleOpenLetter}
          onWriteNew={handleWriteNew}
        />

        <FeaturedSection
          featuredEntry={featuredEntry}
          dailyEntry={dailyEntry}
          onReadPiece={handleReadPiece}
          onEditPiece={handleEditPiece}
          onDeletePiece={handleDeleteEntry}
          onToggleBookmark={toggleBookmark}
          isBookmarked={isBookmarked}
        />

        <ArchiveSection
          entries={entries}
          activeCategory={activeCategory}
          onSelectCategory={setActiveCategory}
          onWriteNew={handleWriteNew}
          onOpenDesk={handleOpenDesk}
          onReadPiece={handleReadPiece}
          onEditPiece={handleEditPiece}
          onDeletePiece={handleDeleteEntry}
          onToggleBookmark={toggleBookmark}
          isBookmarked={isBookmarked}
        />

        <StickyNotesSection
          notes={notes}
          onAddStickyNote={handleAddStickyNote}
          onEditStickyNote={handleEditStickyNote}
          onDeleteStickyNote={handleDeleteStickyNote}
        />

        <TodoSection
          todos={todos}
          onAddTodo={handleAddTodo}
          onToggleTodo={handleToggleTodo}
          onEditTodo={handleEditTodo}
          onDeleteTodo={handleDeleteTodo}
          onClearCompleted={handleClearCompletedTodos}
        />
      </main>

      <Footer onOpenDesk={handleOpenDesk} />

      {/* Reader Modal */}
      <ReaderModal
        isOpen={readerState.isOpen}
        entry={readerState.entry}
        playEnvelopeAnimation={readerState.playAnimation}
        onClose={() => setReaderState({ isOpen: false, entry: null, playAnimation: false })}
        onEdit={(entry) => {
          setReaderState({ isOpen: false, entry: null, playAnimation: false });
          handleEditPiece(entry);
        }}
        onDelete={handleDeleteEntry}
        onToggleBookmark={toggleBookmark}
        isBookmarked={isBookmarked}
        onPrev={handlePrevPiece}
        onNext={handleNextPiece}
        hasPrev={hasPrev}
        hasNext={hasNext}
        toast={toast}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        entries={entries}
        onSelectEntry={(entry) => handleReadPiece(entry, false)}
      />

      {/* Admin PIN Passkey Modal */}
      <AdminPinModal
        isOpen={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={handleUnlockDeskSuccess}
        toast={toast}
      />

      {/* Admin CMS Modal */}
      <AdminCmsModal
        isOpen={cmsOpen}
        onClose={() => {
          setCmsOpen(false);
          setEditingEntry(null);
        }}
        entries={entries}
        editingEntry={editingEntry}
        onSaveEntry={handleSaveEntry}
        onDeleteEntry={handleDeleteEntry}
        onDuplicateEntry={handleDuplicateEntry}
        onResetEntries={refreshData}
        toast={toast}
      />

      {/* Sticky Note Create/Edit Modal */}
      <StickyNoteModal
        isOpen={stickyModal.isOpen}
        onClose={() => setStickyModal({ isOpen: false, note: null })}
        editingNote={stickyModal.note}
        onSaveNote={handleSaveStickyNote}
        toast={toast}
      />
    </div>
  );
}
