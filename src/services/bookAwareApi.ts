// Default: same-origin proxy route (avoids CORS; server connects to BOOK_AWARE_URL).
// Override with NEXT_PUBLIC_BOOK_AWARE_URL to hit the backend directly from the browser.
const BASE_URL = (
  process.env.NEXT_PUBLIC_BOOK_AWARE_URL ?? "/api/book-aware"
).replace(/\/$/, "");

// "research" is a frontend-only action that routes to the deep-research
// pipeline (/ai/research/stream). The backend itself only knows the agent
// actions, so it is remapped to "analyze" in aiQueryStream before sending.
export type AiAction = "ask" | "dictionary" | "summarize" | "analyze" | "research";

export interface BookAwareBook {
  id: string;
  sha256: string;
  title: string;
  author: string;
}

export interface AiQueryRequest {
  action: AiAction;
  text: string;
  question: string;
  /** Whether this turn should be grounded in selected text or the whole book. */
  context_mode?: "selection" | "book";
  book: { sha256: string; title?: string; author?: string };
  location: { chapter?: string; progress?: number };
  session_id?: string;
}

export interface AiQueryResponse {
  ok: boolean;
  action: string;
  session_id?: string;
  answer: { text: string; brief: string };
  definition?: string;
  summary?: string;
  analysis?: string;
  output?: string;
}

interface BackendError {
  ok: false;
  error: { code: string; message: string };
}

function friendlyError(code: string, message: string): string {
  const map: Record<string, string> = {
    PROXY_UPSTREAM_UNREACHABLE: `book-aware 后端未启动或无法连接。请先运行后端服务（npm run dev）后再试。`,
    BOOK_NOT_FOUND: `当前书籍尚未在 book-aware 后端注册，请先用 /books/import/epub 导入。`,
    BOOK_NOT_INDEXED: `当前书籍已注册但尚未建立索引，请检查 book-aware 后端的 markdown 绑定。`,
    BOOK_MARKDOWN_MISSING: `书籍的 Markdown 文件已丢失，请重新导入或重建索引。`,
    INVALID_TEXT: `选中文字不能为空。`,
    INVALID_ACTION: `不支持的操作类型。`,
    AI_ERROR: `AI 服务返回错误：${message}`,
    AI_EMPTY_RESPONSE: `AI 没有返回任何内容，请稍后重试。`,
    AI_ABORTED: `AI 请求被中断：${message}`,
    AI_NO_RESPONSE: `AI 未返回响应，请稍后重试。`,
  };
  return map[code] ?? `错误 [${code}]：${message}`;
}

async function apiFetch(path: string, init?: RequestInit): Promise<unknown> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, init);
  } catch (err) {
    throw new Error(`book-aware 后端无法连接：${err instanceof Error ? err.message : String(err)}`);
  }

  const data = await res.json() as BookAwareBook | BackendError | { ok: boolean; books: BookAwareBook[] } | AiQueryResponse;

  if (res.status === 502) {
    const e = data as BackendError;
    throw new Error(friendlyError(e.error?.code ?? "PROXY_UPSTREAM_UNREACHABLE", e.error?.message ?? ""));
  }

  if (!(data as { ok: boolean }).ok) {
    const e = data as BackendError;
    throw new Error(friendlyError(e.error?.code ?? "UNKNOWN", e.error?.message ?? "请求失败"));
  }

  return data;
}

export async function fetchBooks(): Promise<BookAwareBook[]> {
  const data = await apiFetch("/books") as { ok: boolean; books: BookAwareBook[] };
  return data.books ?? [];
}

export interface CreateHighlightPayload {
  exact: string;
  prefix?: string;
  suffix?: string;
  href?: string;
  spine_index?: number;
  total_progression?: number;
  chapter?: string;
  color?: string;
  note?: string;
}

export type BookAwareHighlightClient = "reader-web" | "koreader";

