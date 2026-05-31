# Readable

A minimal, distraction-free web reader that transforms cluttered articles and blog posts into clean, readable documents.

Readable extracts only the essential content from webpages while preserving images, videos, links, and formatting. It provides a focused reading experience with customizable themes, text highlighting, offline storage, and PDF export.

---

## Features

### Clean Article Extraction

- Paste any article or blog URL
- Automatically extracts the main content
- Removes:
  - Advertisements
  - Navigation menus
  - Cookie banners
  - Sidebars
  - Popups
  - Recommendation widgets
  - Other non-essential page elements

### Distraction-Free Reading

- Minimal and professional interface
- Optimized typography
- Comfortable reading width
- Responsive design for desktop and mobile

### Theme Support

- Light Mode
- Dark Mode
- Theme preference persistence

### Text Highlighting

Highlight selected text using eight pastel colors:

| Color             | Purpose            |
| ----------------- | ------------------ |
| Pastel Yellow     | General highlights |
| Pastel Red        | Important notes    |
| Pastel Lime Green | Key concepts       |
| Pastel Sky Blue   | References         |
| Pastel Orange     | Warnings           |
| Pastel Pink       | Personal notes     |
| Pastel Purple     | Research insights  |
| Pastel Ash        | Neutral marking    |

Highlights are automatically saved and restored.

### Offline Reading

- Uses IndexedDB for local storage
- Previously saved articles remain accessible offline
- Fast reopening without re-fetching content

### PDF Export

Export articles as clean, printable PDFs with:

- Article title
- Content formatting
- Images
- Preserved highlights (where supported)

### Safe Content Rendering

- Sanitized HTML rendering
- Protection against malicious embedded content
- Secure client-side processing

---

## Technology Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS

### Storage

- IndexedDB

### Content Processing

- Mozilla Readability
- DOMParser
- DOMPurify

### PDF Generation

- html2pdf.js
- jsPDF

---

## Project Architecture

```text
src/
│
├── components/
│   ├── Reader/
│   ├── Toolbar/
│   ├── ArticleList/
│   ├── HighlightMenu/
│   └── ThemeToggle/
│
├── services/
│   ├── extractor/
│   ├── storage/
│   ├── highlights/
│   └── pdf/
│
├── hooks/
│
├── utils/
│
├── pages/
│
└── types/
```

---

## How It Works

1. User enters an article URL.
2. Readable fetches the page content.
3. Readability extracts the primary article body.
4. Content is sanitized and rendered.
5. Article is stored locally in IndexedDB.
6. User can:
   - Read offline
   - Highlight text
   - Switch themes
   - Export to PDF

---

## Data Storage

Each article is stored locally using IndexedDB.

Example structure:

```json
{
  "id": "uuid",
  "url": "https://example.com/article",
  "title": "Article Title",
  "contentHTML": "<article>...</article>",
  "createdAt": "2026-01-01T00:00:00Z",
  "highlights": []
}
```

No raw webpage source is stored. Only the cleaned article content is saved.

---

## Privacy

Readable is designed with privacy in mind.

- No user accounts
- No tracking
- No analytics
- No cloud storage
- No external databases

All data remains on the user's device.

---

## Future Roadmap

### Planned Features

- Full-text search across saved articles
- Tags and collections
- Reading progress tracking
- Import/export library
- Multi-device sync
- EPUB export
- Reading statistics
- Annotation system
- AI-powered summaries

---

## Development

### Installation

```bash
git clone https://github.com/yourusername/Readable.git

cd Readable

npm install

npm run dev
```

### Production Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

---

## Design Philosophy

The modern web is often filled with distractions that interfere with reading. Readable focuses on a single objective:

> Extract the knowledge, remove the noise.

By combining robust content extraction, offline storage, customizable reading themes, and lightweight annotation tools, Readable delivers a focused reading experience for students, researchers, developers, and lifelong learners.

---

## License

MIT License

Feel free to use, modify, and distribute this project.
