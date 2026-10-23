# iza.dalawa.taklo ✉ ♡
*An Aesthetic Interactive Digital Poetry Journal & Sanctuary*

> *"Some words are too precious to disappear."*

---

## 🌸 Overview

**iza.dalawa.taklo** is a delicate, intimate digital poetry sanctuary and personal letter journal inspired by handwritten love letters, quiet memories, dreamy editorial layouts, and soft interactive digital experiences.

It is crafted for the owner to paste, write, organize, edit, and preserve her letters, poems, journal entries, fleeting thoughts, and meaningful memories in a space that feels like tactile stationery paper.

---

## ✨ Features

### 1. "A Little Universe of Words" — Three.js 3D Hero Experience
- **Tactile 3D Floating Envelope**: Modeled in Three.js with soft ivory paper folds and a muted rose wax seal embossed with a vintage gold heart.
- **Atmospheric Particles**: Drifting fireflies/star motes and tumbling blush rose petals that sway gently in 3D perspective.
- **Interactive Parallax & Tactile Click**: Responds smoothly to cursor movement and tactile hover. Clicking the 3D letter unfolds the featured piece with a graceful flutter.
- **Experience Switcher**: A seamless toggle allowing visitors to switch between the **3D Universe of Words** and the **Interactive Gaze-Following Portrait**.
- **Graceful Fallback**: Automatically degrades to a stationery CSS envelope if WebGL is unavailable.

### 2. "Her Eyes Follow You" — Interactive Portrait
- 7 directional photographs (`center`, `left`, `right`, `up`, `down`, `upper-left`, `lower-left`) crossfaded seamlessly using requestAnimationFrame and smooth cursor physics.
- Accented with vintage gold filigree corner brackets, twinkling micro-stars, and handwritten annotations.

### 3. Dedicated Reading Experience & Envelope Flow
- **Animated Envelope Unfolding**: Opening a featured piece initiates an envelope-opening sequence revealing the deckle-edged paper letter inside (with an instant skip button for accessibility).
- **Exact Text & Stanza Preservation**: Faithfully renders raw formatting, stanza indents, line breaks, emojis, and bilingual Filipino/Taglish/English text without stripping whitespace.
- **Reading Actions**:
  - **Copy to Clipboard** with toast confirmation (*"copied to heart ♡"*).
  - **Bookmark / Favorite** with heart animation.
  - **Shareable Link** deep-links directly using `#read={id}`.
  - **Export as Markdown (.md)** for offline storage.
  - **Previous / Next Piece** navigation buttons.

### 4. Letters & Poetry Archive
- **6 Curated Categories**: Letters, Poetry, Journal, Little Thoughts, Memories, Unsent Letters.
- **Mood Tag Filtering**: *soft*, *hopeful*, *nostalgic*, *bittersweet*, *sleepy*, *happy*, *unsent*.
- **Live Search**: Instant keyword filtering across titles, verses, and tags.
- **Favorites Filter**: Quick toggle to view bookmarked pieces.
- **Sorting**: Newest first vs. oldest first.
- **Daily Selection**: Deterministic daily read that remains consistent for each day.
- **"Give me a random thought ♡"**: Instant discovery button in navigation and hero.

### 5. Private Writing Desk (CMS)
Accessible via the discreet quill/feather icon in the navigation and footer:
- **Passkey Protection**: Default PIN is `1234` or `taklo` (changeable in Desk Settings).
- **Large Comfortable Textarea**: Designed specifically for easy pasting from Instagram captions, Notes, and chat messages.
- **Live Paper Preview**: Toggle between raw typing and real-time stationery preview before publishing.
- **Auto-Save Draft Recovery**: Automatically caches unsaved edits so words are never lost if a tab is accidentally closed.
- **Drafts vs. Published**: Unpublished drafts are kept strictly private and hidden from public visitors, searches, and daily picks.
- **Word & Character Counters**: Dynamic real-time stats.
- **Duplicate & Delete**: Manage your catalog with safety confirmations.

### 6. Local-First Persistence & Backups
- **Primary Database**: Browser `IndexedDB` (`iza_dalawa_taklo_db`) with automatic fallback to `localStorage`.
- **JSON Backup Export**: Download a full JSON timestamped archive of all writings with one click.
- **Backup Restore**: Upload and import past backup files with automatic validation.
- **Export Single Piece**: Save individual poems or letters as `.md` or `.txt`.
- **Reset Option**: Restore default sample collection anytime.

