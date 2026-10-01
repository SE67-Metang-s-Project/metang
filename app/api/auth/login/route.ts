import { startCmuLogin } from "@/lib/cmu-auth";
import { isDev } from "@/lib/env";

export async function GET(request: Request) {
  // A production build lets in only nursing students and nursing staff. `next dev` keeps the
  // general mode so any CMU account can sign in while developing.
  return startCmuLogin(request, isDev() ? "general" : "nurse");
}
