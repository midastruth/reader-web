import { NextRequest, NextResponse } from "next/server";

// nodejs runtime so we can reach http://127.0.0.1 from the server side
export const runtime = "nodejs";

const UPSTREAM = (process.env.BOOK_AWARE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");

type RouteContext = { params: Promise<{ path: string[] }> };

async function forward(req: NextRequest, ctx: RouteContext): Promise<NextResponse> {
  const { path } = await ctx.params;
  const upstreamUrl = `${UPSTREAM}/${path.join("/")}${req.nextUrl.search}`;

  let upstreamRes: Response;
  try {
    upstreamRes = await fetch(upstreamUrl, {
      method: req.method,
      headers: { "content-type": "application/json" },
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: { code: "PROXY_UPSTREAM_UNREACHABLE", message: `book-aware 后端无法连接：${message}` } },
      { status: 502 }
    );
  }

  const body = await upstreamRes.text();
  return new NextResponse(body, {
    status: upstreamRes.status,
    headers: { "content-type": upstreamRes.headers.get("content-type") ?? "application/json" },
  });
}

export const GET  = (req: NextRequest, ctx: RouteContext) => forward(req, ctx);
export const POST = (req: NextRequest, ctx: RouteContext) => forward(req, ctx);
