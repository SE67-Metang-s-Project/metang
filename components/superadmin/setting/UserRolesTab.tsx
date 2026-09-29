// src/components/superadmin/setting/UserRolesTab.tsx
"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  Star,
  SearchX,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  Trash2,
  Pencil,
  AlertTriangle,
} from "lucide-react";
import TablePagination from "@/components/shared/TablePagination";
import type { PredefinedRoleName, SuperAdminUser } from "@/lib/loan-api-types";
import { withBasePath } from "@/lib/base-path";

const ROLE_TO_THAI: Record<PredefinedRoleName, string> = {
  student: "นักศึกษา",
  advisor: "อาจารย์ที่ปรึกษา",
  admin: "เจ้าหน้าที่",
  executive: "ผู้บริหาร",
  super_admin: "ผู้ดูแลระบบ",
};

const THAI_TO_ROLE: Record<string, PredefinedRoleName> = {
  "เจ้าหน้าที่": "admin",
  "ผู้บริหาร": "executive",
  "ผู้ดูแลระบบ": "super_admin",
};

const MANAGED_ROLES = new Set<PredefinedRoleName>(["admin", "executive", "super_admin"]);

const ROLE_PRIORITY: PredefinedRoleName[] = [
  "super_admin",
  "executive",
  "admin",
];

function getPrimaryRole(roles: { role: PredefinedRoleName }[]): string {
  for (const priority of ROLE_PRIORITY) {
    if (roles.some((r) => r.role === priority)) {
      return ROLE_TO_THAI[priority];
    }
  }
  return ROLE_TO_THAI.admin;
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
  searchQuery: string;
  roleFilter: string;
  isAddModalOpen: boolean;
  onAddModalOpenChange: (isOpen: boolean) => void;
}

