export const runtime = "nodejs";

type LibraryManifestEntry = string | { url: string; sha256?: string };

type BookAwareBook = {
  sha256?: string;
  original_path?: string;
  central_original_path?: string;
};

const LIST_ENDPOINT = "https://manifest.opensociety.eu.org/list.json";
const BOOK_AWARE_ENDPOINT = `${(process.env.BOOK_AWARE_URL || "http://127.0.0.1:8787").replace(/\/$/, "")}/books`;

function basename(filePath: string | undefined): string | undefined {
  if (!filePath) return undefined;
  return filePath.split(/[\\/]/).filter(Boolean).pop();
}

function decodeWebpubFilename(manifestUrl: string): string | undefined {
  try {
    const { pathname } = new URL(manifestUrl);
    const segments = pathname.split("/").filter(Boolean);
    const webpubIndex = segments.indexOf("webpub");
    const encoded = webpubIndex >= 0 ? segments[webpubIndex + 1] : undefined;
    if (!encoded) return undefined;

    let base64 = decodeURIComponent(encoded).replace(/-/g, "+").replace(/_/g, "/");
    base64 += "=".repeat((4 - (base64.length % 4)) % 4);
    return Buffer.from(base64, "base64").toString("utf8");
  } catch {
    return undefined;
  }
}

async function fetchBookShaByFilename(): Promise<Map<string, string>> {
  const res = await fetch(BOOK_AWARE_ENDPOINT, { next: { revalidate: 60 } });
  if (!res.ok) return new Map();

  const data = await res.json() as { ok?: boolean; books?: BookAwareBook[] };
  if (!data.ok || !Array.isArray(data.books)) return new Map();

  const map = new Map<string, string>();
  for (const book of data.books) {
    if (!book.sha256) continue;
    const names = [basename(book.central_original_path), basename(book.original_path)].filter(Boolean) as string[];
    for (const name of names) {
      map.set(name, book.sha256);
    }
  }
  return map;
}

export async function GET() {
  const res = await fetch(LIST_ENDPOINT, { next: { revalidate: 60 } });
  const rawEntries = await res.json() as LibraryManifestEntry[];
  const entries = rawEntries.map((entry) => typeof entry === "string" ? { url: entry } : entry);

  let shaByFilename = new Map<string, string>();
  try {
    shaByFilename = await fetchBookShaByFilename();
  } catch (error) {
    console.error("Failed to enrich library with book-aware sha256:", error);
  }

  const enriched = entries.map((entry) => {
    if (entry.sha256) return entry;

    const filename = decodeWebpubFilename(entry.url);
    const sha256 = filename ? shaByFilename.get(filename) : undefined;
    return sha256 ? { ...entry, sha256 } : entry;
  });

  return Response.json(enriched);
}
