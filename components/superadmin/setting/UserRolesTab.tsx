// src/components/superadmin/setting/UserRolesTab.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  ChevronDown,
  Star,
  SearchX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import type { PredefinedRoleName, SuperAdminUser } from "@/lib/loan-api-types";

const ROLE_TO_THAI: Record<PredefinedRoleName, string> = {
  student: "นักศึกษา",
  advisor: "อาจารย์ที่ปรึกษา",
  admin: "เจ้าหน้าที่",
  executive: "ผู้บริหาร",
  super_admin: "ผู้ดูแลระบบ",
};

const THAI_TO_ROLE: Record<string, PredefinedRoleName> = {
  "นักศึกษา": "student",
  "อาจารย์ที่ปรึกษา": "advisor",
  "เจ้าหน้าที่": "admin",
  "ผู้บริหาร": "executive",
  "ผู้ดูแลระบบ": "super_admin",
};

const ROLE_PRIORITY: PredefinedRoleName[] = [
  "super_admin",
  "executive",
  "admin",
  "advisor",
  "student",
];

function getPrimaryRole(roles: { role: PredefinedRoleName }[]): string {
  for (const priority of ROLE_PRIORITY) {
    if (roles.some((r) => r.role === priority)) {
      return ROLE_TO_THAI[priority];
    }
  }
  return "นักศึกษา";
}

function getInitials(name?: string | null, email?: string | null): string {
  if (!name && !email) return "--";
  const str = (name || email || "").trim();
  const parts = str.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0].slice(0, 1) + parts[1].slice(0, 1));
  }
  return str.slice(0, 2);
}

interface UserRolesTabProps {
  initialUsers?: SuperAdminUser[];
  currentUserId?: string;
}

