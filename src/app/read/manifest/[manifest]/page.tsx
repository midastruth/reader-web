"use client";

import { use, useEffect, useState } from "react";
import { ErrorDisplay } from "@/components/Misc";
import { usePublication } from "@/hooks/usePublication";
import { useAppSelector } from "@/lib/hooks";
import { verifyManifestUrl } from "@/app/api/verify-manifest/verifyDomain";
import { StatefulReaderWrapper } from "@/components/Reader/StatefulReaderWrapper";
import { ErrorHandler, ProcessedError } from "@/helpers/errorHandler";

type Params = { manifest: string };
type SearchParams = { sha256?: string };
type LibraryManifestEntry = string | { url: string; sha256?: string };

type Props = {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
};

export default function ManifestPage({ params, searchParams }: Props) {
  const [domainError, setDomainError] = useState<ProcessedError | null>(null);
  const [resolvedSha256, setResolvedSha256] = useState<string | undefined>(undefined);
  const isLoading = useAppSelector(state => state.reader.isLoading);
  const manifestUrl = use(params).manifest;
  const querySha256 = use(searchParams).sha256;

  useEffect(() => {
    if (manifestUrl) {
      verifyManifestUrl(manifestUrl).then(allowed => {
        if (!allowed) {
          const processedDomainError = ErrorHandler.process(
            new Error("Domain not allowed"), 
            "Domain Validation"
          );
          setDomainError(processedDomainError);
        }
      });
    }
  }, [manifestUrl]);

  useEffect(() => {
    if (querySha256) {
      setResolvedSha256(querySha256);
      return;
    }

    setResolvedSha256(undefined);
    if (!manifestUrl) return;

    let cancelled = false;
    fetch("/api/library")
      .then(r => r.json() as Promise<LibraryManifestEntry[]>)
      .then(entries => {
        if (cancelled) return;
        const match = entries.find(entry => (typeof entry === "string" ? entry : entry.url) === manifestUrl);
        const sha256 = typeof match === "string" ? undefined : match?.sha256;
        setResolvedSha256(sha256);
      })
      .catch(error => console.error("Failed to resolve book sha256:", error));

    return () => {
      cancelled = true;
    };
  }, [manifestUrl, querySha256]);

  const { 
    isLoading: publicationLoading, 
    error, 
    publication, 
    profile,
    localDataKey
  } = usePublication({
    url: manifestUrl,
    onError: (error) => {
      console.error("Manifest loading error:", error);
    }
  });

  if (domainError) {
    return (
      <ErrorDisplay 
        error={ domainError }
      />
    );
  }

  return (
    <>
      { error ? (
        <ErrorDisplay error={ error } />
      ) : publication ? (
        <StatefulReaderWrapper
          profile={ profile }
          publication={ publication }
          localDataKey={ localDataKey }
          isLoading={ isLoading || publicationLoading }
          bookSha256={ resolvedSha256 }
        />
      ) : null }
    </>
  );
}
