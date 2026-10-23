/**
 * storage-adapter.js — Data Persistence Layer for iza.dalawa.taklo
 * 
 * Implements a local-first persistent storage using IndexedDB with automatic
 * localStorage fallback. Structured cleanly so a remote backend (such as Supabase)
 * can be plugged in without changing frontend components.
 */

// Initial curated sample writings (Letters, Poetry, Journal, Memories, Little thoughts, Unsent letters)
const INITIAL_WRITINGS = [
  {
    id: "letter-dapithapon",
    title: "Mga Liham sa Dapithapon",
    category: "letters",
    mood: "nostalgic",
    date: "2026-10-20",
    excerpt: "Kung sakaling dumaan ka muli sa ilalim ng mga punong mangga, alalahanin mong minsan dito, naging tahimik ang mundo natin.",
    body: `Kung sakaling dumaan ka muli sa ilalim ng mga punong mangga,
alalahanin mong minsan dito, naging tahimik ang mundo natin.

Hindi ko na maalala kung kailan nagsimulang magbago ang ihip ng hangin.
Basta ang alam ko lang, sa tuwing lumulubog ang araw,
may bahagi sa akin na laging naghihintay ng iyong pagbabalik.

Sana'y maayos ang lagay mo kung nasaan ka man.
Nawa'y hindi ka giniginaw sa mga gabing walang bituin.

Nagmamahal pa rin nang tahimik,
iza ♡`,
    tags: ["dapithapon", "pag-ibig", "alaala", "liham"],
    featured: true,
    published: true,
    createdAt: Date.now() - 86400000 * 3,
    updatedAt: Date.now() - 86400000 * 3
  },
  {
    id: "poetry-hindi-maisulat",
    title: "Ikaw ang Tula na Hindi Ko Maisulat",
    category: "poetry",
    mood: "bittersweet",
    date: "2026-10-18",
    excerpt: "May mga salitang masyadong mabigat para sa papel, kaya sa pagitan na lang ng mga buntong-hininga ko sila itinatago.",
    body: `May mga salitang masyadong mabigat para sa papel,
kaya sa pagitan na lang ng mga buntong-hininga ko sila itinatago.

Sinubukan kitang ikahon sa sukat at tugma,
ngunit ang iyong ngiti ay hindi marunong sumunod sa patakaran.
Lumalampas ang iyong anino sa bawat taludtod,
umaapaw ang iyong pangalan sa bawat patlang.

Kung ang paglimot ay isang sining,
ako marahil ang pinakamahinang pintor sa daigdig.

Sapagkat sa bawat pagsara ko ng aking mga mata,
ikaw pa rin ang kulay na ayaw mawala.`,
    tags: ["tula", "sining", "paglimot"],
    featured: false,
    published: true,
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 5
  },
  {
    id: "journal-coffee-midnight",
    title: "3:14 AM Coffee & Unfinished Sentences",
    category: "journal",
    mood: "sleepy",
    date: "2026-10-15",
    excerpt: "The kettle whistles softly while the rest of the street sleeps. Some feelings only make sense when everyone else has closed their eyes.",
    body: `3:14 AM.

The kettle whistles softly while the rest of the street sleeps.
The room smells like roasted Arabica and the faint trace of rain on the window sill.

I keep asking myself why the quietest hours make the loudest echoes in the chest.
I opened an old notebook today and found a dried bougainvillea petal from three summers ago.
It had lost its magenta tint, now faded to the exact shade of antique linen.

Funny how things don't really disappear.
They just learn to carry a softer weight.

Back to bed soon.
Tomorrow we try to be brave again.`,
    tags: ["midnight", "coffee", "reflections", "quiet"],
    featured: false,
    published: true,
    createdAt: Date.now() - 86400000 * 8,
    updatedAt: Date.now() - 86400000 * 8
  },
  {
    id: "memory-diliman-rain",
    title: "The Afternoon It Rained in Diliman",
    category: "memories",
    mood: "soft",
    date: "2026-10-10",
    excerpt: "We shared one tiny umbrella that barely protected our shoulders. Our sleeves were soaked, but neither of us wanted to walk any faster.",
    body: `We shared one tiny umbrella that barely covered our shoulders.
Our sleeves were soaked, but neither of us wanted to walk any faster.

The sunflowers along University Avenue were bowing under the heavy drops,
and the pavement smelled of wet asphalt and warm earth — that sweet, nostalgic petrichor
that you said reminded you of your grandmother's garden in Laguna.

We bought warm taho from the vendor sheltering beside the pavilion.
You smiled with that little crinkle beside your left eye,
and for a moment, I didn't care that my canvas shoes were ruined.

I still keep the cinema ticket from that afternoon inside my wallet.
The ink has almost dissolved,
but the memory remains as crisp as the storm.`,
    tags: ["diliman", "rain", "sunflowers", "memories"],
    featured: false,
    published: true,
    createdAt: Date.now() - 86400000 * 13,
    updatedAt: Date.now() - 86400000 * 13
  },
  {
    id: "unsent-letter-to-you",
    title: "To Someone I Never Told",
    category: "unsent-letters",
    mood: "unsent",
    date: "2026-10-05",
    excerpt: "I wonder if you ever look at old photographs and pause at the ones where I was looking at you instead of the camera.",
    body: `I wonder if you ever look at old photographs and pause
at the ones where I was looking at you instead of the camera.

Probably not.
You always had your eyes set on horizons further than I could reach.

I never told you because some friendships are too fragile to be confessed into something else.
I preferred having you in my life as a certainty,
rather than losing you to the risk of love.

So this stays here, tucked between digital pages where you will never search.
May the universe treat your gentle heart with the kindness you always gave away so freely.`,
    tags: ["unsent", "confession", "quiet-love"],
    featured: false,
    published: true,
    createdAt: Date.now() - 86400000 * 18,
    updatedAt: Date.now() - 86400000 * 18
  },
  {
    id: "thought-words-to-keep",
    title: "Keep the Words That Understand You",
    category: "little-thoughts",
    mood: "hopeful",
    date: "2026-10-01",
    excerpt: "Some feelings only make sense when written down.",
    body: `some feelings only make sense when written down.
keep the words that make you feel understood,
even when the rest of the world feels too loud to listen.

a quiet place for everything left unsaid. ♡`,
    tags: ["thoughts", "little-things", "comfort"],
    featured: false,
    published: true,
    createdAt: Date.now() - 86400000 * 22,
    updatedAt: Date.now() - 86400000 * 22
  },
  {
    id: "poetry-bukas-lamig",
    title: "Bukas, Kapag Lumamig ang Hangin",
    category: "poetry",
    mood: "soft",
    date: "2026-09-28",
    excerpt: "May dalang pahiwatig ang hanging amihan — na bawat pagtatapos ay paghahanda lamang para sa panibagong usbong.",
    body: `May dalang pahiwatig ang hanging amihan —
na bawat pagtatapos ay paghahanda lamang
para sa panibagong usbong.

Huwag kang matakot sa mga dahong nalalagas;
alam ng lupa kung paano sila yayakapin.
Alam ng gabi kung kailan gigising ang araw.

Magpahinga ka muna.
May liwanag ding darating bukas.`,
    tags: ["amihan", "pag-asa", "tula"],
    featured: false,
    published: true,
    createdAt: Date.now() - 86400000 * 25,
    updatedAt: Date.now() - 86400000 * 25
  },
  {
    id: "draft-secret-poem",
    title: "Draft: Ang Awit ng mga Naiwan (Private)",
    category: "poetry",
    mood: "bittersweet",
    date: "2026-10-22",
    excerpt: "Work in progress draft — unpublished reflection on train stations and departures.",
    body: `(Unfinished draft)
Sa istasyon ng tren,
lagi tayong nagpapaalam nang may ngiti
kahit may luhang nagkukubli sa ilalim ng talukap...
(continue writing this later)`,
    tags: ["draft", "private", "work-in-progress"],
    featured: false,
    published: false, // Private Draft! Not shown to public readers!
    createdAt: Date.now() - 86400000 * 1,
    updatedAt: Date.now() - 86400000 * 1
  }
];

