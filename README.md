# FTSM eThesis Search

Enhanced search for FTSM UKM theses — filter by degree, research center, year, and language.

🔗 **Live site**: https://zhafranzainal.github.io/ftsm-ethesis/

---

## Stack

- **Frontend**: React + Vite + TypeScript
- **Data**: `public/theses.json` (committed to repo)
- **Hosting**: GitHub Pages
- **Scraper**: Playwright + TypeScript (incremental)
- **Scheduler**: GitHub Actions (monthly cron)

---

## First-Time Setup

### 1. Clone & install

```bash
git clone https://github.com/zhafranzainal/ftsm-ethesis.git
cd ftsm-ethesis
npm install
```

### 2. Run the initial full scrape (once only)

```bash
cd scraper
npm install
npx playwright install chromium
npm run scrape:full
```

This scrapes all pages and writes `public/theses.json`. Takes ~5–10 minutes.

### 3. Commit the data

```bash
git add public/theses.json
git commit -m "feat: initial thesis data"
git push
```

### 4. Enable GitHub Pages

- Go to repo **Settings → Pages**
- Set source to **GitHub Actions**

### 5. Run the workflow once manually

- Go to **Actions → Scrape & Deploy → Run workflow**

GitHub Actions will handle monthly updates automatically.

---

## Local Development

```bash
npm run dev
```

Visit http://localhost:5173/ftsm-ethesis/

---

## Incremental Scrape Logic

The scraper checks `public/theses.json` for existing entries. On each run:
1. Scrapes pages 1–5 (newest first)
2. Stops as soon as it hits an entry already in the JSON
3. Prepends new entries and saves

For a full re-scrape: `npm run scrape:full` in the `scraper/` directory.

---

## Project Structure

```
ftsm-ethesis/
├── .github/
│   └── workflows/
│       └── scrape.yml       # Monthly cron job
├── public/
│   └── theses.json          # The data (committed to repo)
├── scraper/
│   ├── scrape.ts            # Playwright scraper
│   └── package.json
├── src/
│   ├── components/
│   │   ├── FilterBar.tsx
│   │   └── ThesisTable.tsx
│   ├── hooks/
│   │   └── useTheses.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── index.html
├── package.json
└── vite.config.ts
```
