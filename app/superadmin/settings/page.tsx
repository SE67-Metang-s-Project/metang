import Settings from "@/components/superadmin/setting/SettingPage";
import { requireSuperAdminAccess } from "@/lib/loan-auth";
import { listUsersWithRoles } from "@/db/queries/users";
import { serializeJson } from "@/lib/serialization";

export const dynamic = "force-dynamic";

export default async function Page() {
  const context = await requireSuperAdminAccess();
  const rawUsers = await listUsersWithRoles().catch((error) => {
    console.error("Unable to list users and roles from DB", error);
    return [];
  });

  const userName = context.user.fullNameTh || context.identity.displayName || "SuperAdmin";
  const userId = context.user.cmuAccount || context.identity.cmuAccount || "SA-001";
  const userEmail = context.user.email || context.identity.email || undefined;
  const currentUserId = context.user.id;

  return (
    <Settings
      userName={userName}
      userId={userId}
      userEmail={userEmail}
      currentUserId={currentUserId}
      initialUsers={serializeJson(rawUsers)}
    />
  );
}
