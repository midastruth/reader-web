"use client";

import { useEffect, useState } from "react";
import { PublicationGrid } from "@/components/Misc/PublicationGrid";
import Image from "next/image";

import { isManifestRouteEnabled } from "./ManifestRouteEnabled";

import "./reset.css";
import "./home.css";

const books = [
  {
    title: "Moby Dick",
    author: "Herman Melville",
    cover: "/images/MobyDick.jpg",
    url: "/read/moby-dick",
    rendition: "Reflowable EPUB"
  },
  {
    title: "The House of the Seven Gables",
    author: "Nathaniel Hawthorne",
    cover: "/images/TheHouseOfTheSevenGables.jpg",
    url: "/read/the-house-of-seven-gables",
    rendition: "Reflowable EPUB"
  },
  {
    title: "Les Diaboliques",
    author: "Jules Barbey d'Aurevilly",
    cover: "/images/LesDiaboliques.png",
    url: "/read/les-diaboliques",
    rendition: "Reflowable EPUB"
  },
  {
    title: "Bella the Dragon",
    author: "Barbara Nick, Elaine Steckler",
    cover: "/images/Bella.jpg",
    url: "/read/bella-the-dragon",
    rendition: "Fixed-Layout EPUB"
  }
];

const epub3samples = [
  {
    title: "ハルコさんの彼氏",
    author: "Riko Kratsuka",
    cover: "/images/Haruko.jpg",
    url: "/read/haruko",
    rendition: "Fixed-Layout EPUB"
  },
  {
    title: "מפליגים בישראל",
    author: "אורי עידן",
    cover: "/images/israelSailing.jpg",
    url: "/read/israel-sailing",
    rendition: "Reflowable EPUB"
  },
  {
    title: "日本語組版処理の要件（日本語版）",
    author: "W3C® (MIT, ERCIM, Keio)",
    cover: "/images/jlreq.png",
    url: "/read/jlreq",
    rendition: "Reflowable EPUB"
  },
  {
    title: "草枕",
    author: "夏目 漱石",
    cover: "/images/Kusamakura.png",
    url: "/read/kusamakura",
    rendition: "Reflowable EPUB"
  },
  {
    title: "السرطان من  للوقاية الصحيح الغذائي  النظام",
    author: "دافيد  خيّاط لبروفيسورا",
    cover: "/images/RegimeAnticancerArabic.jpg",
    url: "/read/regime-anticancer-arabic",
    rendition: "Reflowable EPUB"
  }
];

const onlineBooks = [
  {
    title: "Accessible EPUB3",
    author: "Matt Garrish",
    cover: "/images/accessibleEpub3.jpg",
    url: "/read/manifest/https%3A%2F%2Fpublication-server.readium.org%2Fwebpub%2FaHR0cHM6Ly9naXRodWIuY29tL0lEUEYvZXB1YjMtc2FtcGxlcy9yZWxlYXNlcy9kb3dubG9hZC8yMDIzMDcwNC9hY2Nlc3NpYmxlX2VwdWJfMy5lcHVi%2Fmanifest.json",
    rendition: "Reflowable EPUB"
  },
  {
    title: "Children Literature",
    author: "Charles Madison Curry, Erle Elsworth Clippinger",
    cover: "/images/ChildrensLiterature.png",
    url: "/read/manifest/https%3A%2F%2Fpublication-server.readium.org%2Fwebpub%2FaHR0cHM6Ly9naXRodWIuY29tL0lEUEYvZXB1YjMtc2FtcGxlcy9yZWxlYXNlcy9kb3dubG9hZC8yMDIzMDcwNC9jaGlsZHJlbnMtbGl0ZXJhdHVyZS5lcHVi%2Fmanifest.json",
    rendition: "Reflowable EPUB"
  }
];

const webPublications = [
  {
    title: "Readium CSS Implementers’ Documentation",
    author: "Jiminy Panoz",
    cover: "/images/readium-css.jpg",
    url: "/read/readium-css",
    rendition: "Web Publication"
  }
];

const audiobooks = [
  {
    title: "Flatland",
    author: "Edwin Abbott Abbott",
    cover: "https://www.archive.org/download/LibrivoxCdCoverArt12/Flatland_1109.jpg",
    url: "/read/flatland",
    rendition: "Audiobook"
  }
]


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

export default function Home() {
  const [isManifestEnabled, setIsManifestEnabled] = useState<boolean>(true);
  const [myLibrary, setMyLibrary] = useState<LibraryBook[]>([]);

  useEffect(() => {
    const checkManifestRoute = async () => {
      try {
        const enabled = await isManifestRouteEnabled();
        setIsManifestEnabled(enabled);
      } catch (error) {
        console.error("Error checking manifest route:", error);
        setIsManifestEnabled(false);
      }
    };

    checkManifestRoute();
  }, []);

  useEffect(() => {
    fetch("/api/library")
      .then(r => r.json() as Promise<LibraryManifestEntry[]>)
      .then(entries =>
        Promise.all(
          entries.map(async (entry) => {
            const manifestUrl = typeof entry === "string" ? entry : entry.url;
            const sha256 = typeof entry === "string" ? undefined : entry.sha256;
            const res = await fetch(manifestUrl);
            const manifest = await res.json() as Record<string, unknown>;
            return parseManifestBook(manifest, manifestUrl, sha256);
          })
        )
      )
      .then(setMyLibrary)
      .catch(console.error);
  }, []);

  return (
    <main id="home">
      <header className="header">
        <h1>Welcome to Thorium Web</h1>

        <p className="subtitle">An open-source ebook/audiobook/comics Web Reader</p>
      </header>

      <h2>My Library</h2>

      <PublicationGrid
        publications={ myLibrary }
        renderCover={ (publication) => (
          <Image
            src={ publication.cover }
            alt=""
            loading="lazy"
            width={ 120 }
            height={ 180 }
          />
        ) }
      />

      <h2>Our selection</h2>

      <PublicationGrid
        publications={ [...books, ...webPublications, ...audiobooks] }
        renderCover={ (publication) => (
          <Image
            src={ publication.cover }
            alt=""
            loading="lazy"
            width={ 120 }
            height={ 180 }
          />
        ) }
      />

      <h2>EPUB3 Samples</h2>

      <PublicationGrid
        publications={ epub3samples }
        renderCover={ (publication) => (
          <Image
            src={ publication.cover }
            alt=""
            loading="lazy"
            width={ 120 }
            height={ 180 }
          />
        ) }
      />

      { isManifestEnabled && (
        <>
        <div className="dev-books">
          <p>In dev you can also use the <code>/manifest/</code> route to load any publication. For instance:</p>
          
          <PublicationGrid
            publications={ onlineBooks }
            renderCover={ (publication) => (
              <Image
                src={ publication.cover }
                alt=""
                loading="lazy"
                width={ 120 }
                height={ 180 }
              />
            ) }
          />
        </div>
        </>
      ) }
    </main>
  );
}
