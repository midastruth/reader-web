export const runtime = "nodejs";

const LIST_ENDPOINT = "https://manifest.opensociety.eu.org/list.json";

export async function GET() {
  const res = await fetch(LIST_ENDPOINT, { next: { revalidate: 60 } });
  const manifests = await res.json() as string[];
  return Response.json(manifests);
}