export interface BookAwareHighlight {
  id: string;
  book_sha256: string;
  created_at: string;
  updated_at: string;
  exact: string;
  prefix: string;
  suffix: string;
  href?: string;
  spine_index?: number;
  total_progression?: number;
  chapter?: string;
  color?: string;
  note?: string;
  koreader: {
    status: string;
    pos0?: string;
    pos1?: string;
    page?: string;
    error?: string;
    candidates_count?: number;
    conflict_scores?: { best: number; second: number; margin: number };
  };
  source?: BookAwareHighlightClient;
  version?: number;
  sync_version?: number;
  deleted_at?: string;
  deleted_by?: BookAwareHighlightClient;
  updated_by?: BookAwareHighlightClient;
  client_id?: string;
}

export interface BookAwareHighlightChange {
  type: "upsert" | "delete";
  sync_version: number;
  highlight: BookAwareHighlight;
}

export interface HighlightChangesResponse {
  ok: boolean;
  server_version: number;
  changes: BookAwareHighlightChange[];
}

export interface UpdateHighlightPayload {
  note?: string;
  color?: string;
  updated_by?: BookAwareHighlightClient;
}

export async function updateBookAwareHighlight(
  sha256: string,
  highlightId: string,
  payload: UpdateHighlightPayload,
): Promise<BookAwareHighlight> {
  const data = await apiFetch(
    `/books/${encodeURIComponent(sha256)}/highlights/${encodeURIComponent(highlightId)}`,
    {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    },
  ) as { ok: boolean; highlight: BookAwareHighlight };
  return data.highlight;
}

export async function fetchBookAwareHighlights(sha256: string): Promise<BookAwareHighlight[]> {
  const data = await apiFetch(`/books/${encodeURIComponent(sha256)}/highlights`);
  if (typeof data !== 'object' || data === null) {
    throw new Error('book-aware highlights response is malformed: expected an object');
  }

  if ('highlights' in data) {
    if (!Array.isArray(data.highlights)) {
      throw new Error('book-aware highlights response is malformed: "highlights" is not an array');
    }
    return (data.highlights as BookAwareHighlight[]).filter((highlight) => !highlight.deleted_at);
  }

  if ('items' in data) {
    if (!Array.isArray(data.items)) {
      throw new Error('book-aware highlights response is malformed: "items" is not an array');
    }
    return (data.items as BookAwareHighlight[]).filter((highlight) => !highlight.deleted_at);
  }

  throw new Error('book-aware highlights response is malformed: expected "highlights" or "items" array');
}

export async function fetchBookAwareHighlightChanges(
  sha256: string,
  sinceVersion: number,
): Promise<HighlightChangesResponse> {
  const data = await apiFetch(
    `/books/${encodeURIComponent(sha256)}/highlights/changes?since_version=${encodeURIComponent(String(sinceVersion))}`,
  );
  if (typeof data !== "object" || data === null) {
    throw new Error("book-aware highlight changes response is malformed: expected an object");
  }
  const response = data as HighlightChangesResponse;
  if (typeof response.server_version !== "number" || !Array.isArray(response.changes)) {
    throw new Error('book-aware highlight changes response is malformed: expected "server_version" and "changes"');
  }
  return response;
}

export async function deleteBookAwareHighlight(
  sha256: string,
  highlightId: string,
): Promise<{ deleted: string; deleted_at: string; server_version?: number }> {
  const data = await apiFetch(
    `/books/${encodeURIComponent(sha256)}/highlights/${encodeURIComponent(highlightId)}`,
    { method: "DELETE" },
  ) as { ok: boolean; deleted: string; deleted_at: string; server_version?: number };
  return { deleted: data.deleted, deleted_at: data.deleted_at, server_version: data.server_version };
}

export async function createBookAwareHighlight(
  sha256: string,
  payload: CreateHighlightPayload
): Promise<BookAwareHighlight> {
  const data = await apiFetch(`/books/${encodeURIComponent(sha256)}/highlights`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  }) as { ok: boolean; highlight: BookAwareHighlight };
  return data.highlight;
}

