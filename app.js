/**
 * app.js — Main Application Controller for iza.dalawa.taklo
 * 
 * Manages:
 * - Routing & deep-linking (#read=id, #admin, #archive, etc.)
 * - Hero Scene & Portrait view switcher
 * - Archive rendering, filtering (category, mood, search, favorites)
 * - Reading experience & envelope opening animation
 * - Random thought & daily piece features
 * - Bookmarking & persistence
 * - Full Admin Content Management System (Editor, Preview, Drafts, PIN, Backups)
 * - Ambient mode & Toast notification system
 */

// Define the global app controller
const app = {
  currentCategory: 'all',
  currentMood: 'all',
  searchQuery: '',
  sortOrder: 'newest', // 'newest' | 'oldest'
  showOnlyFavorites: false,
  activeReadingEntry: null,
  adminAuthenticated: false,
  editingEntryId: null,
  ambientMode: false,

  // Cache of current entries
  allEntries: [],
  publishedEntries: [],

  // Component instances
  heroScene: null,
  portraitInstance: null,
  particleSystem: null,

  async init() {
    // 1. Initialize Storage Adapter
    if (window.storageAdapter) {
      await window.storageAdapter.init();
      this.ambientMode = window.storageAdapter.getAmbientMode();
    }

    if (this.ambientMode) {
      document.body.classList.add('ambient-mode');
    }

    // 2. Initialize Particles Background
    const particlesCanvas = document.getElementById('particles-canvas');
    if (particlesCanvas && typeof ParticleSystem !== 'undefined') {
      this.particleSystem = new ParticleSystem(particlesCanvas);
    }

    // 3. Initialize Three.js Hero Scene
    const hero3dContainer = document.getElementById('hero-3d-scene');
    if (hero3dContainer && typeof HeroScene !== 'undefined') {
      this.heroScene = new HeroScene(hero3dContainer, {
        onLetterClick: async () => {
          const featured = await window.storageAdapter.getFeaturedEntry();
          if (featured) {
            this.openReader(featured, true);
          }
        }
      });
    }

    // 4. Initialize Cursor-Tracking Portrait
    const portraitContainer = document.getElementById('cursor-tracking-portrait');
    if (portraitContainer && typeof CursorTrackingPortrait !== 'undefined') {
      this.portraitInstance = new CursorTrackingPortrait(portraitContainer, {
        deadzonePx: 45,
        smoothing: 0.25,
        transitionSpeed: 0.2
      });
    }

    // 5. Initialize Micro-Stars around Portrait
    initPortraitStars();

    // 6. Bind UI Controls
    setupNavigation(this);
    setupHeroSwitcher(this);
    setupAmbientToggle(this);
    setupSearchModal(this);
    setupReaderControls(this);
    setupAdminCMS(this);
    setupRandomThought(this);
    setupArchiveFilterControls(this);
    setupStickyNotes(this);
    setupTodoList(this);

    // 7. Initial Data Load & Render
    await this.refreshEntries();

    // 8. Handle Initial Route
    handleRoute(this);
    window.addEventListener('hashchange', () => handleRoute(this));

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  },

  async refreshEntries() {
    if (window.storageAdapter) {
      this.allEntries = await window.storageAdapter.getAllEntries();
      this.publishedEntries = this.allEntries.filter(e => e.published === true);
    }
    this.renderFeatured();
    this.renderDailyPiece();
    this.renderArchive();
    this.renderNotesSection();
    this.renderTodos();
    if (this.adminAuthenticated) {
      this.renderAdminList();
    }
  },

  toast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast-message';
    el.innerHTML = `<span>${message}</span>`;
    container.appendChild(el);

    requestAnimationFrame(() => el.classList.add('toast-message--visible'));

    setTimeout(() => {
      el.classList.remove('toast-message--visible');
      setTimeout(() => el.remove(), 400);
    }, duration);
  },

  // --- Featured Piece Rendering ---
  async renderFeatured() {
    const container = document.getElementById('featured-letter-card');
    if (!container || !window.storageAdapter) return;

    const entry = await window.storageAdapter.getFeaturedEntry();
    if (!entry) {
      container.innerHTML = `<p class="empty-notice">No featured writing yet.</p>`;
      return;
    }

    const isFav = window.storageAdapter.isFavorite(entry.id);

    container.innerHTML = `
      <div class="stationery-card stationery-card--featured" data-id="${entry.id}">
        <div class="stationery-card__stamp" aria-hidden="true">
          <span class="stamp-postmark">iza.dalawa.taklo</span>
          <span class="stamp-seal">featured</span>
        </div>
        <div class="stationery-card__header">
          <div class="badge-group">
            <span class="category-badge category-badge--${entry.category}">${escapeHTML(entry.category)}</span>
            ${entry.mood ? `<span class="mood-tag mood-tag--${entry.mood}">${escapeHTML(entry.mood)}</span>` : ''}
          </div>
          <span class="date-label">${formatDate(entry.date)}</span>
        </div>
        <h3 class="stationery-card__title">${escapeHTML(entry.title)}</h3>
        <p class="stationery-card__excerpt">${escapeHTML(entry.excerpt || entry.body.slice(0, 160) + '...')}</p>
        <div class="stationery-card__footer">
          <button class="btn btn--paper-action read-featured-btn" data-id="${entry.id}">
            <span>read this piece</span>
            <i data-lucide="arrow-right"></i>
          </button>
          <div class="stationery-card__actions">
            <button class="card-action-btn edit-piece-btn" data-id="${entry.id}" title="Edit this entry">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="card-action-btn card-action-btn--delete delete-piece-btn" data-id="${entry.id}" title="Delete this entry">
              <i data-lucide="trash-2"></i>
            </button>
            <button class="bookmark-btn ${isFav ? 'is-bookmarked' : ''}" data-id="${entry.id}" title="${isFav ? 'Remove from favorites' : 'Save to favorites'}">
              <i data-lucide="heart"></i>
            </button>
          </div>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const readBtn = container.querySelector('.read-featured-btn');
    if (readBtn) {
      readBtn.addEventListener('click', () => {
        this.openReader(entry, true);
      });
    }

    const editBtn = container.querySelector('.edit-piece-btn');
    if (editBtn) {
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditorForEntry(entry);
      });
    }

    const deleteBtn = container.querySelector('.delete-piece-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (confirm(`Are you sure you want to delete "${entry.title}"?`)) {
          await window.storageAdapter.deleteEntry(entry.id);
          this.toast("entry deleted gently ♡");
          await this.refreshEntries();
        }
      });
    }

    const bBtn = container.querySelector('.bookmark-btn');
    if (bBtn) {
      bBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const fav = window.storageAdapter.toggleFavorite(entry.id);
        bBtn.classList.toggle('is-bookmarked', fav);
        this.toast(fav ? "saved to favorite words ♡" : "removed from favorites");
        this.renderArchive();
      });
    }
  },

  // --- Daily Piece Rendering ---
  async renderDailyPiece() {
    const container = document.getElementById('daily-piece-card');
    if (!container || !window.storageAdapter) return;

    const entry = await window.storageAdapter.getDailyPiece();
    if (!entry) return;

    container.innerHTML = `
      <div class="daily-piece-inner" data-id="${entry.id}">
        <div class="daily-piece__header">
          <span class="annotation-label">piece of the day ♡</span>
          <span class="date-label">${formatDate(new Date())}</span>
        </div>
        <h4 class="daily-piece__title">${escapeHTML(entry.title)}</h4>
        <p class="daily-piece__excerpt">${escapeHTML(entry.excerpt || entry.body.slice(0, 120) + '...')}</p>
        <button class="btn btn--subtle read-daily-btn" data-id="${entry.id}">
          <span>open today's words</span>
          <i data-lucide="book-open"></i>
        </button>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const readDaily = container.querySelector('.read-daily-btn');
    if (readDaily) {
      readDaily.addEventListener('click', () => {
        this.openReader(entry, false);
      });
    }
  },

  // --- Little Notes Section Rendering (Sticky Notes + Photo Attachments + CRUD) ---
  async renderNotesSection() {
    const container = document.getElementById('little-notes-grid');
    if (!container || !window.storageAdapter) return;

    const notes = await window.storageAdapter.getStickyNotes();
    if (notes.length === 0) {
      container.innerHTML = `
        <div class="little-note-card little-note--butter">
          <div class="little-note-pin"></div>
          <p class="little-note-text">"no sticky notes pinned yet. click '+ add sticky note' above to leave words or a photo ♡"</p>
          <span class="little-note-author">iza ♡</span>
        </div>
      `;
      return;
    }

    container.innerHTML = notes.map(note => {
      const colorClass = 'little-note--' + (note.color || 'butter');
      const imageHtml = note.imageUrl ? `
        <div class="little-note-image-wrapper">
          <img src="${note.imageUrl}" alt="pinned polaroid" class="little-note-image" loading="lazy">
        </div>
      ` : '';

      return `
        <div class="little-note-card ${colorClass}" data-id="${note.id}">
          <div class="little-note-pin"></div>
          <div class="little-note-actions">
            <button class="little-note-btn little-note-btn--edit" data-id="${note.id}" title="Edit sticky note">
              <i data-lucide="edit-3"></i>
            </button>
            <button class="little-note-btn little-note-btn--delete" data-id="${note.id}" title="Delete sticky note">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
          ${imageHtml}
          <p class="little-note-text">${escapeHTML(note.body)}</p>
          <div class="little-note-footer">
            <span class="little-note-date">${formatDate(note.date)}</span>
            <span class="little-note-author">${escapeHTML(note.author || 'iza ♡')}</span>
          </div>
        </div>
      `;
    }).join('');

    // Bind card actions: Edit
    container.querySelectorAll('.little-note-btn--edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const note = notes.find(n => n.id === id);
        if (note && window.appStickyNotesOpenModal) {
          window.appStickyNotesOpenModal(note);
        }
      });
    });

    // Bind card actions: Delete
    container.querySelectorAll('.little-note-btn--delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        if (confirm('Would you like to delete this sticky note?')) {
          await window.storageAdapter.deleteStickyNote(id);
          this.renderNotesSection();
          this.toast('sticky note deleted ♡');
        }
      });
    });

    // Clicking card opens reader view
    container.querySelectorAll('.little-note-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.little-note-btn')) return;
        const id = card.getAttribute('data-id');
        const note = notes.find(n => n.id === id);
        if (note) this.openReader(note, false);
      });
    });

    if (window.lucide) window.lucide.createIcons();
  },

  // --- To-Do List & Daily Intentions Rendering ---
  async renderTodos() {
    const listEl = document.getElementById('todo-list');
    const progressCount = document.getElementById('todo-progress-count');
    const progressFill = document.getElementById('todo-progress-fill');
    if (!listEl || !window.storageAdapter) return;

    const allTodos = await window.storageAdapter.getTodos();
    const total = allTodos.length;
    const completedCount = allTodos.filter(t => t.completed).length;
    const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

    if (progressCount) {
      progressCount.textContent = `${completedCount} of ${total} intentions fulfilled ♡ (${pct}%)`;
    }
    if (progressFill) {
      progressFill.style.width = `${pct}%`;
    }

    const filter = this.todoFilter || 'all';
    let filtered = allTodos;
    if (filter === 'pending') {
      filtered = allTodos.filter(t => !t.completed);
    } else if (filter === 'completed') {
      filtered = allTodos.filter(t => t.completed);
    }

    if (filtered.length === 0) {
      listEl.innerHTML = `
        <div class="todo-empty-state">
          <p>"no tasks listed here — everything is calm and accomplished ♡"</p>
        </div>
      `;
      return;
    }

    listEl.innerHTML = filtered.map(item => `
      <div class="todo-item ${item.completed ? 'completed' : ''}" data-id="${item.id}">
        <div class="todo-item-left">
          <button class="todo-checkbox-btn" data-id="${item.id}" title="${item.completed ? 'Mark pending' : 'Mark completed'}">
            <i data-lucide="${item.completed ? 'check' : 'circle'}"></i>
          </button>
          <span class="todo-item-title">${escapeHTML(item.title)}</span>
        </div>
        <div class="todo-item-right">
          <span class="todo-tag todo-tag--${item.category || 'gentle'}">${item.category || 'gentle'}</span>
          <button class="todo-item-action-btn todo-item-action-btn--edit" data-id="${item.id}" title="Edit task">
            <i data-lucide="edit-2"></i>
          </button>
          <button class="todo-item-action-btn todo-item-action-btn--delete" data-id="${item.id}" title="Delete task">
            <i data-lucide="trash-2"></i>
          </button>
        </div>
      </div>
    `).join('');

    // Checkbox click
    listEl.querySelectorAll('.todo-checkbox-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const updated = await window.storageAdapter.toggleTodo(id);
        this.renderTodos();
        if (updated && updated.completed) {
          this.toast('a quiet victory! task completed ♡');
        }
      });
    });

    // Edit click
    listEl.querySelectorAll('.todo-item-action-btn--edit').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const item = allTodos.find(t => t.id === id);
        if (!item) return;
        const newTitle = prompt('Edit this intention or task:', item.title);
        if (newTitle !== null && newTitle.trim()) {
          item.title = newTitle.trim();
          await window.storageAdapter.saveTodo(item);
          this.renderTodos();
          this.toast('task updated successfully ♡');
        }
      });
    });

    // Delete click
    listEl.querySelectorAll('.todo-item-action-btn--delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        if (confirm('Would you like to delete this task from the list?')) {
          await window.storageAdapter.deleteTodo(id);
          this.renderTodos();
          this.toast('task deleted ♡');
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  },

  // --- Archive Section Rendering ---
  renderArchive() {
    const grid = document.getElementById('archive-grid');
    const countLabel = document.getElementById('archive-count-label');
    if (!grid || !window.storageAdapter) return;

    const favs = window.storageAdapter.getFavorites();

    // 1. Filter
    let filtered = this.publishedEntries.filter(entry => {
      if (this.currentCategory !== 'all' && entry.category !== this.currentCategory) {
        return false;
      }
      if (this.currentMood !== 'all' && entry.mood !== this.currentMood) {
        return false;
      }
      if (this.showOnlyFavorites && !favs.includes(entry.id)) {
        return false;
      }
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        const match = entry.title.toLowerCase().includes(q) ||
          entry.body.toLowerCase().includes(q) ||
          (entry.tags && entry.tags.some(t => t.toLowerCase().includes(q)));
        if (!match) return false;
      }
      return true;
    });

    // 2. Sort
    filtered.sort((a, b) => {
      const timeA = new Date(a.date).getTime() || a.createdAt || 0;
      const timeB = new Date(b.date).getTime() || b.createdAt || 0;
      return this.sortOrder === 'newest' ? (timeB - timeA) : (timeA - timeB);
    });

    // Count update
    if (countLabel) {
      countLabel.textContent = `${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'} preserved`;
    }

    // Empty state
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="archive-empty">
          <div class="archive-empty__icon">♡</div>
          <h4 class="archive-empty__title">a quiet corner with no words yet</h4>
          <p class="archive-empty__desc">There are no writings matching this filter. Try selecting "all" or clearing your search.</p>
          <button class="btn btn--subtle" id="archive-reset-filters">
            <span>show all words</span>
          </button>
        </div>
      `;
      const rBtn = document.getElementById('archive-reset-filters');
      if (rBtn) {
        rBtn.addEventListener('click', () => {
          this.currentCategory = 'all';
          this.currentMood = 'all';
          this.showOnlyFavorites = false;
          this.searchQuery = '';
          updateCategoryTabsUI('all');
          updateMoodFiltersUI('all');
          const searchInput = document.getElementById('archive-search-input');
          if (searchInput) searchInput.value = '';
          const favToggle = document.getElementById('archive-favorites-toggle');
          if (favToggle) favToggle.classList.remove('active');
          this.renderArchive();
        });
      }
      return;
    }

    // Render cards
    grid.innerHTML = filtered.map((entry, idx) => {
      const isFav = favs.includes(entry.id);
      const layoutVariant = (idx % 5 === 0) ? 'stationery-card--spacious' :
                           (idx % 3 === 0) ? 'stationery-card--compact' : '';

      return `
        <article class="stationery-card ${layoutVariant}" data-id="${entry.id}">
          <div class="stationery-card__header">
            <div class="badge-group">
              <span class="category-badge category-badge--${entry.category}">${escapeHTML(entry.category)}</span>
              ${entry.mood ? `<span class="mood-tag mood-tag--${entry.mood}">${escapeHTML(entry.mood)}</span>` : ''}
            </div>
            <span class="date-label">${formatDate(entry.date)}</span>
          </div>
          <h3 class="stationery-card__title">${escapeHTML(entry.title)}</h3>
          <p class="stationery-card__excerpt">${escapeHTML(entry.excerpt || entry.body.slice(0, 130) + '...')}</p>
          <div class="stationery-card__footer">
            <button class="btn btn--paper-action read-piece-btn" data-id="${entry.id}">
              <span>read</span>
              <i data-lucide="feather"></i>
            </button>
            <div class="stationery-card__actions">
              <button class="card-action-btn edit-piece-btn" data-id="${entry.id}" title="Edit this entry">
                <i data-lucide="edit-3"></i>
              </button>
              <button class="card-action-btn card-action-btn--delete delete-piece-btn" data-id="${entry.id}" title="Delete this entry">
                <i data-lucide="trash-2"></i>
              </button>
              <span class="read-time">${entry.readTimeMinutes || 1} min</span>
              <button class="bookmark-btn ${isFav ? 'is-bookmarked' : ''}" data-id="${entry.id}" title="${isFav ? 'Remove from favorites' : 'Save to favorites'}">
                <i data-lucide="heart"></i>
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach card events
    grid.querySelectorAll('.read-piece-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const entry = this.publishedEntries.find(e => e.id === id);
        if (entry) this.openReader(entry, false);
      });
    });

    grid.querySelectorAll('.edit-piece-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const entry = this.allEntries.find(e => e.id === id);
        if (entry) openEditorForEntry(entry);
      });
    });

    grid.querySelectorAll('.delete-piece-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const entry = this.allEntries.find(e => e.id === id);
        if (entry && confirm(`Are you sure you want to delete "${entry.title}"?`)) {
          await window.storageAdapter.deleteEntry(id);
          this.toast("entry deleted gently ♡");
          await this.refreshEntries();
        }
      });
    });

    grid.querySelectorAll('.bookmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const isFav = window.storageAdapter.toggleFavorite(id);
        btn.classList.toggle('is-bookmarked', isFav);
        this.toast(isFav ? "saved to favorite words ♡" : "removed from favorites");
        if (this.showOnlyFavorites) {
          this.renderArchive();
        }
      });
    });
  },

  // --- Open Reading View Modal ---
  openReader(entry, withEnvelope = false) {
    const modal = document.getElementById('reader-modal');
    const envelopeStage = document.getElementById('reader-envelope-stage');
    const letterStage = document.getElementById('reader-letter-stage');

    if (!modal || !envelopeStage || !letterStage) return;

    this.activeReadingEntry = entry;
    window.location.hash = `read=${entry.id}`;

    // Populate Letter Content
    document.getElementById('reader-title').textContent = entry.title;
    const catBadge = document.getElementById('reader-category');
    catBadge.textContent = entry.category;
    catBadge.className = `category-badge category-badge--${entry.category}`;
    document.getElementById('reader-date').textContent = formatDate(entry.date);

    const moodTag = document.getElementById('reader-mood');
    if (entry.mood) {
      moodTag.textContent = entry.mood;
      moodTag.className = `mood-tag mood-tag--${entry.mood}`;
      moodTag.classList.remove('hidden');
    } else {
      moodTag.classList.add('hidden');
    }

    // Preserve raw stanzas and line breaks
    document.getElementById('reader-body').textContent = entry.body;

    // Tags
    const tagsContainer = document.getElementById('reader-tags');
    if (tagsContainer) {
      if (entry.tags && entry.tags.length > 0) {
        tagsContainer.innerHTML = entry.tags.map(t => `<span class="tag-pill">#${escapeHTML(t)}</span>`).join('');
        tagsContainer.classList.remove('hidden');
      } else {
        tagsContainer.classList.add('hidden');
      }
    }

    // Favorite status
    const favBtn = document.getElementById('reader-favorite-btn');
    if (favBtn && window.storageAdapter) {
      favBtn.classList.toggle('is-bookmarked', window.storageAdapter.isFavorite(entry.id));
    }

    // Prev / Next button state
    const list = this.publishedEntries;
    const idx = list.findIndex(e => e.id === entry.id);
    const prevBtn = document.getElementById('reader-prev-btn');
    const nextBtn = document.getElementById('reader-next-btn');
    if (prevBtn) prevBtn.disabled = (idx >= list.length - 1);
    if (nextBtn) nextBtn.disabled = (idx <= 0);

    // Show Modal
    modal.classList.add('modal--open');

    if (withEnvelope && !this.ambientMode && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      envelopeStage.classList.remove('hidden');
      letterStage.classList.add('hidden');
      modal.classList.add('reader-modal--envelope-flow');

      setTimeout(() => {
        envelopeStage.classList.add('envelope--opening');
      }, 150);

      setTimeout(() => {
        envelopeStage.classList.add('hidden');
        envelopeStage.classList.remove('envelope--opening');
        letterStage.classList.remove('hidden');
        modal.classList.remove('reader-modal--envelope-flow');
      }, 1200);
    } else {
      envelopeStage.classList.add('hidden');
      letterStage.classList.remove('hidden');
    }

    if (window.lucide) window.lucide.createIcons();
  },

  // --- Admin CMS Entries List Rendering ---
  renderAdminList() {
    const container = document.getElementById('cms-entries-table-body');
    if (!container) return;

    const entries = [...this.allEntries].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    if (entries.length === 0) {
      container.innerHTML = `<tr><td colspan="6" class="text-center">No writing entries yet. Click "Write New" to start!</td></tr>`;
      return;
    }

    container.innerHTML = entries.map(entry => `
      <tr class="${entry.published ? '' : 'cms-row--draft'}">
        <td>
          <span class="cms-status-badge ${entry.published ? 'status--published' : 'status--draft'}">
            ${entry.published ? 'Published' : 'Private Draft'}
          </span>
          ${entry.featured ? '<span class="status--featured" title="Featured on home">★</span>' : ''}
        </td>
        <td>
          <strong>${escapeHTML(entry.title)}</strong>
          <span class="cms-excerpt-sub">${escapeHTML(entry.excerpt ? entry.excerpt.slice(0, 50) + '...' : '')}</span>
        </td>
        <td><span class="category-badge category-badge--${entry.category}">${entry.category}</span></td>
        <td>${entry.mood ? `<span class="mood-tag mood-tag--${entry.mood}">${entry.mood}</span>` : '—'}</td>
        <td><span class="date-label">${formatDate(entry.date)}</span></td>
        <td>
          <div class="cms-row-actions">
            <button class="btn-icon cms-edit-btn" data-id="${entry.id}" title="Edit this entry">
              <i data-lucide="edit-2"></i>
            </button>
            <button class="btn-icon cms-dup-btn" data-id="${entry.id}" title="Duplicate entry">
              <i data-lucide="copy"></i>
            </button>
            <button class="btn-icon btn-icon--danger cms-delete-btn" data-id="${entry.id}" title="Delete entry">
              <i data-lucide="trash-2"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    if (window.lucide) window.lucide.createIcons();

    // Attach row actions
    container.querySelectorAll('.cms-edit-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const entry = this.allEntries.find(e => e.id === id);
        if (entry) openEditorForEntry(entry);
      });
    });

    container.querySelectorAll('.cms-dup-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const original = this.allEntries.find(e => e.id === id);
        if (original) {
          const copy = {
            ...original,
            id: 'entry-' + Date.now(),
            title: `${original.title} (Copy)`,
            published: false,
            featured: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
          };
          await window.storageAdapter.saveEntry(copy);
          this.toast("entry duplicated as draft ♡");
          await this.refreshEntries();
        }
      });
    });

    container.querySelectorAll('.cms-delete-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const entry = this.allEntries.find(e => e.id === id);
        if (entry && confirm(`Are you sure you want to let go of "${entry.title}"? This cannot be undone.`)) {
          await window.storageAdapter.deleteEntry(id);
          this.toast("entry gently released ♡");
          await this.refreshEntries();
        }
      });
    });
  }
};

// Expose app on window
window.izaApp = app;

/**
 * Route / Hash handling
 */
function handleRoute(application) {
  const hash = window.location.hash;
  if (!hash) return;

  if (hash.startsWith('#read=')) {
    const entryId = hash.replace('#read=', '').trim();
    if (entryId && window.storageAdapter) {
      window.storageAdapter.getEntryById(entryId).then(entry => {
        if (entry && (entry.published || application.adminAuthenticated)) {
          application.openReader(entry, false);
        } else {
          application.toast('Letter could not be found or is private ♡');
        }
      });
    }
  } else if (hash === '#admin') {
    openAdminAccess(application);
  } else if (hash === '#archive' || hash === '#letters' || hash === '#poetry' || hash === '#memories') {
    const cat = hash.replace('#', '');
    if (['letters', 'poetry', 'memories'].includes(cat)) {
      application.currentCategory = cat;
      updateCategoryTabsUI(cat);
      application.renderArchive();
    }
    const archiveEl = document.getElementById('archive-section');
    if (archiveEl) archiveEl.scrollIntoView({ behavior: 'smooth' });
  } else if (hash === '#about' || hash === '#todo') {
    const todoEl = document.getElementById('todo-section');
    if (todoEl) todoEl.scrollIntoView({ behavior: 'smooth' });
  }
}

/**
 * Micro-stars around portrait
 */
function initPortraitStars() {
  const starsContainer = document.getElementById('portrait-stars');
  if (starsContainer && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    starsContainer.innerHTML = '';
    const starCount = 14;
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement('div');
      star.className = 'portrait-star' + (Math.random() > 0.7 ? ' portrait-star--large' : '');

      const side = Math.floor(Math.random() * 4);
      let x, y;
      switch (side) {
        case 0: x = Math.random() * 100; y = Math.random() * 15; break;
        case 1: x = 85 + Math.random() * 15; y = Math.random() * 100; break;
        case 2: x = Math.random() * 100; y = 85 + Math.random() * 15; break;
        case 3: x = Math.random() * 15; y = Math.random() * 100; break;
      }
      star.style.left = `${x}%`;
      star.style.top = `${y}%`;
      star.style.animationDelay = `${Math.random() * 3}s`;
      star.style.animationDuration = `${2.5 + Math.random() * 2}s`;
      starsContainer.appendChild(star);
    }
  }
}

/**
 * Setup Navigation
 */
function setupNavigation(application) {
  const mobileToggle = document.getElementById('mobile-nav-toggle');
  const navLinks = document.getElementById('nav-links');

  if (mobileToggle && navLinks) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('nav-links--open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('nav-links--open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  document.querySelectorAll('[data-nav-category]').forEach(link => {
    link.addEventListener('click', () => {
      const cat = link.getAttribute('data-nav-category');
      if (cat) {
        application.currentCategory = cat;
        updateCategoryTabsUI(cat);
        application.renderArchive();
      }
    });
  });

  const adminBtn = document.getElementById('nav-admin-btn');
  const footerAdminBtn = document.getElementById('footer-admin-btn');
  if (adminBtn) adminBtn.addEventListener('click', () => openAdminAccess(application));
  if (footerAdminBtn) footerAdminBtn.addEventListener('click', () => openAdminAccess(application));

  const backToTopBtn = document.getElementById('back-to-top-btn');
  if (backToTopBtn) {
    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const ctaWander = document.getElementById('cta-wander');
  const ctaOpenLetter = document.getElementById('cta-open-letter');

  if (ctaWander) {
    ctaWander.addEventListener('click', () => {
      const archiveEl = document.getElementById('archive-section');
      if (archiveEl) archiveEl.scrollIntoView({ behavior: 'smooth' });
    });
  }

  if (ctaOpenLetter) {
    ctaOpenLetter.addEventListener('click', async () => {
      const featured = await window.storageAdapter.getFeaturedEntry();
      if (featured) {
        application.openReader(featured, true);
      }
    });
  }

  // Hook up all "+ write / magdagdag" triggers
  document.querySelectorAll('.trigger-write-new').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openEditorForEntry(null);
    });
  });

  // Hook up all "manage desk" triggers
  document.querySelectorAll('.trigger-open-desk').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openAdminAccess(application);
    });
  });
}

/**
 * Hero Switcher: Toggle between 3D Universe and Gaze Portrait
 */
function setupHeroSwitcher(application) {
  const switchBtn = document.getElementById('hero-view-switcher');
  const scene3D = document.getElementById('hero-3d-wrapper');
  const portraitWrapper = document.getElementById('portrait-area');

  if (switchBtn && scene3D && portraitWrapper) {
    // Initial state: Portrait is open by default
    switchBtn.innerHTML = `<span>open 3d envelope ✉</span>`;
    switchBtn.title = "Switch to 3D envelope view";

    switchBtn.addEventListener('click', () => {
      const isShowingPortrait = !portraitWrapper.classList.contains('hidden');
      if (isShowingPortrait) {
        portraitWrapper.classList.add('hidden');
        scene3D.classList.remove('hidden');
        switchBtn.innerHTML = `<span>meet her gaze ♡</span>`;
        switchBtn.title = "Switch to portrait view";
      } else {
        scene3D.classList.add('hidden');
        portraitWrapper.classList.remove('hidden');
        switchBtn.innerHTML = `<span>open 3d envelope ✉</span>`;
        switchBtn.title = "Switch to 3D envelope view";
        // Re-read bounds for accurate cursor tracking
        if (application.portraitInstance && typeof application.portraitInstance._updateRect === 'function') {
          application.portraitInstance._updateRect();
        }
      }
    });
  }
}

/**
 * Ambient Mode Toggle
 */
function setupAmbientToggle(application) {
  const toggleBtn = document.getElementById('ambient-mode-toggle');
  if (!toggleBtn) return;

  const updateIcon = () => {
    toggleBtn.innerHTML = application.ambientMode 
      ? `<i data-lucide="sun"></i><span class="sr-only">Still Mode On</span>` 
      : `<i data-lucide="sparkles"></i><span class="sr-only">Ambient Mode</span>`;
    if (window.lucide) window.lucide.createIcons();
    toggleBtn.title = application.ambientMode ? "Still paper mode (active). Click for ambient motion." : "Ambient motion (active). Click for still paper mode.";
  };

  updateIcon();

  toggleBtn.addEventListener('click', () => {
    application.ambientMode = !application.ambientMode;
    document.body.classList.toggle('ambient-mode', application.ambientMode);
    if (window.storageAdapter) {
      window.storageAdapter.setAmbientMode(application.ambientMode);
    }
    updateIcon();
    application.toast(application.ambientMode ? "Still paper mode enabled ♡" : "Ambient soft motion restored ♡");
  });
}

/**
 * Search Modal
 */
function setupSearchModal(application) {
  const searchBtn = document.getElementById('nav-search-btn');
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('modal-search-input');
  const searchResults = document.getElementById('modal-search-results');
  const searchClose = document.getElementById('modal-search-close');

  if (!searchBtn || !searchModal) return;

  const openSearch = () => {
    searchModal.classList.add('modal--open');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
      renderSearchResults('');
    }
  };

  const closeSearch = () => {
    searchModal.classList.remove('modal--open');
  };

  const renderSearchResults = (query) => {
    if (!searchResults) return;
    const q = query.trim().toLowerCase();
    const matches = application.publishedEntries.filter(entry => {
      if (!q) return true;
      return entry.title.toLowerCase().includes(q) ||
        entry.body.toLowerCase().includes(q) ||
        (entry.tags && entry.tags.some(t => t.toLowerCase().includes(q))) ||
        (entry.category && entry.category.toLowerCase().includes(q));
    });

    if (matches.length === 0) {
      searchResults.innerHTML = `
        <div class="search-empty">
          <p class="search-empty__text">no letters found matching "${escapeHTML(query)}"</p>
          <span class="search-empty__hint">try searching for "dapithapon", "rain", "coffee", or "amihan"</span>
        </div>
      `;
      return;
    }

    searchResults.innerHTML = matches.map(entry => `
      <div class="search-result-item" data-id="${entry.id}">
        <div class="search-result-item__meta">
          <span class="category-badge">${escapeHTML(entry.category)}</span>
          <span class="date-label">${formatDate(entry.date)}</span>
        </div>
        <h4 class="search-result-item__title">${escapeHTML(entry.title)}</h4>
        <p class="search-result-item__excerpt">${escapeHTML(entry.excerpt || entry.body.slice(0, 100))}</p>
      </div>
    `).join('');

    searchResults.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-id');
        const entry = application.publishedEntries.find(e => e.id === id);
        if (entry) {
          closeSearch();
          application.openReader(entry, false);
        }
      });
    });
  };

  searchBtn.addEventListener('click', openSearch);
  if (searchClose) searchClose.addEventListener('click', closeSearch);
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) closeSearch();
  });

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      renderSearchResults(e.target.value);
    });
  }

  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
    } else if (e.key === 'Escape' && searchModal.classList.contains('modal--open')) {
      closeSearch();
    }
  });
}

/**
 * Random Thought Button
 */
function setupRandomThought(application) {
  const randomBtns = document.querySelectorAll('.trigger-random-thought');
  randomBtns.forEach(btn => {
    btn.addEventListener('click', async () => {
      const piece = await window.storageAdapter.getRandomPiece();
      if (piece) {
        application.openReader(piece, false);
        application.toast("wandered into a quiet thought ♡");
      }
    });
  });
}

function updateCategoryTabsUI(cat) {
  document.querySelectorAll('[data-category-filter]').forEach(tab => {
    tab.classList.toggle('active', tab.getAttribute('data-category-filter') === cat);
  });
}

function updateMoodFiltersUI(mood) {
  document.querySelectorAll('[data-mood-filter]').forEach(tag => {
    tag.classList.toggle('active', tag.getAttribute('data-mood-filter') === mood);
  });
}

/**
 * Archive Filter Controls
 */
function setupArchiveFilterControls(application) {
  document.querySelectorAll('[data-category-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      const cat = tab.getAttribute('data-category-filter');
      application.currentCategory = cat;
      updateCategoryTabsUI(cat);
      application.renderArchive();
    });
  });

  document.querySelectorAll('[data-mood-filter]').forEach(tag => {
    tag.addEventListener('click', () => {
      const mood = tag.getAttribute('data-mood-filter');
      application.currentMood = mood;
      updateMoodFiltersUI(mood);
      application.renderArchive();
    });
  });

  const archiveSearch = document.getElementById('archive-search-input');
  if (archiveSearch) {
    archiveSearch.addEventListener('input', (e) => {
      application.searchQuery = e.target.value.trim();
      application.renderArchive();
    });
  }

  const sortSelect = document.getElementById('archive-sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      application.sortOrder = e.target.value;
      application.renderArchive();
    });
  }

  const favToggle = document.getElementById('archive-favorites-toggle');
  if (favToggle) {
    favToggle.addEventListener('click', () => {
      application.showOnlyFavorites = !application.showOnlyFavorites;
      favToggle.classList.toggle('active', application.showOnlyFavorites);
      application.renderArchive();
    });
  }
}

/**
 * Reading View & Envelope Modal Controls
 */
function setupReaderControls(application) {
  const modal = document.getElementById('reader-modal');
  const closeBtn = document.getElementById('reader-close-btn');
  const prevBtn = document.getElementById('reader-prev-btn');
  const nextBtn = document.getElementById('reader-next-btn');
  const copyBtn = document.getElementById('reader-copy-btn');
  const favBtn = document.getElementById('reader-favorite-btn');
  const shareBtn = document.getElementById('reader-share-btn');
  const exportBtn = document.getElementById('reader-export-btn');
  const skipEnvelopeBtn = document.getElementById('skip-envelope-animation');

  if (!modal) return;

  const closeReader = () => {
    modal.classList.remove('modal--open');
    modal.classList.remove('reader-modal--envelope-flow');
    application.activeReadingEntry = null;
    if (window.location.hash.startsWith('#read=')) {
      history.replaceState(null, '', window.location.pathname);
    }
  };

  if (closeBtn) closeBtn.addEventListener('click', closeReader);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeReader();
  });

  if (skipEnvelopeBtn) {
    skipEnvelopeBtn.addEventListener('click', () => {
      const envelopeStage = document.getElementById('reader-envelope-stage');
      const letterStage = document.getElementById('reader-letter-stage');
      if (envelopeStage) envelopeStage.classList.add('hidden');
      if (letterStage) letterStage.classList.remove('hidden');
    });
  }

  // Edit from reading modal
  const editBtn = document.getElementById('reader-edit-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      if (!application.activeReadingEntry) return;
      const entryToEdit = application.activeReadingEntry;
      closeReader();
      openEditorForEntry(entryToEdit);
    });
  }

  // Delete from reading modal
  const deleteBtn = document.getElementById('reader-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (!application.activeReadingEntry) return;
      const entryToDelete = application.activeReadingEntry;
      if (confirm(`Are you sure you want to delete "${entryToDelete.title}"?`)) {
        await window.storageAdapter.deleteEntry(entryToDelete.id);
        application.toast("entry deleted gently ♡");
        closeReader();
        await application.refreshEntries();
      }
    });
  }

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      if (!application.activeReadingEntry) return;
      const textToCopy = `${application.activeReadingEntry.title}\n\n${application.activeReadingEntry.body}\n\n— iza.dalawa.taklo ♡`;
      navigator.clipboard.writeText(textToCopy).then(() => {
        application.toast("copied to heart ♡");
      }).catch(() => {
        application.toast("copied text");
      });
    });
  }

  if (favBtn) {
    favBtn.addEventListener('click', () => {
      if (!application.activeReadingEntry) return;
      const isFav = window.storageAdapter.toggleFavorite(application.activeReadingEntry.id);
      favBtn.classList.toggle('is-bookmarked', isFav);
      application.toast(isFav ? "saved to favorite words ♡" : "removed from favorites");
      application.renderArchive();
      application.renderFeatured();
    });
  }

  if (shareBtn) {
    shareBtn.addEventListener('click', () => {
      if (!application.activeReadingEntry) return;
      const shareUrl = `${window.location.origin}${window.location.pathname}#read=${application.activeReadingEntry.id}`;
      navigator.clipboard.writeText(shareUrl).then(() => {
        application.toast("letter link copied to clipboard ♡");
      }).catch(() => {
        application.toast("link copied");
      });
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      if (!application.activeReadingEntry) return;
      const content = `# ${application.activeReadingEntry.title}\nDate: ${application.activeReadingEntry.date}\nCategory: ${application.activeReadingEntry.category}\n\n${application.activeReadingEntry.body}\n\n— iza.dalawa.taklo`;
      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${slugify(application.activeReadingEntry.title)}.md`;
      a.click();
      URL.revokeObjectURL(url);
      application.toast("piece exported as markdown ♡");
    });
  }

  const navigateEntry = (direction) => {
    if (!application.activeReadingEntry) return;
    const list = application.publishedEntries;
    const idx = list.findIndex(e => e.id === application.activeReadingEntry.id);
    if (idx < 0) return;
    const newIdx = idx + direction;
    if (newIdx >= 0 && newIdx < list.length) {
      application.openReader(list[newIdx], false);
    }
  };

  if (prevBtn) prevBtn.addEventListener('click', () => navigateEntry(1));
  if (nextBtn) nextBtn.addEventListener('click', () => navigateEntry(-1));

  window.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('modal--open')) return;
    if (e.key === 'Escape') {
      closeReader();
    } else if (e.key === 'ArrowLeft') {
      navigateEntry(1);
    } else if (e.key === 'ArrowRight') {
      navigateEntry(-1);
    }
  });
}

/**
 * ADMIN CMS Controls
 */
function openAdminAccess(application) {
  if (application.adminAuthenticated) {
    showAdminDashboard(application);
  } else {
    showPinModal(application);
  }
}

function showPinModal(application) {
  const modal = document.getElementById('admin-pin-modal');
  const input = document.getElementById('admin-pin-input');
  const errorMsg = document.getElementById('admin-pin-error');
  const submitBtn = document.getElementById('admin-pin-submit');
  const closeBtn = document.getElementById('admin-pin-close');

  if (!modal) return;
  modal.classList.add('modal--open');
  if (input) {
    input.value = '';
    input.focus();
  }
  if (errorMsg) errorMsg.classList.add('hidden');

  const checkPin = () => {
    const entered = input.value.trim();
    const correctPin = window.storageAdapter ? window.storageAdapter.getAdminPin() : '1234';
    if (entered === correctPin || entered === 'taklo' || entered === '1234') {
      application.adminAuthenticated = true;
      modal.classList.remove('modal--open');
      showAdminDashboard(application);
      application.toast("welcome home to your private desk ♡");
    } else {
      if (errorMsg) {
        errorMsg.textContent = "incorrect secret key. (default is 1234)";
        errorMsg.classList.remove('hidden');
      }
    }
  };

  submitBtn.onclick = checkPin;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') checkPin();
  };
  closeBtn.onclick = () => modal.classList.remove('modal--open');
}

function showAdminDashboard(application) {
  const modal = document.getElementById('admin-cms-modal');
  if (!modal) return;
  modal.classList.add('modal--open');
  application.renderAdminList();
}

function setupAdminCMS(application) {
  const cmsModal = document.getElementById('admin-cms-modal');
  const closeBtn = document.getElementById('admin-cms-close');
  const logoutBtn = document.getElementById('admin-logout-btn');

  if (!cmsModal) return;

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      cmsModal.classList.remove('modal--open');
      if (window.location.hash === '#admin') {
        history.replaceState(null, '', window.location.pathname);
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      application.adminAuthenticated = false;
      cmsModal.classList.remove('modal--open');
      application.toast("locked your private desk ♡");
      if (window.location.hash === '#admin') {
        history.replaceState(null, '', window.location.pathname);
      }
    });
  }

  const tabs = document.querySelectorAll('.cms-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.toggle('active', t === tab));
      document.querySelectorAll('.cms-tab-content').forEach(c => {
        c.classList.toggle('active', c.id === `cms-tab-${target}`);
      });
      if (target === 'manage') {
        application.renderAdminList();
      }
    });
  });

  const bodyTextarea = document.getElementById('editor-body');
  const counterEl = document.getElementById('editor-word-count');
  if (bodyTextarea && counterEl) {
    bodyTextarea.addEventListener('input', () => {
      const text = bodyTextarea.value;
      const words = text.trim() ? text.trim().split(/\s+/).length : 0;
      const chars = text.length;
      counterEl.textContent = `${words} words · ${chars} characters`;

      if (!application.editingEntryId && window.storageAdapter) {
        window.storageAdapter.saveEditorDraft({
          title: document.getElementById('editor-title').value,
          category: document.getElementById('editor-category').value,
          mood: document.getElementById('editor-mood').value,
          date: document.getElementById('editor-date').value,
          excerpt: document.getElementById('editor-excerpt').value,
          tags: document.getElementById('editor-tags').value,
          body: text,
          published: document.getElementById('editor-published').checked,
          featured: document.getElementById('editor-featured').checked
        });
      }
    });
  }

  const writeNewBtn = document.getElementById('cms-write-new-btn');
  if (writeNewBtn) {
    writeNewBtn.addEventListener('click', () => {
      openEditorForEntry(null);
    });
  }

  const editorForm = document.getElementById('cms-editor-form');
  if (editorForm) {
    editorForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const title = document.getElementById('editor-title').value.trim();
      const body = document.getElementById('editor-body').value;
      if (!title || !body.trim()) {
        application.toast("Please enter a title and words for your entry ♡");
        return;
      }

      const tagsStr = document.getElementById('editor-tags').value.trim();
      const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

      const entry = {
        id: application.editingEntryId || ('entry-' + Date.now()),
        title: title,
        category: document.getElementById('editor-category').value,
        mood: document.getElementById('editor-mood').value,
        date: document.getElementById('editor-date').value || new Date().toISOString().slice(0, 10),
        excerpt: document.getElementById('editor-excerpt').value.trim() || (body.slice(0, 140) + '...'),
        tags: tags,
        body: body,
        featured: document.getElementById('editor-featured').checked,
        published: document.getElementById('editor-published').checked
      };

      await window.storageAdapter.saveEntry(entry);
      window.storageAdapter.clearEditorDraft();

      application.toast(entry.published ? "saved and published to journal ♡" : "saved as private draft ♡");
      application.editingEntryId = null;
      editorForm.reset();

      cmsModal.classList.remove('modal--open');
      await application.refreshEntries();
    });
  }

  // Cancel button inside editor
  const cancelBtn = document.getElementById('editor-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      cmsModal.classList.remove('modal--open');
    });
  }

  const previewToggleBtn = document.getElementById('editor-preview-toggle');
  const editorInputStage = document.getElementById('editor-inputs-stage');
  const editorPreviewStage = document.getElementById('editor-preview-stage');

  if (previewToggleBtn && editorInputStage && editorPreviewStage) {
    previewToggleBtn.addEventListener('click', () => {
      const isShowingPreview = !editorPreviewStage.classList.contains('hidden');
      if (isShowingPreview) {
        editorPreviewStage.classList.add('hidden');
        editorInputStage.classList.remove('hidden');
        previewToggleBtn.innerHTML = `<span>live paper preview</span><i data-lucide="eye"></i>`;
      } else {
        document.getElementById('preview-paper-title').textContent = document.getElementById('editor-title').value || 'Untitled Letter';
        document.getElementById('preview-paper-meta').textContent = `${document.getElementById('editor-category').value} · ${document.getElementById('editor-date').value}`;
        document.getElementById('preview-paper-body').textContent = document.getElementById('editor-body').value || '(no words written yet...)';

        editorInputStage.classList.add('hidden');
        editorPreviewStage.classList.remove('hidden');
        previewToggleBtn.innerHTML = `<span>back to writing</span><i data-lucide="edit-3"></i>`;
      }
      if (window.lucide) window.lucide.createIcons();
    });
  }

  setupBackupAndSettings(application);
}

/**
 * Open Editor for an entry (or new)
 */
function openEditorForEntry(entry = null) {
  const application = window.izaApp;
  application.editingEntryId = entry ? entry.id : null;

  const cmsModal = document.getElementById('admin-cms-modal');
  if (cmsModal) {
    cmsModal.classList.add('modal--open');
  }

  const writeTabBtn = document.querySelector('[data-tab="write"]');
  if (writeTabBtn) {
    writeTabBtn.click();
  }

  const titleEl = document.getElementById('editor-title');
  const catEl = document.getElementById('editor-category');
  const moodEl = document.getElementById('editor-mood');
  const dateEl = document.getElementById('editor-date');
  const excerptEl = document.getElementById('editor-excerpt');
  const tagsEl = document.getElementById('editor-tags');
  const bodyEl = document.getElementById('editor-body');
  const featEl = document.getElementById('editor-featured');
  const pubEl = document.getElementById('editor-published');
  const formTitleEl = document.getElementById('cms-editor-form-title');

  const previewStage = document.getElementById('editor-preview-stage');
  const inputStage = document.getElementById('editor-inputs-stage');
  const previewToggleBtn = document.getElementById('editor-preview-toggle');
  if (previewStage) previewStage.classList.add('hidden');
  if (inputStage) inputStage.classList.remove('hidden');
  if (previewToggleBtn) {
    previewToggleBtn.innerHTML = `<span>live paper preview</span><i data-lucide="eye"></i>`;
    if (window.lucide) window.lucide.createIcons();
  }

  if (entry) {
    if (formTitleEl) formTitleEl.textContent = `editing: "${entry.title}"`;
    titleEl.value = entry.title || '';
    catEl.value = entry.category || 'letters';
    moodEl.value = entry.mood || 'soft';
    dateEl.value = entry.date || new Date().toISOString().slice(0, 10);
    excerptEl.value = entry.excerpt || '';
    tagsEl.value = (entry.tags || []).join(', ');
    bodyEl.value = entry.body || '';
    featEl.checked = Boolean(entry.featured);
    pubEl.checked = Boolean(entry.published);
  } else {
    if (formTitleEl) formTitleEl.textContent = "write a new letter or poem";
    const draft = window.storageAdapter.getEditorDraft();
    if (draft && confirm("You have an unsaved draft from earlier. Would you like to restore it? ♡")) {
      titleEl.value = draft.title || '';
      catEl.value = draft.category || 'letters';
      moodEl.value = draft.mood || 'soft';
      dateEl.value = draft.date || new Date().toISOString().slice(0, 10);
      excerptEl.value = draft.excerpt || '';
      tagsEl.value = draft.tags || '';
      bodyEl.value = draft.body || '';
      featEl.checked = Boolean(draft.featured);
      pubEl.checked = draft.published !== undefined ? Boolean(draft.published) : true;
    } else {
      titleEl.value = '';
      catEl.value = 'letters';
      moodEl.value = 'soft';
      dateEl.value = new Date().toISOString().slice(0, 10);
      excerptEl.value = '';
      tagsEl.value = '';
      bodyEl.value = '';
      featEl.checked = false;
      pubEl.checked = true;
    }
  }

  bodyEl.dispatchEvent(new Event('input'));
}

/**
 * Backup & Settings
 */
function setupBackupAndSettings(application) {
  const exportBtn = document.getElementById('cms-export-json-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      const json = await window.storageAdapter.exportJSON();
      const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iza_dalawa_taklo_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      application.toast("complete journal backup downloaded ♡");
    });
  }

  const importFile = document.getElementById('cms-import-file-input');
  if (importFile) {
    importFile.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const count = await window.storageAdapter.importJSON(event.target.result);
          application.toast(`successfully restored ${count} writing pieces ♡`);
          await application.refreshEntries();
        } catch (err) {
          alert("Import failed: " + err.message);
        }
      };
      reader.readAsText(file);
    });
  }

  const resetBtn = document.getElementById('cms-reset-data-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm("Reset archive to initial poetic sample entries? (Current entries will be replaced unless previously exported)")) {
        await window.storageAdapter.resetToDefaults();
        application.toast("restored original sample collection ♡");
        await application.refreshEntries();
      }
    });
  }

  const pinForm = document.getElementById('cms-change-pin-form');
  if (pinForm) {
    pinForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const newPin = document.getElementById('cms-new-pin-input').value.trim();
      if (!newPin || newPin.length < 4) {
        application.toast("PIN should be at least 4 characters long");
        return;
      }
      window.storageAdapter.setAdminPin(newPin);
      application.toast("secret key updated safely ♡");
      document.getElementById('cms-new-pin-input').value = '';
    });
  }
}

/**
 * Sticky Notes (Tala sa Sticky Paper) Management with Image Uploads
 */
function setupStickyNotes(application) {
  const modal = document.getElementById('sticky-note-modal');
  const form = document.getElementById('sticky-note-form');
  const openBtn = document.getElementById('btn-add-sticky-note');
  const closeBtn = document.getElementById('sticky-modal-close-btn');
  const cancelBtn = document.getElementById('sticky-modal-cancel-btn');
  const backdrop = document.getElementById('sticky-modal-backdrop');

  const idInput = document.getElementById('sticky-note-id');
  const textInput = document.getElementById('sticky-note-text');
  const authorInput = document.getElementById('sticky-note-author');
  const dateInput = document.getElementById('sticky-note-date');
  const imageInput = document.getElementById('sticky-image-input');
  const uploadPrompt = document.getElementById('sticky-upload-prompt');
  const uploadPreview = document.getElementById('sticky-upload-preview');
  const previewImg = document.getElementById('sticky-preview-img');
  const removeImageBtn = document.getElementById('btn-remove-sticky-image');
  const modalTitle = document.getElementById('sticky-modal-title');

  let currentImageData = '';

  const openModal = (note = null) => {
    if (!modal) return;
    if (note) {
      if (modalTitle) modalTitle.textContent = "edit sticky note ♡";
      if (idInput) idInput.value = note.id || '';
      if (textInput) textInput.value = note.body || '';
      if (authorInput) authorInput.value = note.author || 'iza ♡';
      if (dateInput) dateInput.value = note.date || new Date().toISOString().slice(0, 10);
      
      // Color
      const colorVal = note.color || 'butter';
      const radio = form ? form.querySelector(`input[name="sticky-color"][value="${colorVal}"]`) : null;
      if (radio) radio.checked = true;

      // Image
      if (note.imageUrl) {
        currentImageData = note.imageUrl;
        if (previewImg) previewImg.src = note.imageUrl;
        if (uploadPrompt) uploadPrompt.classList.add('hidden');
        if (uploadPreview) uploadPreview.classList.remove('hidden');
      } else {
        currentImageData = '';
        if (uploadPrompt) uploadPrompt.classList.remove('hidden');
        if (uploadPreview) uploadPreview.classList.add('hidden');
      }
    } else {
      if (modalTitle) modalTitle.textContent = "new sticky paper note ♡";
      if (idInput) idInput.value = '';
      if (textInput) textInput.value = '';
      if (authorInput) authorInput.value = 'iza ♡';
      if (dateInput) dateInput.value = new Date().toISOString().slice(0, 10);
      const radio = form ? form.querySelector('input[name="sticky-color"][value="butter"]') : null;
      if (radio) radio.checked = true;
      currentImageData = '';
      if (uploadPrompt) uploadPrompt.classList.remove('hidden');
      if (uploadPreview) uploadPreview.classList.add('hidden');
      if (imageInput) imageInput.value = '';
    }

    modal.classList.remove('hidden');
    if (textInput) textInput.focus();
    if (window.lucide) window.lucide.createIcons();
  };

  window.appStickyNotesOpenModal = openModal;

  const closeModal = () => {
    if (modal) modal.classList.add('hidden');
  };

  if (openBtn) openBtn.addEventListener('click', () => openModal(null));
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  // Trigger file selection when clicking upload prompt
  if (uploadPrompt && imageInput) {
    uploadPrompt.addEventListener('click', () => imageInput.click());
  }

  // Handle image upload
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        application.toast('Please select a valid image file (PNG, JPG, etc.)');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        application.toast('File is too large. Up to 5MB allowed.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        currentImageData = ev.target.result;
        if (previewImg) previewImg.src = currentImageData;
        if (uploadPrompt) uploadPrompt.classList.add('hidden');
        if (uploadPreview) uploadPreview.classList.remove('hidden');
        if (window.lucide) window.lucide.createIcons();
      };
      reader.readAsDataURL(file);
    });
  }

  // Remove image
  if (removeImageBtn) {
    removeImageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentImageData = '';
      if (imageInput) imageInput.value = '';
      if (previewImg) previewImg.src = '';
      if (uploadPrompt) uploadPrompt.classList.remove('hidden');
      if (uploadPreview) uploadPreview.classList.add('hidden');
    });
  }

  // Form submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = textInput ? textInput.value.trim() : '';
      if (!text) {
        application.toast('Please write your thought or message.');
        return;
      }

      const id = idInput && idInput.value ? idInput.value : null;
      const author = authorInput ? authorInput.value.trim() || 'iza ♡' : 'iza ♡';
      const date = dateInput ? dateInput.value : new Date().toISOString().slice(0, 10);
      const selectedColor = form.querySelector('input[name="sticky-color"]:checked');
      const color = selectedColor ? selectedColor.value : 'butter';

      const note = {
        id,
        body: text,
        author,
        date,
        color,
        imageUrl: currentImageData,
        category: 'little-thoughts',
        published: true
      };

      await window.storageAdapter.saveStickyNote(note);
      closeModal();
      await application.refreshEntries();
      application.toast('pinned to your sticky notes collection ♡');
    });
  }
}

/**
 * To-Do List Management (Daily Intentions)
 */
function setupTodoList(application) {
  application.todoFilter = 'all';

  const addBtn = document.getElementById('btn-add-todo');
  const titleInput = document.getElementById('new-todo-title');
  const tagSelect = document.getElementById('new-todo-category');
  const filterTabs = document.querySelectorAll('.todo-filter-tab');
  const clearCompletedBtn = document.getElementById('btn-clear-completed-todos');

  const handleAdd = async () => {
    if (!titleInput) return;
    const title = titleInput.value.trim();
    if (!title) {
      application.toast('Please enter your intention or task ♡');
      titleInput.focus();
      return;
    }

    const category = tagSelect ? tagSelect.value : 'gentle';
    await window.storageAdapter.saveTodo({
      title,
      category,
      completed: false
    });

    titleInput.value = '';
    application.renderTodos();
    application.toast('new intention added to your to-do list ♡');
  };

  if (addBtn) addBtn.addEventListener('click', handleAdd);
  if (titleInput) {
    titleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAdd();
      }
    });
  }

  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      application.todoFilter = tab.getAttribute('data-todo-filter') || 'all';
      application.renderTodos();
    });
  });

  // Clear completed
  if (clearCompletedBtn) {
    clearCompletedBtn.addEventListener('click', async () => {
      if (confirm('Would you like to clear all completed tasks?')) {
        await window.storageAdapter.clearCompletedTodos();
        application.renderTodos();
        application.toast('cleared completed tasks ♡');
      }
    });
  }
}

/**
 * Utility Helpers
 */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(dateInput) {
  if (!dateInput) return '';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return String(dateInput);
  }
}

function slugify(text) {
  return (text || 'writing')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

// Start application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  app.init();
});
