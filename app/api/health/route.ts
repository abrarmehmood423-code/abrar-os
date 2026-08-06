export const dynamic = "force-static";

export function GET(): Response {
  return Response.json(
    {
      status: "ok",
      service: "abrar-os",
      version: "0.9.0"
    },
    {
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=300, stale-while-revalidate=86400"
      }
    }
  );
}
