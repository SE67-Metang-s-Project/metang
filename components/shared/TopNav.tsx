"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Mail, Menu } from "lucide-react";
import type { UserRole } from "@/components/shared/SidebarNav";

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  student: "นักศึกษา",
  advisor: "อาจารย์ที่ปรึกษา",
  admin: "ผู้ดูแลระบบ",
  executive: "ผู้บริหาร",
  superadmin: "ผู้ดูแลระบบระดับสูง",
};

export interface TopNavProps {
  onOpenSidebar?: () => void;
  userName: string;
  userId?: string;
  role?: UserRole;
  userRole?: string;
  userEmail?: string;
  showSidebarButton?: boolean;
}

export default function TopNav({
  onOpenSidebar,
  userName,
  userId,
  role,
  userRole,
  userEmail,
  showSidebarButton = true,
}: TopNavProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const displayRole = userRole ?? (role ? ROLE_DISPLAY_NAMES[role] : undefined) ?? userId ?? "ผู้ใช้งาน";
  const displayEmail = userEmail ?? (userId ? `${userId.toLowerCase()}@cmu.ac.th` : "user@cmu.ac.th");

  useEffect(() => {
    const closeProfileOnOutsideClick = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };

    const closeProfileOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsProfileOpen(false);
    };

    document.addEventListener("mousedown", closeProfileOnOutsideClick);
    document.addEventListener("keydown", closeProfileOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeProfileOnOutsideClick);
      document.removeEventListener("keydown", closeProfileOnEscape);
    };
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white sm:h-20">
        {showSidebarButton && onOpenSidebar ? (
          <div className="flex items-center min-[1576px]:hidden">
            <button
              onClick={onOpenSidebar}
              className="-ml-2 mr-2 rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Open sidebar navigation"
            >
              <Menu size={24} />
            </button>
          </div>
        ) : null}

        <div className="flex-1" />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((isOpen) => !isOpen)}
            className="flex items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500/30"
            aria-expanded={isProfileOpen}
            aria-haspopup="menu"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
              {userName.substring(0, 2)}
            </span>
            <span className="flex flex-col">
              <span className="text-[15px] font-bold leading-tight text-gray-900">{userName}</span>
              <span className="text-sm text-gray-500">{displayRole}</span>
            </span>
            <ChevronDown
              className={`h-4 w-4 text-gray-400 transition-transform ${isProfileOpen ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>

          {isProfileOpen ? (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-max max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
            >
              <div className="flex items-center gap-3 px-4 py-3 text-[14px]">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <div className="min-w-0 max-w-[calc(100vw-5rem)]">
                  <a
                    href={`mailto:${displayEmail}`}
                    className="block truncate text-[14px] text-gray-500 hover:text-gray-700 hover:underline"
                  >
                    {displayEmail}
                  </a>
                </div>
              </div>
              <form action="/api/auth/logout" method="post" className="border-t border-gray-100">
                <button
                  type="submit"
                  role="menuitem"
                  className="flex w-full items-center gap-3 px-4 py-3 text-[14px] font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  ออกจากระบบ
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </header>
      <div aria-hidden="true" className="h-16 shrink-0 sm:h-20" />
    </>
  );
}
