// Default: same-origin proxy route (avoids CORS; server connects to BOOK_AWARE_URL).
// Override with NEXT_PUBLIC_BOOK_AWARE_URL to hit the backend directly from the browser.
const BASE_URL = (
  process.env.NEXT_PUBLIC_BOOK_AWARE_URL ?? "/api/book-aware"
).replace(/\/$/, "");

export type AiAction = "ask" | "dictionary" | "summarize" | "analyze";

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
    INVALID_TEXT: `选中文字不能为空。`,
    INVALID_ACTION: `不支持的操作类型。`,
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
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/ai/query/stream`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(request),
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