export default function UserRolesTab({
  initialUsers = [],
  currentUserId,
}: UserRolesTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ทุกบทบาท");
  const [usersList, setUsersList] = useState<SuperAdminUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(initialUsers.length === 0);
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);

  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // If initialUsers was empty, fetch client-side
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      setUsersList(initialUsers);
      setIsLoading(false);
      return;
    }

    let isMounted = true;
    fetch("/api/super-admin/users")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load users");
        return res.json();
      })
      .then((json) => {
        if (isMounted && json.data?.users) {
          setUsersList(json.data.users);
        }
      })
      .catch((err) => {
        console.error("Failed to load users:", err);
        if (isMounted) {
          showToast("error", "ไม่สามารถโหลดรายชื่อผู้ใช้จากฐานข้อมูลได้");
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialUsers]);

  // Handle role mutation
  const handleRoleChange = async (user: SuperAdminUser, newThaiRole: string) => {
    const targetRole = THAI_TO_ROLE[newThaiRole];
    if (!targetRole) return;

    const currentRoleNames = user.roles.map((r) => r.role);
    if (currentRoleNames.length === 1 && currentRoleNames[0] === targetRole) {
      return;
    }

    if (targetRole === "executive") {
      const execUser = usersList.find(
        (u) => u.id !== user.id && u.roles.some((r) => r.role === "executive"),
      );
      if (execUser) {
        const execName = execUser.fullNameTh || execUser.fullNameEn || execUser.email;
        showToast("error", `มีผู้บริหารในระบบแล้ว (${execName}) กรุณาเปลี่ยนบทบาทผู้บริหารเดิมก่อน`);
        return;
      }
    }

    setMutatingUserId(user.id);

    try {
      // 1. Grant new role first (keeps admin permissions active if editing self)
      if (!currentRoleNames.includes(targetRole)) {
        const grantRes = await fetch(`/api/super-admin/users/${user.id}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "grant", role: targetRole }),
        });
        if (!grantRes.ok) {
          const errJson = await grantRes.json().catch(() => ({}));
          throw new Error(errJson.error?.message || "ไม่สามารถเพิ่มบทบาทผู้ใช้ได้");
        }
      }

      // 2. Remove all old roles that are not the target role
      for (const oldRole of currentRoleNames) {
        if (oldRole === targetRole) continue;
        const remRes = await fetch(`/api/super-admin/users/${user.id}/roles`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "remove", role: oldRole }),
        });
        if (!remRes.ok) {
          const errJson = await remRes.json().catch(() => ({}));
          if (errJson.error?.code === "FINAL_SUPER_ADMIN" || remRes.status === 409) {
            throw new Error("ไม่สามารถยกเลิกบทบาทผู้ดูแลระบบคนสุดท้ายได้");
          }
          console.warn(`Failed to remove old role ${oldRole}:`, errJson);
        }
      }

      // 4. Update local state
      setUsersList((prev) =>
        prev.map((u) => {
          if (u.id !== user.id) return u;
          return {
            ...u,
            roles: [
              {
                role: targetRole,
                grantedBy: currentUserId || null,
                grantedAt: new Date().toISOString(),
              },
            ],
          };
        }),
      );

      const displayName = user.fullNameTh || user.fullNameEn || user.email;
      showToast("success", `เปลี่ยนบทบาทของ ${displayName} เป็น "${newThaiRole}" เรียบร้อยแล้ว`);

      // NAT-114: Refresh session permissions if own role was changed
      if (currentUserId && user.id === currentUserId) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเปลี่ยนบทบาท";
      showToast("error", msg);
    } finally {
      setMutatingUserId(null);
    }
  };

  // Filter users by search query and role
  const filteredUsers = usersList.filter((user) => {
    const name = (user.fullNameTh || user.fullNameEn || "").toLowerCase();
    const email = (user.email || "").toLowerCase();
    const code = (user.studentCode || user.cmuAccount || user.id || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    const matchesSearch =
      !query || name.includes(query) || email.includes(query) || code.includes(query);

    const userThaiRoles = user.roles.map((r) => ROLE_TO_THAI[r.role]);
    const matchesRole = roleFilter === "ทุกบทบาท" || userThaiRoles.includes(roleFilter);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl border ${
            toast.type === "error"
              ? "bg-red-900 border-red-700 text-white"
              : "bg-gray-900 border-gray-700 text-white"
          } animate-in slide-in-from-bottom-5`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} className="text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="text-gray-400 hover:text-white ml-2"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาชื่อ / อีเมล / รหัส CMU"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all shadow-sm"
          />
        </div>
        <div className="w-full sm:w-48">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm cursor-pointer appearance-none"
          >
            <option value="ทุกบทบาท">ทุกบทบาท</option>
            <option value="นักศึกษา">นักศึกษา</option>
            <option value="อาจารย์ที่ปรึกษา">อาจารย์ที่ปรึกษา</option>
            <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
            <option value="ผู้บริหาร">ผู้บริหาร</option>
            <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
          </select>
        </div>
      </div>

      {/* User List Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">
            ผู้ใช้ ({filteredUsers.length})
          </h2>
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Loader2 size={14} className="animate-spin text-orange-500" />
              กำลังโหลด...
            </div>
          )}
        </div>

        {/* 1. Mobile View (Cards) */}
        <div className="md:hidden p-4 space-y-3 bg-gray-50/30">
          {isLoading ? (
            <div className="py-12 text-center text-gray-400 flex flex-col items-center">
              <Loader2 className="h-8 w-8 mb-2 animate-spin text-orange-500" />
              <p className="text-sm">กำลังโหลดข้อมูลผู้ใช้...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-gray-500 flex flex-col items-center">
              <SearchX className="h-8 w-8 mb-2 text-gray-400" />
              <p className="text-sm">ไม่พบผู้ใช้งานที่ค้นหา</p>
            </div>
          ) : (
            filteredUsers.map((user, index) => {
              const displayName = user.fullNameTh || user.fullNameEn || user.email;
              const displayId = user.studentCode || user.cmuAccount || user.id.slice(0, 8);
              const initials = getInitials(user.fullNameTh || user.fullNameEn, user.email);
              const primaryRole = getPrimaryRole(user.roles);
              const isStarred = user.roles.some(
                (r) => r.role === "super_admin" || r.role === "executive",
              );
              const isMutating = mutatingUserId === user.id;

              const isAnotherUserExecutive = usersList.some(
                (u) => u.id !== user.id && u.roles.some((r) => r.role === "executive"),
              );

              return (
                <div
                  key={user.id}
                  className={`flex flex-col gap-3 p-3.5 rounded-xl border ${
                    index === 0 ? "border-orange-400 bg-orange-50/30" : "border-gray-200 bg-white"
                  } transition-colors group shadow-sm`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-semibold shrink-0">
                        {initials}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900 text-[14px] leading-tight">
                            {displayName}
                          </span>
                          {isStarred && (
                            <Star size={14} className="fill-orange-500 text-orange-500" />
                          )}
                        </div>
                        <div className="text-[12px] text-gray-500 mt-0.5">{displayId}</div>
                      </div>
                    </div>
                  </div>

                  {/* Badges for active roles if multi-role */}
                  {user.roles.length > 1 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {user.roles.map((r) => (
                        <span
                          key={r.role}
                          className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-[11px] font-medium"
                        >
                          {ROLE_TO_THAI[r.role]}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    <div className="text-[12px] text-gray-600 truncate pr-2">{user.email}</div>

                    {/* Role Dropdown */}
                    <div className="relative shrink-0">
                      {isMutating ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] text-gray-500 bg-gray-100 rounded-lg">
                          <Loader2 size={12} className="animate-spin text-orange-500" />
                          กำลังบันทึก...
                        </div>
                      ) : (
                        <>
                          <select
                            value={primaryRole}
                            onChange={(e) => handleRoleChange(user, e.target.value)}
                            disabled={isMutating}
                            className="appearance-none pl-3 pr-8 py-1.5 rounded-lg text-[12px] font-medium text-gray-700 bg-white border border-gray-300 hover:border-gray-400 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                          >
                            <option value="นักศึกษา">นักศึกษา</option>
                            <option value="อาจารย์ที่ปรึกษา">อาจารย์ที่ปรึกษา</option>
                            <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
                            <option value="ผู้บริหาร" disabled={isAnotherUserExecutive}>
                              ผู้บริหาร{isAnotherUserExecutive ? " (มีผู้บริหารแล้ว)" : ""}
                            </option>
                            <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
                          </select>
                          <ChevronDown
                            size={14}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                          />
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop/Tablet Table View */}
        <div className="hidden md:block overflow-x-auto relative">
          <table className="w-full text-left border-collapse bg-white">
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[35%]" />
              <col className="w-[25%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 text-[13px]">
                <th className="py-3.5 px-6 font-semibold border-r border-gray-200">
                  ชื่อผู้ใช้งาน
                </th>
                <th className="py-3.5 px-6 font-semibold border-r border-gray-200">
                  อีเมล / รหัสประจำตัว
                </th>
                <th className="py-3.5 px-6 font-semibold text-center">บทบาท</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={3}>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Loader2 className="h-8 w-8 mb-2 animate-spin text-orange-500" />
                      <p className="text-sm">กำลังโหลดข้อมูลผู้ใช้...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3}>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <SearchX className="h-8 w-8 mb-2 text-gray-400" />
                      <p className="text-sm">ไม่พบผู้ใช้งานที่ค้นหา</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => {
                  const displayName = user.fullNameTh || user.fullNameEn || user.email;
                  const displayId = user.studentCode || user.cmuAccount || user.id.slice(0, 8);
                  const initials = getInitials(user.fullNameTh || user.fullNameEn, user.email);
                  const primaryRole = getPrimaryRole(user.roles);
                  const isStarred = user.roles.some(
                    (r) => r.role === "super_admin" || r.role === "executive",
                  );
                  const isMutating = mutatingUserId === user.id;
                  const isAnotherUserExecutive = usersList.some(
                    (u) => u.id !== user.id && u.roles.some((r) => r.role === "executive"),
                  );

                  return (
                    <tr
                      key={user.id}
                      className={`border-b border-gray-100 hover:bg-slate-50 transition-colors group ${
                        index === 0 ? "bg-orange-50/20" : ""
                      }`}
                    >
                      <td className="py-3 px-6 border-r border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[13px] font-semibold shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900 text-[14px]">
                                {displayName}
                              </span>
                              {isStarred && (
                                <Star size={14} className="fill-orange-500 text-orange-500" />
                              )}
                            </div>
                            {user.roles.length > 1 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {user.roles.map((r) => (
                                  <span
                                    key={r.role}
                                    className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-orange-100/70 text-orange-800"
                                  >
                                    {ROLE_TO_THAI[r.role]}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6 border-r border-gray-100">
                        <div className="text-[13px] text-gray-700">{user.email}</div>
                        <div className="text-[12px] text-gray-400 mt-0.5">{displayId}</div>
                      </td>
                      <td className="py-3 px-6 align-middle">
                        <div className="flex justify-center">
                          <div className="relative inline-block w-40">
                            {isMutating ? (
                              <div className="w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-[13px] font-medium text-gray-500 bg-gray-100 border border-gray-200">
                                <Loader2 size={14} className="animate-spin text-orange-500" />
                                กำลังบันทึก...
                              </div>
                            ) : (
                              <>
                                <select
                                  value={primaryRole}
                                  onChange={(e) => handleRoleChange(user, e.target.value)}
                                  disabled={isMutating}
                                  className="w-full appearance-none pl-4 pr-8 py-1.5 rounded-lg text-[13px] font-medium text-gray-700 bg-white border border-gray-300 hover:border-gray-400 outline-none cursor-pointer transition-all focus:ring-2 focus:ring-orange-500/20 disabled:opacity-50"
                                >
                                  <option value="นักศึกษา">นักศึกษา</option>
                                  <option value="อาจารย์ที่ปรึกษา">อาจารย์ที่ปรึกษา</option>
                                  <option value="เจ้าหน้าที่">เจ้าหน้าที่</option>
                                  <option value="ผู้บริหาร" disabled={isAnotherUserExecutive}>
                                    ผู้บริหาร{isAnotherUserExecutive ? " (มีผู้บริหารแล้ว)" : ""}
                                  </option>
                                  <option value="ผู้ดูแลระบบ">ผู้ดูแลระบบ</option>
                                </select>
                                <ChevronDown
                                  size={14}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500"
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
