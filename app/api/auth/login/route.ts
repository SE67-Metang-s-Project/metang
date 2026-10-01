import { startCmuLogin } from "@/lib/cmu-auth";
import { isNurseOnly } from "@/lib/env";

export async function GET(request: Request) {
  // A production build lets in only nursing students and nursing staff. `next dev` and
  // DEBUG_MODE=true keep the general mode, so any CMU account can sign in.
  return startCmuLogin(request, isNurseOnly() ? "nurse" : "general");
}
