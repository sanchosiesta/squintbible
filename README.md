# NASB Bible — Offline Reader with Vim Keybindings

**[Launch App →](https://sanchosiesta.github.io/squintbible/)**

A single-page offline Bible reader built with [Squint](https://github.com/squint-cljs/squint) (ClojureScript), [Reagami](https://github.com/squint-cljs/reagami), [Dexie.js](https://dexie.org/), and [Bulma CSS](https://bulma.io/).

## Features

- **Offline-first** — all 66 books stored in IndexedDB via Dexie.js
- **Vim keybindings** — navigate the entire Bible without touching the mouse
- **Persistent highlights** — click any verse to highlight (yellow), saved to IndexedDB
- **Scroll position memory** — returns to where you left off in each chapter
- **Search** — substring search with dark pink match highlighting
- **Font size control** — 10–48px, saved to IndexedDB
- **Load All** — bulk-load all 66 books into IndexedDB for full offline use

## Vim Keys

| Key | Action |
|---|---|
| `j` / `k` | Next / previous verse |
| `h` / `l` | Previous / next chapter (wraps books) |
| `gg` | Scroll to page top |
| `G` | Go to last verse of chapter |
| `/` | Focus search bar |
| `Enter` | Search / scroll half-page down |
| `Backspace` | Scroll half-page up |
| `n` / `N` | Next / previous search match |
| `Ctrl+d` / `Ctrl+u` | Half-page scroll down / up |
| `Ctrl+f` / `Ctrl+b` | Full-page scroll down / up |
| `Ctrl+=` / `Ctrl+-` | Increase / decrease font size |
| `0-9` | Jump to chapter number |
| `Esc` / `Ctrl-[` | Exit search |

## Data

NASB (New American Standard Bible) text from 66 per-book JSON files in `data/`.

## Development

```bash
# Serve locally
python3 -m http.server 8765

# Recompile after changes to app.cljs
npx squint-cljs compile app.cljs
```
