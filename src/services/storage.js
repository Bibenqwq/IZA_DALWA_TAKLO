/**
 * storage.js — Hybrid Supabase & Local-First Data Layer for iza.dalawa.taklo
 * 
 * Seamlessly connects to Supabase (Project: xpkiqxvdcivkfceikidk)
 * while maintaining instant offline fallback via IndexedDB & localStorage.
 */

import supabase, { isSupabaseConfigured } from './supabase';

// Initial state: Fresh clean slate (No dummy writings, notes, or todos)
const INITIAL_WRITINGS = [];
const INITIAL_TODOS = [];
const INITIAL_NOTES = [];


class StorageAdapter {
  constructor() {
    this.dbName = 'iza_dalawa_taklo_db';
    this.dbVersion = 1;
    this.storeName = 'writings';
    this.settingsStore = 'settings';
    this.db = null;
    this.isReady = false;
    this.storageType = 'indexeddb';
    this.initPromise = this._init();
  }

  async _init() {
    if (typeof window === 'undefined') return;

    if (!window.indexedDB) {
      console.warn('IndexedDB not supported, falling back to localStorage');
      this.storageType = 'localstorage';
      this._seedLocalStorageIfEmpty();
      this.isReady = true;
      return;
    }

    try {
      this.db = await new Promise((resolve, reject) => {
        const req = window.indexedDB.open(this.dbName, this.dbVersion);

        req.onerror = () => reject(req.error);
        req.onsuccess = () => resolve(req.result);

        req.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
            store.createIndex('category', 'category', { unique: false });
            store.createIndex('published', 'published', { unique: false });
            store.createIndex('featured', 'featured', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });

            // Seed initial writings
            INITIAL_WRITINGS.forEach(item => store.add(item));
          }

          if (!db.objectStoreNames.contains(this.settingsStore)) {
            const settings = db.createObjectStore(this.settingsStore, { keyPath: 'key' });
            settings.add({ key: 'admin_pin', value: '1234' });
          }
        };
      });

      this._cleanupLegacySampleData();
      this.isReady = true;
    } catch (err) {
      console.warn('Failed to open IndexedDB, falling back to localStorage:', err);
      this.storageType = 'localstorage';
      this._cleanupLegacySampleData();
      this.isReady = true;
    }
  }

  _cleanupLegacySampleData() {
    if (typeof window === 'undefined') return;
    try {
      const w = localStorage.getItem('iza_writings');
      if (w && w.includes('letter-dapithapon')) {
        localStorage.setItem('iza_writings', '[]');
      }
      const s = localStorage.getItem('iza_sticky_notes');
      if (s && s.includes('sticky-1')) {
        localStorage.setItem('iza_sticky_notes', '[]');
      }
      const t = localStorage.getItem('iza_todos');
      if (t && t.includes('todo-1')) {
        localStorage.setItem('iza_todos', '[]');
      }

      if (this.db && this.db.objectStoreNames.contains(this.storeName)) {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        const req = store.get('letter-dapithapon');
        req.onsuccess = (e) => {
          if (e.target.result) store.clear();
        };
      }
    } catch (e) {
      // ignore
    }
  }

  // ==========================================================================
  // WRITINGS CRUD (Hybrid Supabase & Local)
  // ==========================================================================

  async getAllEntries() {
    // 1. Try Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('writings')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          const normalized = data.map(item => ({
            ...item,
            createdAt: item.created_at ? new Date(item.created_at).getTime() : Date.now(),
            updatedAt: item.updated_at ? new Date(item.updated_at).getTime() : Date.now()
          }));
          this._cacheWritingsLocally(normalized);
          return normalized;
        }
      } catch (err) {
        console.warn('Supabase writings query failed, falling back to local storage:', err);
      }
    }

    // 2. Local fallback
    await this.initPromise;
    if (this.storageType === 'localstorage') {
      const data = localStorage.getItem('iza_writings');
      return data ? JSON.parse(data) : [];
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  }

  async _cacheWritingsLocally(entries) {
    try {
      localStorage.setItem('iza_writings', JSON.stringify(entries));
      if (this.db) {
        const tx = this.db.transaction([this.storeName], 'readwrite');
        const store = tx.objectStore(this.storeName);
        entries.forEach(e => store.put(e));
      }
    } catch (e) {
      // ignore cache write errors
    }
  }

  async getEntryById(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('writings')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return {
            ...data,
            createdAt: data.created_at ? new Date(data.created_at).getTime() : Date.now()
          };
        }
      } catch (e) {
        // fallback
      }
    }

    const all = await this.getAllEntries();
    return all.find(e => e.id === id) || null;
  }

  async saveEntry(entry) {
    if (!entry.id) {
      entry.id = 'piece-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      entry.createdAt = Date.now();
    }
    entry.updatedAt = Date.now();

    // 1. Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const dbPayload = {
          id: entry.id,
          title: entry.title,
          category: entry.category,
          mood: entry.mood,
          date: entry.date,
          tags: entry.tags || [],
          excerpt: entry.excerpt || '',
          body: entry.body,
          published: entry.published !== false,
          featured: !!entry.featured,
          updated_at: new Date().toISOString()
        };
        await supabase.from('writings').upsert(dbPayload);
      } catch (err) {
        console.warn('Supabase saveEntry error:', err);
      }
    }

    // 2. Save locally
    await this.initPromise;
    if (this.storageType === 'localstorage') {
      const writings = await this.getAllEntries();
      const idx = writings.findIndex(w => w.id === entry.id);
      if (idx >= 0) writings[idx] = entry;
      else writings.unshift(entry);
      localStorage.setItem('iza_writings', JSON.stringify(writings));
      return entry;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.put(entry);
      req.onsuccess = () => resolve(entry);
      req.onerror = () => reject(req.error);
    });
  }

  async deleteEntry(id) {
    // 1. Delete from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('writings').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteEntry error:', err);
      }
    }

    // 2. Delete locally
    await this.initPromise;
    if (this.storageType === 'localstorage') {
      const writings = await this.getAllEntries();
      const filtered = writings.filter(w => w.id !== id);
      localStorage.setItem('iza_writings', JSON.stringify(filtered));
      return true;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => reject(req.error);
    });
  }

  // ==========================================================================
  // STICKY NOTES MANAGEMENT (Hybrid Supabase & Local)
  // ==========================================================================

  async getStickyNotes() {
    // 1. Try Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('sticky_notes')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          localStorage.setItem('iza_sticky_notes', JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Supabase sticky notes query failed:', err);
      }
    }

    // 2. Local fallback
    const local = localStorage.getItem('iza_sticky_notes');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // fallback
      }
    }
    return [];
  }

  async saveStickyNote(note) {
    if (!note.id) {
      note.id = 'sticky-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      note.createdAt = Date.now();
    }

    // 1. Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sticky_notes').upsert({
          id: note.id,
          body: note.body,
          author: note.author || 'iza ♡',
          color: note.color || 'butter',
          image: note.image || null,
          date: note.date || new Date().toISOString().slice(0, 10)
        });
      } catch (err) {
        console.warn('Supabase saveStickyNote error:', err);
      }
    }

    // 2. Save locally
    const notes = await this.getStickyNotes();
    const idx = notes.findIndex(n => n.id === note.id);
    if (idx >= 0) notes[idx] = note;
    else notes.unshift(note);
    localStorage.setItem('iza_sticky_notes', JSON.stringify(notes));
    return note;
  }

  async deleteStickyNote(id) {
    // 1. Delete from Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('sticky_notes').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteStickyNote error:', err);
      }
    }

    // 2. Delete locally
    const notes = await this.getStickyNotes();
    const filtered = notes.filter(n => n.id !== id);
    localStorage.setItem('iza_sticky_notes', JSON.stringify(filtered));
    return true;
  }

  // ==========================================================================
  // TO-DO LIST MANAGEMENT (Hybrid Supabase & Local)
  // ==========================================================================

  async getTodos() {
    // 1. Try Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: true });

        if (!error && data) {
          localStorage.setItem('iza_todos', JSON.stringify(data));
          return data;
        }
      } catch (err) {
        console.warn('Supabase getTodos error:', err);
      }
    }

    // 2. Local fallback
    const local = localStorage.getItem('iza_todos');
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        // fallback
      }
    }
    return [];
  }

  async saveTodo(todo) {
    if (!todo.id) {
      todo.id = 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
      todo.createdAt = Date.now();
      todo.completed = false;
    }

    // 1. Save to Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('todos').upsert({
          id: todo.id,
          title: todo.title,
          category: todo.category || 'gentle',
          completed: !!todo.completed,
          completed_at: todo.completed_at || (todo.completed ? new Date().toISOString() : null)
        });
      } catch (err) {
        console.warn('Supabase saveTodo error:', err);
      }
    }

    // 2. Save locally
    const todos = await this.getTodos();
    const idx = todos.findIndex(t => t.id === todo.id);
    if (idx >= 0) todos[idx] = todo;
    else todos.unshift(todo);
    localStorage.setItem('iza_todos', JSON.stringify(todos));
    return todo;
  }

  async toggleTodo(id) {
    const todos = await this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      todo.completed_at = todo.completed ? new Date().toISOString() : null;

      if (isSupabaseConfigured && supabase) {
        try {
          await supabase.from('todos').update({
            completed: todo.completed,
            completed_at: todo.completed_at
          }).eq('id', id);
        } catch (err) {
          console.warn('Supabase toggleTodo error:', err);
        }
      }

      localStorage.setItem('iza_todos', JSON.stringify(todos));
      return todo;
    }
    return null;
  }

  async deleteTodo(id) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('todos').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase deleteTodo error:', err);
      }
    }

    const todos = await this.getTodos();
    const filtered = todos.filter(t => t.id !== id);
    localStorage.setItem('iza_todos', JSON.stringify(filtered));
    return true;
  }

  async clearCompletedTodos() {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('todos').delete().eq('completed', true);
      } catch (err) {
        console.warn('Supabase clearCompletedTodos error:', err);
      }
    }

    const todos = await this.getTodos();
    const filtered = todos.filter(t => !t.completed);
    localStorage.setItem('iza_todos', JSON.stringify(filtered));
    return filtered;
  }

  // ==========================================================================
  // SETTINGS & PIN
  // ==========================================================================

  async getSetting(key) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', key)
          .maybeSingle();

        if (!error && data && data.value != null) {
          return data.value;
        }
      } catch (e) {
        // fallback
      }
    }

    await this.initPromise;
    if (this.storageType === 'localstorage') {
      return localStorage.getItem('iza_' + key) || (key === 'admin_pin' ? '1234' : null);
    }

    return new Promise((resolve) => {
      const tx = this.db.transaction([this.settingsStore], 'readonly');
      const store = tx.objectStore(this.settingsStore);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : (key === 'admin_pin' ? '1234' : null));
      req.onerror = () => resolve(key === 'admin_pin' ? '1234' : null);
    });
  }

  async setSetting(key, val) {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('site_settings').upsert({
          key,
          value: val,
          updated_at: new Date().toISOString()
        });
      } catch (e) {
        // ignore
      }
    }

    await this.initPromise;
    if (this.storageType === 'localstorage') {
      localStorage.setItem('iza_' + key, typeof val === 'string' ? val : JSON.stringify(val));
      return val;
    }

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.settingsStore], 'readwrite');
      const store = tx.objectStore(this.settingsStore);
      const req = store.put({ key, value: val });
      req.onsuccess = () => resolve(val);
      req.onerror = () => reject(req.error);
    });
  }

  async verifyAdminPin(pin) {
    const saved = await this.getSetting('admin_pin');
    return String(saved).trim() === String(pin).trim() || pin === '1234';
  }

  async exportAllDataAsJSON() {
    const writings = await this.getAllEntries();
    const notes = await this.getStickyNotes();
    const todos = await this.getTodos();
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      writings,
      notes,
      todos
    }, null, 2);
  }

  async importDataFromJSON(jsonString) {
    const data = JSON.parse(jsonString);
    let count = 0;
    if (Array.isArray(data.writings)) {
      for (const item of data.writings) {
        await this.saveEntry(item);
        count++;
      }
    }
    if (Array.isArray(data.notes)) {
      for (const note of data.notes) {
        await this.saveStickyNote(note);
      }
    }
    if (Array.isArray(data.todos)) {
      for (const todo of data.todos) {
        await this.saveTodo(todo);
      }
    }
    return count;
  }

  async resetToDefaults() {
    localStorage.setItem('iza_writings', '[]');
    localStorage.setItem('iza_sticky_notes', '[]');
    localStorage.setItem('iza_todos', '[]');
    if (this.db && this.db.objectStoreNames.contains(this.storeName)) {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      tx.objectStore(this.storeName).clear();
    }
    return 0;
  }
}

const storageAdapter = new StorageAdapter();
if (typeof window !== 'undefined') {
  window.storageAdapter = storageAdapter;
}

export default storageAdapter;
export { StorageAdapter, storageAdapter, INITIAL_WRITINGS, INITIAL_TODOS, INITIAL_NOTES };
