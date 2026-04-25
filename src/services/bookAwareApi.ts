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
  // 1. If bookId looks like a sha256 (64 hex chars), try GET /books/:sha256 directly.
  if (bookId && /^[0-9a-f]{64}$/i.test(bookId)) {
    try {
      const data = await apiFetch(`/books/${encodeURIComponent(bookId)}`) as { ok: boolean; book: BookAwareBook };
      return data.book;
    } catch {
      // fall through to title search
    }
  }

  // 2. Fall back to listing all books and matching by title (case-insensitive, trimmed).
  if (!bookTitle?.trim()) {
    throw new Error("无法确定当前书籍，请先在 book-aware 后端注册后再试。");
  }

  const books = await fetchBooks();
  const needle = bookTitle.trim().toLowerCase();
  const match = books.find((b) => b.title.trim().toLowerCase() === needle);
  if (!match) {
    throw new Error(friendlyError("BOOK_NOT_FOUND", `书籍「${bookTitle}」未在 book-aware 后端注册`));
  }
  return match;
}

export async function aiQuery(request: AiQueryRequest): Promise<AiQueryResponse> {
  return apiFetch("/ai/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  }) as Promise<AiQueryResponse>;
}
