import type { RefObject } from "react";

import { Locator, Publication } from "@readium/shared";

import { HighlightManager } from "@/components/Highlights/HighlightManager";
import type { HighlightManagerHandle } from "@/components/Highlights/HighlightManager";
import type { UnstableTimeline } from "@/core/Hooks/useTimeline";

interface StatefulEpubHighlightManagerProps {
  publication: Publication;
  localDataKey: string | null;
  bookSha256?: string;
  timeline: UnstableTimeline;
  currentLocator: () => Locator | undefined;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  managerRef: (handle: HighlightManagerHandle | null) => void;
}

export const StatefulEpubHighlightManager = ({
  publication,
  localDataKey,
  bookSha256,
  timeline,
  currentLocator,
  iframeRef,
  managerRef
}: StatefulEpubHighlightManagerProps) => {
  return (
    <HighlightManager
      ref={managerRef}
      bookId={bookSha256 ?? localDataKey ?? publication.manifest.linkWithRel("self")?.href ?? ""}
      bookTitle={publication.metadata.title.getTranslation("en")}
      bookAuthor={publication.metadata.authors?.items?.map((a: { name: { getTranslation: (lang: string) => string } }) => a.name.getTranslation("en")).join(", ")}
      currentChapter={timeline.toc?.currentEntry?.title ?? undefined}
      readingProgress={timeline.progression?.totalProgression ?? currentLocator()?.locations?.totalProgression ?? undefined}
      iframeRef={iframeRef}
    />
  );
};
