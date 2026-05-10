"use client";

import { useEffect, useState } from "react";
import { PublicationGrid } from "@/components/Misc/PublicationGrid";
import Image from "next/image";
import { Link } from "react-aria-components";

import "./reset.css";
import "./home.css";

type LibraryBook = {
  title: string;
  author: string;
  cover: string;
  url: string;
  rendition: string;
};

type LibraryManifestEntry = string | { url: string; sha256?: string };

function parseManifestBook(manifest: Record<string, unknown>, manifestUrl: string, sha256?: string): LibraryBook {
  const metadata = (manifest.metadata ?? {}) as Record<string, unknown>;
  const resources = (manifest.resources ?? []) as Array<Record<string, unknown>>;

  const rawTitle = metadata["title"];
  const title = typeof rawTitle === "string" ? rawTitle
    : (rawTitle as Record<string, unknown>)?.["value"] as string ?? "";

  const rawAuthor = metadata["author"];
  const author = typeof rawAuthor === "string" ? rawAuthor
    : Array.isArray(rawAuthor) ? (rawAuthor as Array<Record<string, unknown>>).map(a => a["name"] ?? a).join(", ")
    : (rawAuthor as Record<string, unknown>)?.["name"] as string ?? "";

  const coverResource = resources.find(r => {
    const rel = r["rel"];
    return rel === "cover" || (Array.isArray(rel) && rel.includes("cover"));
  });
  const coverHref = coverResource?.["href"] as string ?? "";
  const base = manifestUrl.replace(/\/manifest\.json$/, "");
  const cover = coverHref ? `${base}/${coverHref}` : "";

  return {
    title,
    author,
    cover,
    url: `/read/manifest/${encodeURIComponent(manifestUrl)}${sha256 ? `?sha256=${encodeURIComponent(sha256)}` : ""}`,
    rendition: "Reflowable EPUB",
  };
}

export default function HomePage() {
  const [myLibrary, setMyLibrary] = useState<LibraryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadLibrary = async () => {
      setLoading(true);
      setLibraryError(null);

      try {
        const libraryResponse = await fetch("/api/library");
        if (!libraryResponse.ok) {
          throw new Error(`Failed to load library: ${libraryResponse.status} ${libraryResponse.statusText}`);
        }

        const entries = await libraryResponse.json() as LibraryManifestEntry[];
        const results = await Promise.allSettled(
          entries.map(async (entry) => {
            const manifestUrl = typeof entry === "string" ? entry : entry.url;
            const sha256 = typeof entry === "string" ? undefined : entry.sha256;
            const res = await fetch(manifestUrl);
            if (!res.ok) throw new Error(`Failed to load manifest: ${res.status} ${manifestUrl}`);
            const manifest = await res.json() as Record<string, unknown>;
            return parseManifestBook(manifest, manifestUrl, sha256);
          })
        );
        const books = results.flatMap(result => result.status === "fulfilled" ? [result.value] : []);

        if (!cancelled) {
          setMyLibrary(books);
          setLibraryError(null);
        }
      } catch (err) {
        console.error("Failed to load library", err);
        if (!cancelled) {
          setMyLibrary([]);
          setLibraryError("We couldn’t load your library. Please try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadLibrary();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main id="home">
      <header className="page-header">
        <h1>My Library</h1>
        <nav className="page-header-actions">
          <Link href="/explore" className="btn-outline">Explore</Link>
          <Link href="/upload" className="btn-solid">Upload a book</Link>
        </nav>
      </header>

      { loading ? (
        <div className="library-placeholder">
          <span className="library-placeholder-icon">📚</span>
          <p>Loading your library…</p>
        </div>
      ) : libraryError ? (
        <div className="library-placeholder" role="alert">
          <span className="library-placeholder-icon">⚠️</span>
          <p>{ libraryError }</p>
        </div>
      ) : myLibrary.length === 0 ? (
        <div className="library-placeholder">
          <span className="library-placeholder-icon">📭</span>
          <p>Your library is empty. Upload a book or explore the collection.</p>
        </div>
      ) : (
        <PublicationGrid
          variant="shelf"
          publications={ myLibrary }
          renderCover={ (publication) => (
            <Image
              src={ publication.cover }
              alt=""
              fill
              sizes="140px"
              style={{ objectFit: "cover" }}
            />
          ) }
        />
      ) }
    </main>
  );
}
