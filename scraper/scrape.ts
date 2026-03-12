import { chromium } from "playwright";
import * as fs from "fs";
import * as path from "path";

const BASE_URL = "https://ftsm.ukm.my/ethesis/";
const OUTPUT_PATH = path.resolve(__dirname, "../theses.json");

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
}

function loadExisting(): Thesis[] {
  if (fs.existsSync(OUTPUT_PATH)) {
    const raw = fs.readFileSync(OUTPUT_PATH, "utf-8");
    return JSON.parse(raw);
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
  // The site uses POST with form field "page"
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  if (pageNum > 1) {
    await page.evaluate((num: number) => {
      const buttons = document.querySelectorAll<HTMLInputElement>(
        'input[name="page"]'
      );
      for (const btn of buttons) {
        if (btn.value === String(num)) {
          btn.click();
          return;
        }
      }
    }, pageNum);
    await page.waitForLoadState("domcontentloaded");
  }

  const rows = await page.$$eval(
    "#table-body tr",
    (trs: HTMLTableRowElement[]) => {
      return trs.map((tr) => {
        const tds = tr.querySelectorAll("td");
        const anchor = tds[0]?.querySelector("a");
        const small = tds[0]?.querySelector("small")?.textContent?.trim() ?? "";

        // small format: "P113852 • TEE KAI VERN • Assoc. Prof. Dr. Umi Asma' Mokhtar"
        const parts = small.split("•").map((s: string) => s.trim());
        const id = parts[0] ?? "";
        const author = parts[1] ?? "";
        const supervisor = parts[2] ?? "";

        const rawTitle = anchor?.textContent?.trim() ?? "";
        // Strip university name noise sometimes appended to title
        const title = rawTitle
          .replace(/UNIVERSITI KEBANGSAAN MALAYSIA?/gi, "")
          .replace(/\s{2,}/g, " ")
          .trim();

        const file = anchor?.getAttribute("href") ?? "";
        const degree = tds[1]?.textContent?.trim() ?? "";
        const center = tds[2]?.textContent?.trim() ?? "";
        const language = tds[3]?.textContent?.trim() ?? "";
        const year = tds[4]?.textContent?.trim() ?? "";

        return { id, title, author, supervisor, degree, center, language, year, file };
      });
    }
  );

  return rows as Thesis[];
}

async function main() {
  const fullScrape = process.argv.includes("--full");
  const existing = loadExisting();
  const existingKeys = buildExistingSet(existing);

  console.log(`Existing entries: ${existing.length}`);
  console.log(`Mode: ${fullScrape ? "FULL scrape" : "INCREMENTAL scrape"}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const newEntries: Thesis[] = [];
  let stopped = false;

  // Determine how many pages to scrape
  // For full scrape: all 84 pages. For incremental: max 5 pages (new entries only at top)
  const maxPages = fullScrape ? 84 : 5;

  for (let p = 1; p <= maxPages && !stopped; p++) {
    console.log(`Scraping page ${p}...`);
    try {
      const rows = await scrapePage(page, p);

      for (const row of rows) {
        const key = `${row.id}::${row.title.trim()}`;
        if (!fullScrape && existingKeys.has(key)) {
          console.log(`Found existing entry at page ${p} — stopping.`);
          stopped = true;
          break;
        }
        if (!existingKeys.has(key) && row.title) {
          newEntries.push(row);
          existingKeys.add(key); // prevent duplicates within this run
        }
      }

      // Small delay to be respectful
      await page.waitForTimeout(800);
    } catch (err) {
      console.error(`Error on page ${p}:`, err);
    }
  }

  await browser.close();

  console.log(`New entries found: ${newEntries.length}`);

  if (newEntries.length === 0) {
    console.log("No new entries. Nothing to update.");
    process.exit(0);
  }

  // Prepend new entries (newest first)
  const merged = [...newEntries, ...existing];
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(merged, null, 2));
  console.log(`Saved ${merged.length} total entries to theses.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