// Curated gentle daily intentions & tasks for iza.dalawa.taklo
const INITIAL_TODOS = [
  {
    id: "todo-1",
    title: "write down 3 quiet things that made my heart soft today ♡",
    category: "creative",
    completed: true,
    createdAt: Date.now() - 86400000 * 2,
    completedAt: Date.now() - 86400000 * 1
  },
  {
    id: "todo-2",
    title: "buy fresh eucalyptus and lavender for the writing desk",
    category: "gentle",
    completed: false,
    createdAt: Date.now() - 86400000 * 1
  },
  {
    id: "todo-3",
    title: "finish the draft poem: 'The Song of Those Left Behind'",
    category: "creative",
    completed: false,
    createdAt: Date.now() - 3600000 * 12
  },
  {
    id: "todo-4",
    title: "brew a warm cup of jasmine tea and read by the window",
    category: "daily",
    completed: true,
    createdAt: Date.now() - 3600000 * 6,
    completedAt: Date.now() - 3600000 * 2
  },
  {
    id: "todo-5",
    title: "pin a new thought on the sticky notes wall with a photo",
    category: "urgent",
    completed: false,
    createdAt: Date.now() - 3600000 * 3
  }
];

class StorageAdapter {
  constructor() {
    this.dbName = 'iza_dalawa_taklo_db';
    this.dbVersion = 1;
    this.storeName = 'writings';
    this.settingsStore = 'settings';
    this.db = null;
    this.isReady = false;
    this.storageType = 'indexeddb'; // or 'localstorage'
  }

