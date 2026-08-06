import { startCmuLogin } from "@/lib/cmu-auth";

export async function GET(request: Request) {
  return startCmuLogin(request, "nurse");
}
