import React from "react";
import { requireAdminAccess } from "@/lib/loan-auth";

export const dynamic = "force-dynamic";

// The page lists every student's code and name, so only Admin and SuperAdmin may open it.
// requireAdminAccess accepts both roles, sends a signed-out user to /login, and others to /error.
export default async function UserLayout({ children }: { children: React.ReactNode }) {
  await requireAdminAccess();
  return children;
}