/** Resolve a sha256 or title string to a registered BookAwareBook. */
export async function resolveBook(
  bookId: string | undefined,
  bookTitle: string | undefined
): Promise<BookAwareBook> {
  // Only trust a real content sha256. Title-based fallback is unsafe: two different
  // EPUB files can share the same metadata title and would be silently misrouted to
  // an unrelated index. Force the caller (Reader) to provide a verified sha256.
  if (!bookId || !/^[0-9a-f]{64}$/i.test(bookId)) {
    throw new Error(friendlyError("BOOK_NOT_FOUND", `当前书籍缺少可信的 sha256，未在 book-aware 后端注册`));
  }

  const data = await apiFetch(`/books/${encodeURIComponent(bookId)}`) as { ok: boolean; book: BookAwareBook };
  return data.book;
}

// Per-book shortcut buttons shown on the AI panel welcome screen. They are a
// durable book asset created or removed by the AI through a guided,
// user-confirmed flow (via its manage_suggestions tool). The panel always
// shows a separate management chip, including when this list is empty.
export interface BookSuggestion {
  id: string;
  /** Short button label shown on the chip. */
  text: string;
  /** Full instruction sent to the assistant when the button is tapped. */
  prompt: string;
}

export async function fetchBookSuggestions(sha256: string): Promise<BookSuggestion[]> {
  const data = await apiFetch(`/books/${encodeURIComponent(sha256)}/suggestions`) as {
    ok: boolean;
    suggestions?: BookSuggestion[];
  };
  // Fail loudly on schema drift: an empty array means there are no saved
  // shortcuts, so a malformed payload must never be silently coerced into it.
  if (!Array.isArray(data.suggestions)) {
    throw new Error('book-aware suggestions response is malformed: expected "suggestions" array');
  }
  return data.suggestions;
}

export async function aiQuery(request: AiQueryRequest): Promise<AiQueryResponse> {
  return apiFetch("/ai/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  }) as Promise<AiQueryResponse>;
}

export type SseEvent =
  | { type: "start"; ok: boolean; action: string; session_id?: string }
  | { type: "delta"; text: string }
  | { type: "tool_start"; tool_call_id: string; name: string; args: unknown }
  | { type: "tool_update"; tool_call_id: string }
  | { type: "tool_end"; tool_call_id: string; name: string; is_error: boolean }
  | { type: "final"; ok: boolean; action: string; session_id?: string; answer: { text: string; brief: string }; output?: string }
  | { type: "done" }
  | { type: "error"; code?: string; message: string }
  | { type: "ping" };

export async function* aiQueryStream(
  request: AiQueryRequest,
  abortSignal?: AbortSignal
): AsyncGenerator<SseEvent> {
  // The deep-research pipeline lives behind a dedicated endpoint and can take a
  // long time. The backend doesn't recognise a "research" action, so we remap it
  // to "analyze" while routing the call to /ai/research/stream.
  const isResearch = request.action === "research";
  const endpoint = isResearch ? "/ai/research/stream" : "/ai/query/stream";
  const body = isResearch ? { ...request, action: "analyze" as const } : request;

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: abortSignal,
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") throw err;
    throw new Error(`book-aware 后端无法连接：${err instanceof Error ? err.message : String(err)}`);
  }

  if (!res.body) throw new Error("流式响应不可用");

  if (!res.ok) {
    const text = await res.text();
    let errData: BackendError | null = null;
    try { errData = JSON.parse(text) as BackendError; } catch { /* ignore */ }
    if (errData?.error) throw new Error(friendlyError(errData.error.code, errData.error.message));
    throw new Error(`请求失败 (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let currentEvent = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        const trimmed = line.trimEnd();
        if (trimmed.startsWith("event: ")) {
          currentEvent = trimmed.slice(7);
        } else if (trimmed.startsWith("data: ") && currentEvent) {
          try {
            const data = JSON.parse(trimmed.slice(6)) as Record<string, unknown>;
            yield { type: currentEvent, ...data } as SseEvent;
          } catch { /* ignore malformed */ }
          currentEvent = "";
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