  async init() {
    try {
      if (!window.indexedDB) {
        throw new Error('IndexedDB not supported in this environment');
      }

      this.db = await new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.dbVersion);

        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
            store.createIndex('category', 'category', { unique: false });
            store.createIndex('published', 'published', { unique: false });
            store.createIndex('featured', 'featured', { unique: false });
            store.createIndex('createdAt', 'createdAt', { unique: false });
          }
          if (!db.objectStoreNames.contains(this.settingsStore)) {
            db.createObjectStore(this.settingsStore, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      this.isReady = true;

      // Seed initial data if store is empty
      const count = await this._count();
      if (count === 0) {
        await this._seedInitialData();
      }
    } catch (err) {
      console.warn('StorageAdapter: Falling back to localStorage:', err.message);
      this.storageType = 'localstorage';
      this.isReady = true;
      if (!localStorage.getItem('iza_writings')) {
        localStorage.setItem('iza_writings', JSON.stringify(INITIAL_WRITINGS));
      }
    }
  }

  async _count() {
    if (this.storageType === 'localstorage') {
      const data = JSON.parse(localStorage.getItem('iza_writings') || '[]');
      return data.length;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.count();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async _seedInitialData() {
    if (this.storageType === 'localstorage') {
      localStorage.setItem('iza_writings', JSON.stringify(INITIAL_WRITINGS));
      return;
    }
    const tx = this.db.transaction([this.storeName], 'readwrite');
    const store = tx.objectStore(this.storeName);
    for (const item of INITIAL_WRITINGS) {
      store.put(item);
    }
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  // --- CRUD Operations ---

  async getAllEntries() {
    if (this.storageType === 'localstorage') {
      return JSON.parse(localStorage.getItem('iza_writings') || '[]');
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async getPublishedEntries() {
    const all = await this.getAllEntries();
    return all.filter(entry => entry.published === true);
  }

  async getEntryById(id) {
    if (this.storageType === 'localstorage') {
      const all = JSON.parse(localStorage.getItem('iza_writings') || '[]');
      return all.find(e => e.id === id) || null;
    }
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([this.storeName], 'readonly');
      const store = tx.objectStore(this.storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }

  async saveEntry(entry) {
    if (!entry.id) {
      entry.id = 'entry-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
    }
    entry.updatedAt = Date.now();
    if (!entry.createdAt) {
      entry.createdAt = Date.now();
    }
    // Calculate approximate read time
    const words = (entry.body || '').trim().split(/\s+/).filter(Boolean).length;
    entry.readTimeMinutes = Math.max(1, Math.ceil(words / 180));

    if (this.storageType === 'localstorage') {
      const all = JSON.parse(localStorage.getItem('iza_writings') || '[]');
      const idx = all.findIndex(e => e.id === entry.id);
      if (idx >= 0) {
        all[idx] = entry;
      } else {
        all.unshift(entry);
      }
      localStorage.setItem('iza_writings', JSON.stringify(all));
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
    if (this.storageType === 'localstorage') {
      let all = JSON.parse(localStorage.getItem('iza_writings') || '[]');
      all = all.filter(e => e.id !== id);
      localStorage.setItem('iza_writings', JSON.stringify(all));
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

  // --- Bookmarks / Favorites (stored in localStorage for fast personal access) ---
  getFavorites() {
    try {
      return JSON.parse(localStorage.getItem('iza_favorites') || '[]');
    } catch {
      return [];
    }
  }

  toggleFavorite(id) {
    const favs = this.getFavorites();
    const idx = favs.indexOf(id);
    let isFav = false;
    if (idx >= 0) {
      favs.splice(idx, 1);
      isFav = false;
    } else {
      favs.push(id);
      isFav = true;
    }
    localStorage.setItem('iza_favorites', JSON.stringify(favs));
    return isFav;
  }

  isFavorite(id) {
    return this.getFavorites().includes(id);
  }

  // --- Daily Piece (deterministic daily selection based on date string) ---
  async getDailyPiece() {
    const published = await this.getPublishedEntries();
    if (!published.length) return null;

    // Use current date (YYYY-MM-DD) to seed index
    const today = new Date().toISOString().slice(0, 10);
    let hash = 0;
    for (let i = 0; i < today.length; i++) {
      hash = (hash * 31 + today.charCodeAt(i)) & 0xffffff;
    }
    const index = Math.abs(hash) % published.length;
    return published[index];
  }

  // --- Random Piece ---
  async getRandomPiece() {
    const published = await this.getPublishedEntries();
    if (!published.length) return null;
    const index = Math.floor(Math.random() * published.length);
    return published[index];
  }

  // --- Featured Entry ---
  async getFeaturedEntry() {
    const published = await this.getPublishedEntries();
    const featured = published.find(e => e.featured === true);
    return featured || published[0] || null;
  }

  // --- Admin PIN & Settings ---
  getAdminPin() {
    return localStorage.getItem('iza_admin_pin') || '1234';
  }

  setAdminPin(newPin) {
    localStorage.setItem('iza_admin_pin', newPin);
  }

  getAmbientMode() {
    return localStorage.getItem('iza_ambient_mode') === 'true';
  }

  setAmbientMode(enabled) {
    localStorage.setItem('iza_ambient_mode', enabled ? 'true' : 'false');
  }

  // --- Auto-Save Draft Cache (recovers unsaved text) ---
  saveEditorDraft(draftObj) {
    localStorage.setItem('iza_editor_draft_cache', JSON.stringify(draftObj));
  }

  getEditorDraft() {
    try {
      const data = localStorage.getItem('iza_editor_draft_cache');
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  clearEditorDraft() {
    localStorage.removeItem('iza_editor_draft_cache');
  }

  // --- Backup / Export / Import ---
  async exportJSON() {
    const entries = await this.getAllEntries();
    const payload = {
      app: "iza.dalawa.taklo",
      version: "1.0",
      exportedAt: new Date().toISOString(),
      entriesCount: entries.length,
      entries: entries
    };
    return JSON.stringify(payload, null, 2);
  }

  async importJSON(jsonString) {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error("Invalid JSON file format. Please check the backup file.");
    }

    const items = Array.isArray(parsed) ? parsed : (parsed.entries || []);
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("No writing entries found in this file.");
    }

    // Validate entries
    let count = 0;
    for (const item of items) {
      if (!item.title || !item.body) {
        continue;
      }
      const sanitized = {
        id: item.id || ('entry-' + Date.now() + '-' + count),
        title: String(item.title).trim(),
        category: item.category || 'letters',
        mood: item.mood || 'soft',
        date: item.date || new Date().toISOString().slice(0, 10),
        excerpt: item.excerpt || (item.body.slice(0, 120) + '...'),
        body: String(item.body),
        tags: Array.isArray(item.tags) ? item.tags : [],
        featured: Boolean(item.featured),
        published: item.published !== undefined ? Boolean(item.published) : true,
        createdAt: item.createdAt || Date.now(),
        updatedAt: Date.now()
      };
      await this.saveEntry(sanitized);
      count++;
    }
    return count;
  }

  async resetToDefaults() {
    if (this.storageType === 'localstorage') {
      localStorage.setItem('iza_writings', JSON.stringify(INITIAL_WRITINGS));
    } else {
      const tx = this.db.transaction([this.storeName], 'readwrite');
      const store = tx.objectStore(this.storeName);
      store.clear();
      for (const item of INITIAL_WRITINGS) {
        store.put(item);
      }
      await new Promise((res, rej) => {
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    }
    return INITIAL_WRITINGS.length;
  }

  // ==========================================================================
  // STICKY NOTES MANAGEMENT (CRUD + Photos)
  // ==========================================================================

  async getStickyNotes() {
    const all = await this.getAllEntries();
    let notes = all.filter(e => e.category === 'little-thoughts');
    if (notes.length === 0) {
      const defaults = [
        {
          id: "sticky-1",
          body: "some feelings only make sense when written down.",
          author: "iza ♡",
          color: "butter",
          category: "little-thoughts",
          published: true,
          date: "2026-10-23",
          createdAt: Date.now() - 86400000 * 3
        },
        {
          id: "sticky-2",
          body: "keep the words that make you feel understood.",
          author: "iza ♡",
          color: "blush",
          category: "little-thoughts",
          published: true,
          date: "2026-10-22",
          createdAt: Date.now() - 86400000 * 2
        },
        {
          id: "sticky-3",
          body: "a quiet place for everything left unsaid. ♡",
          author: "iza ♡",
          color: "matcha",
          category: "little-thoughts",
          published: true,
          date: "2026-10-21",
          createdAt: Date.now() - 86400000 * 1
        },
        {
          id: "sticky-4",
          body: "do not rush; every blooming has its own quiet season.",
          author: "iza ♡",
          color: "lavender",
          category: "little-thoughts",
          published: true,
          date: "2026-10-23",
          createdAt: Date.now()
        }
      ];
      for (const d of defaults) {
        await this.saveEntry(d);
      }
      return defaults;
    }
    return notes;
  }

  async saveStickyNote(note) {
    if (!note.id) {
      note.id = 'sticky-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
    note.category = 'little-thoughts';
    note.published = true;
    if (!note.title) {
      note.title = (note.body || '').slice(0, 30) + '...';
    }
    if (!note.date) {
      note.date = new Date().toISOString().slice(0, 10);
    }
    return await this.saveEntry(note);
  }

  async deleteStickyNote(id) {
    return await this.deleteEntry(id);
  }

  // ==========================================================================
  // TO-DO LIST MANAGEMENT (Daily Intentions CRUD)
  // ==========================================================================

  async getTodos() {
    try {
      const stored = localStorage.getItem('iza_todos');
      if (!stored) {
        localStorage.setItem('iza_todos', JSON.stringify(INITIAL_TODOS));
        return INITIAL_TODOS;
      }
      return JSON.parse(stored);
    } catch (e) {
      return INITIAL_TODOS;
    }
  }

  async saveTodo(todo) {
    const todos = await this.getTodos();
    if (!todo.id) {
      todo.id = 'todo-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    }
    if (!todo.createdAt) {
      todo.createdAt = Date.now();
    }
    todo.updatedAt = Date.now();
    const idx = todos.findIndex(t => t.id === todo.id);
    if (idx >= 0) {
      todos[idx] = todo;
    } else {
      todos.unshift(todo);
    }
    localStorage.setItem('iza_todos', JSON.stringify(todos));
    return todo;
  }

  async toggleTodo(id) {
    const todos = await this.getTodos();
    const todo = todos.find(t => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      todo.completedAt = todo.completed ? Date.now() : null;
      localStorage.setItem('iza_todos', JSON.stringify(todos));
      return todo;
    }
    return null;
  }

  async deleteTodo(id) {
    const todos = await this.getTodos();
    const filtered = todos.filter(t => t.id !== id);
    localStorage.setItem('iza_todos', JSON.stringify(filtered));
    return true;
  }

  async clearCompletedTodos() {
    const todos = await this.getTodos();
    const filtered = todos.filter(t => !t.completed);
    localStorage.setItem('iza_todos', JSON.stringify(filtered));
    return filtered;
  }
}

// Export singleton instance
window.storageAdapter = new StorageAdapter();
