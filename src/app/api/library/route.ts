export const runtime = "nodejs";

const LIST_ENDPOINT = "https://manifest.opensociety.eu.org/list.json";
const MANIFEST_BASE_URL = new URL(LIST_ENDPOINT).origin;
const PUBLICATION_SERVER_URL = "https://publication-server.readium.org";
const BOOK_AWARE_BASE_URL = (process.env.BOOK_AWARE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const BOOK_AWARE_ENDPOINT = `${BOOK_AWARE_BASE_URL}/books`;

type LibraryManifestEntry = string | { url: string; sha256?: string };

type BookAwareBook = {
  sha256?: string;
  format?: string;
  original_path?: string;
  central_original_path?: string;
};

function basename(filePath: string | undefined): string | undefined {
  if (!filePath) return undefined;
  return filePath.split(/[\\/]/).filter(Boolean).pop();
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function decodeWebpubFilename(manifestUrl: string): string | undefined {
  const { pathname } = new URL(manifestUrl);
  const segments = pathname.split("/").filter(Boolean);
  const webpubIndex = segments.indexOf("webpub");
  const encoded = webpubIndex >= 0 ? segments[webpubIndex + 1] : undefined;
  if (!encoded) return undefined;

  let base64 = decodeURIComponent(encoded).replace(/-/g, "+").replace(/_/g, "/");
  base64 += "=".repeat((4 - (base64.length % 4)) % 4);
  return Buffer.from(base64, "base64").toString("utf8");
}

function manifestUrlForFilename(filename: string): string {
  return `${MANIFEST_BASE_URL}/webpub/${toBase64Url(filename)}/manifest.json`;
}

function proxiedEpubUrl(origin: string, book: BookAwareBook): string {
  if (!book.sha256) throw new Error("Cannot build EPUB URL for a book without sha256");

  const filename = basename(book.central_original_path)
    ?? basename(book.original_path)
    ?? `${book.sha256}.epub`;

  return `${origin}/api/book-aware/books/${encodeURIComponent(book.sha256)}/epub/${encodeURIComponent(filename)}`;
}

function publicationServerManifestUrl(epubUrl: string): string {
  return `${PUBLICATION_SERVER_URL}/webpub/${toBase64Url(epubUrl)}/manifest.json`;
}

function manifestUrlForBook(book: BookAwareBook, origin: string): string | undefined {
  const centralFilename = basename(book.central_original_path);
  if (centralFilename) return manifestUrlForFilename(centralFilename);

  if (book.sha256) return publicationServerManifestUrl(proxiedEpubUrl(origin, book));
  return undefined;
}

async function fetchBookAwareBooks(): Promise<BookAwareBook[]> {
  const res = await fetch(BOOK_AWARE_ENDPOINT, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`book-aware /books failed with ${res.status}`);
  }

  const data = await res.json() as { ok?: boolean; books?: BookAwareBook[] };
  if (!data.ok || !Array.isArray(data.books)) {
    throw new Error("book-aware /books returned an invalid response");
  }

  return data.books;
}

export async function GET(request: Request) {
  const res = await fetch(LIST_ENDPOINT, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`library manifest list failed with ${res.status}`);
  }

  const rawEntries = await res.json() as LibraryManifestEntry[];
  if (!Array.isArray(rawEntries)) {
    throw new Error("library manifest list returned an invalid response");
  }

  const entries = rawEntries.map((entry) => typeof entry === "string" ? { url: entry } : entry);
  const bookAwareBooks = await fetchBookAwareBooks();

  const shaByFilename = new Map<string, string>();
  for (const book of bookAwareBooks) {
    if (!book.sha256) continue;
    const names = [basename(book.central_original_path), basename(book.original_path)].filter(Boolean) as string[];
    for (const name of names) {
      shaByFilename.set(name, book.sha256);
    }
  }

  const enriched = entries.map((entry) => {
    if (entry.sha256) return entry;

    const filename = decodeWebpubFilename(entry.url);
    const sha256 = filename ? shaByFilename.get(filename) : undefined;
    return sha256 ? { ...entry, sha256 } : entry;
  });

  const knownSha256 = new Set(enriched.flatMap((entry) => entry.sha256 ? [entry.sha256] : []));
  const knownUrls = new Set(enriched.map((entry) => entry.url));
  const origin = new URL(request.url).origin;
  const uploadedEntries = bookAwareBooks.flatMap((book): Array<{ url: string; sha256: string }> => {
    if (!book.sha256 || book.format !== "epub" || knownSha256.has(book.sha256)) return [];

    const url = manifestUrlForBook(book, origin);
    if (!url || knownUrls.has(url)) return [];

    knownSha256.add(book.sha256);
    knownUrls.add(url);
    return [{ url, sha256: book.sha256 }];
  });

  return Response.json([...enriched, ...uploadedEntries], {
    headers: { "cache-control": "no-store" },
  });
}
