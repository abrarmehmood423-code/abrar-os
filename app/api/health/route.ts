import packageJson from "../../../package.json";

export const dynamic = "force-static";

const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) ?? "local";
const responseHeaders = {
  "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
  "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
  "Cross-Origin-Resource-Policy": "same-origin",
  "ETag": `"abrar-os-${commitSha}"`,
  "X-Abrar-OS-Commit": commitSha,
  "X-Content-Type-Options": "nosniff",
  "X-Robots-Tag": "noindex, nofollow"
};

export function GET(): Response {
  return Response.json(
    {
      status: "ok",
      service: packageJson.name,
      version: packageJson.version,
      commit: commitSha
    },
    { headers: responseHeaders }
  );
}

export function HEAD(): Response {
  return new Response(null, {
    status: 200,
    headers: {
      ...responseHeaders,
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}
