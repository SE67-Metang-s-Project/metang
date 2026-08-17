export const dynamic = "force-static";

export function GET(request: Request) {
  return Response.redirect(new URL("/openapi.json", request.url));
}
