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

  useEffect(() => {
    fetch("/api/library")
      .then(r => r.json() as Promise<LibraryManifestEntry[]>)
      .then(entries =>
        Promise.allSettled(
          entries.map(async (entry) => {
            const manifestUrl = typeof entry === "string" ? entry : entry.url;
            const sha256 = typeof entry === "string" ? undefined : entry.sha256;
            const res = await fetch(manifestUrl);
            if (!res.ok) throw new Error(`${res.status} ${manifestUrl}`);
            const manifest = await res.json() as Record<string, unknown>;
            return parseManifestBook(manifest, manifestUrl, sha256);
          })
        )
      )
      .then(results => results.flatMap(r => r.status === "fulfilled" ? [r.value] : []))
      .then(setMyLibrary)
      .catch(console.error);
  }, []);

  return (
    <main id="home">
      <header className="header">
        <h1>My Library</h1>
      </header>

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

      <div className="explore-link">
        <Link href="/explore" className="explore-button">
          Explore all books
        </Link>
        <Link href="/upload" className="explore-button" style={{ marginLeft: "0.75rem" }}>
          Upload a book
        </Link>
      </div>
    </main>
  );
}