### 7. Accessibility & Ambient Mode
- **Ambient Mode Toggle**: Switch between dynamic motion and still paper mode for quiet, comfortable reading.
- **Prefers-Reduced-Motion**: Respects user OS accessibility settings.
- **Fully Responsive**: Flawless experience on mobile phones, tablets, laptops, and ultra-wide screens.
- **Offline Ready**: Bundled with local copies of Three.js and Lucide icons with CDN fallbacks.

---

## 🎨 Visual Identity & Color Palette

| Token | Hex | Role |
| :--- | :--- | :--- |
| **Warm Ivory** | `#FAF7F2` | Primary background, natural paper warmth |
| **Paper White** | `#FFFEFC` | Stationery cards and letter sheets |
| **Dusty Blush** | `#E9C9CF` | Soft atmospheric glow and delicate accents |
| **Muted Rose** | `#BD8796` | Wax seal, active tabs, link underlines |
| **Cocoa Brown** | `#6D5755` | Secondary text, stationery borders |
| **Soft Charcoal** | `#353131` | Wordmark, titles, high-readability body |
| **Faded Lavender**| `#DCD6E8` | Dreamy background radial accents |
| **Vintage Gold** | `#C9A96E` | Stamp accents and portrait corners |

### Typography
- **Display & Headings**: Cormorant Garamond
- **Handwritten Annotations**: Caveat
- **Interface & Metadata**: Inter

---

## 🚀 Getting Started & Running Locally

The project is built with vanilla web technologies (HTML5, Vanilla CSS, and modern JavaScript modules) and requires no build steps or bundlers.

### Option 1: Python HTTP Server
```bash
python -m http.server 8080
```
Then visit `http://localhost:8080` in your browser.

### Option 2: Node.js / npx serve
```bash
npx serve -l 8080
```

### Option 3: Direct File Opening
You can also open [index.html](file:///e:/FILES/PORTFOLIO/iza.dalawa.taklo/index.html) directly in any modern browser!

---

## 🔐 Private Desk (Admin Access)

1. Click the feather icon (`🪶`) on the top-right of the navigation or the `desk` link in the footer.
2. Enter the passkey: `1234` (or `taklo`).
3. Click **"unlock desk"**.
4. You can change your PIN under the **Settings & Backup** tab.

---

## ☁️ Connecting Supabase (Optional Remote Sync)

The website is architected with a decoupled `StorageAdapter` pattern. To connect to Supabase for multi-device sync:

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Create a table named `writings`:
   ```sql
   create table writings (
     id text primary key,
     title text not null,
     category text not null,
     mood text,
     date text,
     excerpt text,
     body text not null,
     tags text[],
     featured boolean default false,
     published boolean default true,
     created_at bigint,
     updated_at bigint
   );

   -- Enable Row Level Security (RLS)
   alter table writings enable row level security;

   -- Public read policy (only published entries)
   create policy "Public writings are viewable by everyone"
     on writings for select
     using (published = true);

   -- Authenticated owner policy (full access)
   create policy "Owner has full access"
     on writings for all
     to authenticated
     using (true);
   ```
3. Copy `.env.example` to `.env` and fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
4. In `storage-adapter.js`, replace the local CRUD methods with the corresponding Supabase JS client calls (`supabase.from('writings').select('*')`, etc.).

---

## 📂 Project Structure

```
iza.dalawa.taklo/
├── index.html            # Semantic HTML5 layout, modals, and templates
├── styles.css            # Complete design system & responsive styling
├── storage-adapter.js    # IndexedDB persistence, bookmarks, import/export
├── hero-scene.js         # Three.js 3D floating origami envelope & particles
├── portrait.js           # Interactive 7-direction gaze-tracking portrait
├── particles.js          # Lightweight canvas background particle system
├── app.js                # Core controller, router, reading modal & CMS desk
├── .env.example          # Remote Supabase backend configuration template
├── README.md             # Documentation, architecture, and setup instructions
└── assets/
    ├── three.min.js      # Bundled Three.js (offline ready)
    ├── lucide.min.js     # Bundled Lucide icons (offline ready)
    └── portrait/         # Directional photography for gaze tracking
        ├── gaze-center.png
        ├── gaze-left.png
        ├── gaze-right.png
        ├── gaze-up.png
        ├── gaze-down.png
        ├── gaze-upper-left.png
        ├── gaze-lower-left.png
        └── original-composite.png
```

---

## 💌 Keyboard Shortcuts

- <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> — Open search modal
- <kbd>Esc</kbd> — Close any open modal (reader, CMS, search, PIN)
- <kbd>←</kbd> / <kbd>→</kbd> — Navigate previous / next piece inside the reader

---

*“Thank you for being here, even for a little while. ♡”*
