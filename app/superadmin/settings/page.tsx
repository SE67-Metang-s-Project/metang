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

  const currentUserId = context.user.id;

  return (
    <Settings
      currentUserId={currentUserId}
      initialUsers={serializeJson(rawUsers)}
    />
  );
}
