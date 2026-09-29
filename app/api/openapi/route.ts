import { withBasePath } from "@/lib/base-path";

export const dynamic = "force-static";

/**
 * Redirect to the generated OpenAPI document.
 * @tag Openapi
 * @response 302
 */
export function GET() {
  // A relative Location, because this response is prerendered: an absolute URL built from
  // request.url would keep the build-time origin (http://localhost:3000). Response.redirect()
  // accepts only absolute URLs, so the response is built by hand.
  return new Response(null, {
    status: 302,
    headers: { Location: withBasePath("/openapi.json") },
  });
}
