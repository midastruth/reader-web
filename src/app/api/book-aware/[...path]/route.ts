import { NextRequest, NextResponse } from "next/server";

// nodejs runtime so we can reach http://127.0.0.1 from the server side
export const runtime = "nodejs";

const UPSTREAM = (process.env.BOOK_AWARE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");

type RouteContext = { params: Promise<{ path: string[] }> };

function upstreamPath(path: string[]): string {
  if (path.length === 4 && path[0] === "books" && (path[2] === "epub" || path[2] === "download")) {
    return path.slice(0, 3).map(encodeURIComponent).join("/");
  }

  return path.map(encodeURIComponent).join("/");
}

function responseHeaders(upstreamRes: Response): Headers {
  const headers = new Headers({
    "content-type": upstreamRes.headers.get("content-type") ?? "application/json",
    "cache-control": "no-cache",
    "x-accel-buffering": "no",
  });

  const contentLength = upstreamRes.headers.get("content-length");
  if (contentLength) headers.set("content-length", contentLength);

  const contentDisposition = upstreamRes.headers.get("content-disposition");
  if (contentDisposition) headers.set("content-disposition", contentDisposition);

  return headers;
}

async function forward(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { path } = await ctx.params;
  const upstreamUrl = `${UPSTREAM}/${upstreamPath(path)}${req.nextUrl.search}`;
  const isHead = req.method === "HEAD";

  const upstreamHeaders = new Headers();
  const contentType = req.headers.get("content-type");
  if (contentType) upstreamHeaders.set("content-type", contentType);

  const init: RequestInit & { duplex?: "half" } = {
    // book-aware download endpoints do not support HEAD directly; issue GET upstream
    // and translate it to a body-less HEAD response at this proxy boundary.
    method: isHead ? "GET" : req.method,
    headers: upstreamHeaders,
  };
  if (req.method !== "GET" && !isHead) {
    init.body = req.body;
    init.duplex = "half";
  }

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, init);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: { code: "PROXY_UPSTREAM_UNREACHABLE", message: `book-aware 后端无法连接：${message}` } },
      { status: 502 }
    );
  }

  if (isHead) {
    await upstreamRes.body?.cancel();
    return new NextResponse(null, {
      status: upstreamRes.status,
      headers: responseHeaders(upstreamRes),
    });
  }

  return new NextResponse(upstreamRes.body, {
    status: upstreamRes.status,
    headers: responseHeaders(upstreamRes),
  });
}

export const GET  = (req: NextRequest, ctx: RouteContext) => forward(req, ctx);
export const HEAD = (req: NextRequest, ctx: RouteContext) => forward(req, ctx);
export const POST = (req: NextRequest, ctx: RouteContext) => forward(req, ctx);
