export const dynamic = "force-static";

const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local";
const cacheHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300"
};

export function GET(): Response {
  return Response.json(
    {
      status: "ok",
      service: "abrar-os",
      version: "0.9.0",
      commit: commitSha
    },
    { headers: cacheHeaders }
  );
}

export function HEAD(): Response {
  return new Response(null, {
    status: 200,
    headers: cacheHeaders
  });
}
