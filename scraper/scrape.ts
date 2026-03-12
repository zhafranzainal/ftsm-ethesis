import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://ftsm.ukm.my/ethesis/";

const POSSIBLE_PATHS = [
  path.resolve(__dirname, "../frontend/public/theses.json"),
  path.resolve(__dirname, "../public/theses.json"),
];

function getOutputPath(): string {
  // Use whichever path's directory exists
  for (const p of POSSIBLE_PATHS) {
    if (fs.existsSync(path.dirname(p))) return p;
  }
  return POSSIBLE_PATHS[1]; // fallback
}

interface Thesis {
  id: string;
  title: string;
  author: string;
  supervisor: string;
  degree: string;
  center: string;
  language: string;
  year: string;
  file: string;
  hardcopy: boolean; // true = no PDF, available at library only
}

function loadExisting(outputPath: string): Thesis[] {
  if (fs.existsSync(outputPath)) {
    const raw = fs.readFileSync(outputPath, "utf-8");
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  return [];
}

function buildExistingSet(theses: Thesis[]): Set<string> {
  // Use "id + title" as a unique key
  return new Set(theses.map((t) => `${t.id}::${t.title.trim()}`));
}

async function scrapePage(
  page: any,
  pageNum: number
): Promise<Thesis[]> {
  // Always navigate to base URL fresh, then click to target page
  await page.goto(BASE_URL, { waitUntil: "networkidle", timeout: 30000 });

  if (pageNum > 1) {
    // Wait for the pagination button to exist
    await page.waitForSelector(`input[name="page"][value="${pageNum}"]`, { timeout: 10000 });

    // Click the page button and wait for navigation to settle
    await Promise.all([
      page.waitForNavigation({ waitUntil: "networkidle", timeout: 30000 }),
      page.click(`input[name="page"][value="${pageNum}"]`),
    ]);
  }

  // Wait for table rows
  await page.waitForSelector("#table-body tr", { timeout: 15000 });

  const rows: Thesis[] = await page.$$eval(
    "#table-body tr",
    (trs: HTMLTableRowElement[]) =>
      trs.map((tr) => {
        const tds = tr.querySelectorAll("td");

        // Entries with PDF have an <a> tag; hardcopy-only entries use a <span> with tooltip
        const anchor = tds[0]?.querySelector("a");
        const span = tds[0]?.querySelector("span[data-toggle='tooltip']");
        const titleEl = anchor ?? span;

        // small format: "P123456 • RAMLI SARIP • Assoc. Prof. Dr. Izhar Ariff Kashim"
        const small = tds[0]?.querySelector("small")?.textContent?.trim() ?? "";
        const parts = small.split("•").map((s: string) => s.trim());
        const id = parts[0] ?? "";
        const author = parts[1] ?? "";
        const supervisor = parts[2] ?? "";

        // Strip university name noise sometimes appended to title
        const rawTitle = titleEl?.textContent?.trim() ?? "";
        const title = rawTitle
          .replace(/UNIVERSITI KEBANGSAAN MALAYSIA?/gi, "")
          .replace(/\s{2,}/g, " ")
          .trim();

        const file = anchor?.getAttribute("href") ?? "";
        const hardcopy = !anchor && !!span;

        const rawLanguage = tds[3]?.textContent?.trim() ?? "";
        const language = rawLanguage === "Bhs. Melayu" ? "Malay" : rawLanguage;

        const degree = tds[1]?.textContent?.trim() ?? "";
        const center = tds[2]?.textContent?.trim() ?? "";
        const year = tds[4]?.textContent?.trim() ?? "";

        return { id, title, author, supervisor, degree, center, language, year, file, hardcopy };
      })
  );

  return rows;
}

async function main() {
  const fullScrape = process.argv.includes("--full");
  const outputPath = getOutputPath();
  const existing = loadExisting(outputPath);
  const existingKeys = buildExistingSet(existing);

  console.log(`Output path: ${outputPath}`);
  console.log(`Existing entries: ${existing.length}`);
  console.log(`Mode: ${fullScrape ? "FULL scrape" : "INCREMENTAL scrape"}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();

  const newEntries: Thesis[] = [];
  let stopped = false;

  // Determine how many pages to scrape
  // For full scrape: all 84 pages. For incremental: max 5 pages (new entries only at top)
  const maxPages = fullScrape ? 84 : 5;

  for (let p = 1; p <= maxPages && !stopped; p++) {
    console.log(`Scraping page ${p}/${maxPages}...`);

    let retries = 3;
    let rows: Thesis[] = [];
    let success = false;

    while (retries > 0 && !success) {
      try {
        rows = await scrapePage(page, p);
        console.log(`  Got ${rows.length} rows`);
        success = true;
      } catch (err: any) {
        retries--;
        console.warn(`  Attempt failed (${retries} retries left): ${err.message}`);
        if (retries > 0) {
          await new Promise((r) => setTimeout(r, 2000));
        } else {
          console.error(`  Skipping page ${p} after 3 failed attempts.`);
        }
      }
    }

    for (const row of rows) {
      const key = `${row.id}::${row.title.trim()}`;
      if (!fullScrape && existingKeys.has(key)) {
        console.log(`  Found existing entry — stopping incremental scrape.`);
        stopped = true;
        break;
      }
      if (!existingKeys.has(key) && row.title) {
        newEntries.push(row);
        existingKeys.add(key); // prevent duplicates within this run
      }
    }

    // Polite delay between pages
    if (!stopped && p < maxPages) {
      await new Promise((r) => setTimeout(r, 1200));
    }
  }

  await browser.close();

  console.log(`\nNew entries found: ${newEntries.length}`);

  if (newEntries.length === 0) {
    console.log("No new entries. Nothing to update.");
    process.exit(0);
  }

  // Prepend new entries (newest first)
  const merged = [...newEntries, ...existing];
  fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2));
  console.log(`Saved ${merged.length} total entries to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