export default function UserRolesTab({
  initialUsers = [],
  currentUserId,
  searchQuery,
  roleFilter,
  isAddModalOpen,
  onAddModalOpenChange,
}: UserRolesTabProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [usersList, setUsersList] = useState<SuperAdminUser[]>(initialUsers);
  const [isLoading, setIsLoading] = useState(initialUsers.length === 0);
  const [prevInitial, setPrevInitial] = useState(initialUsers);
  const [mutatingUserId, setMutatingUserId] = useState<string | null>(null);

  const [addForm, setAddForm] = useState<{
    fullNameTh: string;
    email: string;
    role: "admin" | "super_admin";
  }>({ fullNameTh: "", email: "", role: "admin" });
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Edit Executive Modal State
  const [editUser, setEditUser] = useState<SuperAdminUser | null>(null);
  const [editForm, setEditForm] = useState<{
    fullNameTh: string;
    fullNameEn: string;
    email: string;
  }>({ fullNameTh: "", fullNameEn: "", email: "" });
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Delete User Confirmation Modal State
  const [userToDelete, setUserToDelete] = useState<SuperAdminUser | null>(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  if (prevInitial !== initialUsers) {
    setPrevInitial(initialUsers);
    setUsersList(initialUsers);
    setIsLoading(initialUsers.length === 0);
  }

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

  const superAdminCount = usersList.filter((u) =>
    u.roles.some((r) => r.role === "super_admin"),
  ).length;

  // If initialUsers was empty, fetch client-side
  useEffect(() => {
    if (initialUsers && initialUsers.length > 0) {
      return;
    }

    let isMounted = true;
    fetch(withBasePath("/api/super-admin/users"))
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
    if (!targetRole || !MANAGED_ROLES.has(targetRole)) return;

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
        const grantRes = await fetch(withBasePath(`/api/super-admin/users/${user.id}/roles`), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "grant", role: targetRole }),
        });
        if (!grantRes.ok) {
          const errJson = await grantRes.json().catch(() => ({}));
          throw new Error(errJson.error?.message || "ไม่สามารถเพิ่มบทบาทผู้ใช้ได้");
        }
      }

      // 2. Remove all old managed roles that are not the target role
      for (const oldRole of currentRoleNames) {
        if (oldRole === targetRole) continue;
        if (!MANAGED_ROLES.has(oldRole)) continue;
        const remRes = await fetch(withBasePath(`/api/super-admin/users/${user.id}/roles`), {
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

      // 3. Update local state
      setUsersList((prev) =>
        prev.map((u) => {
          if (u.id !== user.id) return u;
          const keptRoles = u.roles.filter((r) => !MANAGED_ROLES.has(r.role));
          return {
            ...u,
            roles: [
              ...keptRoles,
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

      // Refresh session permissions if own role was changed
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

  // Handle Add User (Admin or Super Admin)
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.fullNameTh.trim()) {
      showToast("error", "กรุณากรอกชื่อ-นามสกุล");
      return;
    }
    if (!addForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addForm.email.trim())) {
      showToast("error", "กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setIsAddingUser(true);
    try {
      const res = await fetch(withBasePath("/api/super-admin/users"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullNameTh: addForm.fullNameTh.trim(),
          email: addForm.email.trim().toLowerCase(),
          role: addForm.role,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "ไม่สามารถเพิ่มผู้ใช้งานได้");
      }

      const createdUser: SuperAdminUser = json.data;
      setUsersList((prev) => {
        const existsIndex = prev.findIndex((u) => u.id === createdUser.id);
        if (existsIndex >= 0) {
          const copy = [...prev];
          copy[existsIndex] = createdUser;
          return copy;
        }
        return [createdUser, ...prev];
      });

      onAddModalOpenChange(false);
      setAddForm({ fullNameTh: "", email: "", role: "admin" });
      const displayName = createdUser.fullNameTh || createdUser.email;
      showToast(
        "success",
        `เพิ่มผู้ใช้งาน ${displayName} (${ROLE_TO_THAI[addForm.role]}) เรียบร้อยแล้ว`,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการเพิ่มผู้ใช้งาน";
      showToast("error", msg);
    } finally {
      setIsAddingUser(false);
    }
  };

  // Handle Edit Executive (Name and Email)
  const handleSaveExecutiveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    if (!editForm.fullNameTh.trim()) {
      showToast("error", "กรุณากรอกชื่อ-นามสกุล");
      return;
    }
    if (!editForm.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
      showToast("error", "กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setIsSavingEdit(true);
    try {
      const res = await fetch(withBasePath(`/api/super-admin/users/${editUser.id}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullNameTh: editForm.fullNameTh.trim(),
          fullNameEn: editForm.fullNameEn.trim() || undefined,
          email: editForm.email.trim().toLowerCase(),
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "ไม่สามารถแก้ไขข้อมูลได้");
      }

      const updatedUser: SuperAdminUser = json.data;
      setUsersList((prev) =>
        prev.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      );

      setEditUser(null);
      showToast("success", "แก้ไขข้อมูลผู้บริหารเรียบร้อยแล้ว");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการแก้ไขข้อมูล";
      showToast("error", msg);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Handle Delete User (Admin or Super Admin)
  const handleDeleteUser = async (user: SuperAdminUser) => {
    if (user.roles.some((r) => r.role === "super_admin") && superAdminCount <= 1) {
      showToast("error", "ไม่สามารถลบได้ เนื่องจากต้องมีผู้ดูแลระบบ (Super Admin) อย่างน้อย 1 คนในระบบ");
      setUserToDelete(null);
      return;
    }

    setIsDeletingUser(true);
    try {
      const res = await fetch(withBasePath(`/api/super-admin/users/${user.id}`), {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (err.error?.code === "FINAL_SUPER_ADMIN" || res.status === 409) {
          throw new Error("ไม่สามารถลบผู้ดูแลระบบคนสุดท้ายได้ (ต้องมีผู้ดูแลระบบอย่างน้อย 1 คนในระบบ)");
        }
        throw new Error(err.error?.message || "ไม่สามารถลบผู้ใช้งานได้");
      }

      setUsersList((prev) => prev.filter((u) => u.id !== user.id));
      setUserToDelete(null);
      const displayName = user.fullNameTh || user.fullNameEn || user.email;
      showToast("success", `ลบผู้ใช้งาน ${displayName} เรียบร้อยแล้ว`);

      if (currentUserId && user.id === currentUserId) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "เกิดข้อผิดพลาดในการลบผู้ใช้งาน";
      showToast("error", msg);
    } finally {
      setIsDeletingUser(false);
    }
  };

  // Filter users by search query and role (managing only admin, executive, super_admin)
  const filteredUsers = usersList.filter((user) => {
    const hasManagedRole = user.roles.some((r) => MANAGED_ROLES.has(r.role));
    if (!hasManagedRole) return false;

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

  const [currentPage, setCurrentPage] = useState(1);
  const [prevFilters, setPrevFilters] = useState({ searchQuery, roleFilter, count: filteredUsers.length });

  if (
    prevFilters.searchQuery !== searchQuery ||
    prevFilters.roleFilter !== roleFilter ||
    prevFilters.count !== filteredUsers.length
  ) {
    setPrevFilters({ searchQuery, roleFilter, count: filteredUsers.length });
    setCurrentPage(1);
  }

  const totalPages = Math.ceil(filteredUsers.length / 5);
  const validCurrentPage = totalPages > 0 ? Math.min(Math.max(currentPage, 1), totalPages) : 1;
  const paginatedUsers = filteredUsers.length > 5
    ? filteredUsers.slice((validCurrentPage - 1) * 5, validCurrentPage * 5)
    : filteredUsers;

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
            className="text-gray-400 hover:text-white ml-2 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* User List Container */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-4 border-b border-gray-100 bg-white flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
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
            paginatedUsers.map((user, index) => {
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

              const isSuperAdmin = user.roles.some((r) => r.role === "super_admin");
              const isExecutive = user.roles.some((r) => r.role === "executive");

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
                          <span className="font-semibold text-gray-900 text-[14px] leading-tight">
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
                  {user.roles.filter((r) => MANAGED_ROLES.has(r.role)).length > 1 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {user.roles
                        .filter((r) => MANAGED_ROLES.has(r.role))
                        .map((r) => (
                          <span
                            key={r.role}
                            className="px-2 py-0.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-md text-[11px] font-medium"
                          >
                            {ROLE_TO_THAI[r.role]}
                          </span>
                        ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3 gap-2">
                    <div className="text-[12px] text-gray-600 truncate flex-1">{user.email}</div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Role Dropdown */}
                      <div className="relative">
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

                      {/* Action Button: Edit for Executive, Delete for Admin/SuperAdmin */}
                      {isExecutive ? (
                        <button
                          onClick={() => {
                            setEditUser(user);
                            setEditForm({
                              fullNameTh: user.fullNameTh || "",
                              fullNameEn: user.fullNameEn || "",
                              email: user.email || "",
                            });
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg cursor-pointer"
                          title="แก้ไขชื่อและอีเมล"
                        >
                          <Pencil size={12} />
                          <span>แก้ไข</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            if (isSuperAdmin && superAdminCount <= 1) {
                              showToast(
                                "error",
                                "ไม่สามารถลบได้ เนื่องจากต้องมีผู้ดูแลระบบ (Super Admin) อย่างน้อย 1 คนในระบบ",
                              );
                              return;
                            }
                            setUserToDelete(user);
                          }}
                          disabled={isSuperAdmin && superAdminCount <= 1}
                          className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg ${
                            isSuperAdmin && superAdminCount <= 1
                              ? "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                              : "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer"
                          }`}
                          title={
                            isSuperAdmin && superAdminCount <= 1
                              ? "ไม่สามารถลบได้ ต้องมีผู้ดูแลระบบอย่างน้อย 1 คนในระบบ"
                              : "ลบผู้ใช้งาน"
                          }
                        >
                          <Trash2 size={12} />
                          <span>ลบ</span>
                        </button>
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
              <col className="w-[35%]" />
              <col className="w-[28%]" />
              <col className="w-[22%]" />
              <col className="w-[15%]" />
            </colgroup>
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-gray-700 text-[13px]">
                <th className="py-3.5 px-6 font-semibold border-r border-gray-200">
                  ชื่อผู้ใช้งาน
                </th>
                <th className="py-3.5 px-6 font-semibold border-r border-gray-200">
                  อีเมล / รหัสประจำตัว
                </th>
                <th className="py-3.5 px-6 font-semibold text-center border-r border-gray-200">
                  บทบาท
                </th>
                <th className="py-3.5 px-6 font-semibold text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Loader2 className="h-8 w-8 mb-2 animate-spin text-orange-500" />
                      <p className="text-sm">กำลังโหลดข้อมูลผู้ใช้...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <SearchX className="h-8 w-8 mb-2 text-gray-400" />
                      <p className="text-sm">ไม่พบผู้ใช้งานที่ค้นหา</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user, index) => {
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

                  const isSuperAdmin = user.roles.some((r) => r.role === "super_admin");
                  const isExecutive = user.roles.some((r) => r.role === "executive");

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
                              <span className="font-semibold text-gray-900 text-[14px]">
                                {displayName}
                              </span>
                              {isStarred && (
                                <Star size={14} className="fill-orange-500 text-orange-500" />
                              )}
                            </div>
                            {user.roles.filter((r) => MANAGED_ROLES.has(r.role)).length > 1 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {user.roles
                                  .filter((r) => MANAGED_ROLES.has(r.role))
                                  .map((r) => (
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
                      <td className="py-3 px-6 border-r border-gray-100 align-middle">
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
                      <td className="py-3 px-6 align-middle">
                        <div className="flex justify-center items-center gap-2">
                          {isExecutive ? (
                            <button
                              onClick={() => {
                                setEditUser(user);
                                setEditForm({
                                  fullNameTh: user.fullNameTh || "",
                                  fullNameEn: user.fullNameEn || "",
                                  email: user.email || "",
                                });
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors cursor-pointer"
                              title="แก้ไขชื่อและอีเมล"
                            >
                              <Pencil size={13} />
                              <span>แก้ไข</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (isSuperAdmin && superAdminCount <= 1) {
                                  showToast(
                                    "error",
                                    "ไม่สามารถลบได้ เนื่องจากต้องมีผู้ดูแลระบบ (Super Admin) อย่างน้อย 1 คนในระบบ",
                                  );
                                  return;
                                }
                                setUserToDelete(user);
                              }}
                              disabled={isSuperAdmin && superAdminCount <= 1}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                isSuperAdmin && superAdminCount <= 1
                                  ? "text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed"
                                  : "text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 cursor-pointer"
                              }`}
                              title={
                                isSuperAdmin && superAdminCount <= 1
                                  ? "ไม่สามารถลบได้ ต้องมีผู้ดูแลระบบอย่างน้อย 1 คนในระบบ"
                                  : "ลบผู้ใช้งาน"
                              }
                            >
                              <Trash2 size={13} />
                              <span>ลบ</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredUsers.length > 5 && (
          <TablePagination
            currentPage={validCurrentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* Modal: Add User (Admin or Super Admin) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-semibold">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">เพิ่มผู้ใช้งานใหม่</h3>
                  <p className="text-xs text-gray-500">เพิ่มเจ้าหน้าที่ หรือ ผู้ดูแลระบบในระบบ</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setAddForm({ fullNameTh: "", email: "", role: "admin" });
                  onAddModalOpenChange(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddUser} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมชาย ใจดี"
                  value={addForm.fullNameTh}
                  onChange={(e) => setAddForm({ ...addForm, fullNameTh: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  อีเมล CMU / อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="เช่น somchai.j@cmu.ac.th"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  บทบาท <span className="text-red-500">*</span>
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) =>
                    setAddForm({ ...addForm, role: e.target.value as "admin" | "super_admin" })
                  }
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 cursor-pointer"
                >
                  <option value="admin">เจ้าหน้าที่</option>
                  <option value="super_admin">ผู้ดูแลระบบ</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setAddForm({ fullNameTh: "", email: "", role: "admin" });
                    onAddModalOpenChange(false);
                  }}
                  disabled={isAddingUser}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAddingUser && <Loader2 size={14} className="animate-spin" />}
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Executive (Name and Email) */}
      {editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-semibold">
                  <Pencil size={18} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-base">แก้ไขข้อมูลผู้บริหาร</h3>
                  <p className="text-xs text-gray-500">แก้ไขชื่อ-นามสกุล และอีเมลของผู้บริหาร</p>
                </div>
              </div>
              <button
                onClick={() => setEditUser(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExecutiveEdit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อ-นามสกุล (ภาษาไทย) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ผศ.ดร. นันทนา สุขใจ"
                  value={editForm.fullNameTh}
                  onChange={(e) => setEditForm({ ...editForm, fullNameTh: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  ชื่อ-นามสกุล (ภาษาอังกฤษ)
                </label>
                <input
                  type="text"
                  placeholder="เช่น Asst. Prof. Dr. Nantana Sukjai"
                  value={editForm.fullNameEn}
                  onChange={(e) => setEditForm({ ...editForm, fullNameEn: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  อีเมล <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="เช่น nantana.s@cmu.ac.th"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditUser(null)}
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#ea580c] hover:bg-[#c2410c] rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit && <Loader2 size={14} className="animate-spin" />}
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Deletion (Admin or Super Admin) */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative">
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-base">ยืนยันการลบผู้ใช้งาน</h3>
                <p className="text-xs text-gray-500">การดำเนินการนี้จะไม่สามารถย้อนกลับได้</p>
              </div>
            </div>

            <div className="py-4 text-sm text-gray-600 space-y-2">
              <p>
                คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน{" "}
                <strong className="text-gray-900 font-semibold">
                  {userToDelete.fullNameTh || userToDelete.fullNameEn || userToDelete.email}
                </strong>{" "}
                ({getPrimaryRole(userToDelete.roles)}) ออกจากระบบ?
              </p>
              {userToDelete.roles.some((r) => r.role === "admin") && (
                <p className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                  หมายเหตุ: หากเจ้าหน้าที่มีคำร้องรอตรวจสอบอยู่ ระบบจะโอนคำร้องไปยังผู้ดูแลระบบโดยอัตโนมัติ
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeletingUser}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => handleDeleteUser(userToDelete)}
                disabled={isDeletingUser}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDeletingUser && <Loader2 size={14} className="animate-spin" />}
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
