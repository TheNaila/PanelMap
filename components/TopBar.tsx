"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Zap, LogOut, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function TopBar() {
  const { user, logOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logOut();
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-blue-900 text-white h-14 flex items-center px-4 shadow-lg">
      <Link href="/dashboard" className="flex items-center gap-2 flex-1">
        <div className="bg-yellow-400 rounded-lg p-1">
          <Zap className="w-4 h-4 text-blue-900" />
        </div>
        <span className="font-bold text-lg tracking-tight">PanelMap</span>
      </Link>

      <div className="flex items-center gap-2">
        <Link
          href="/search"
          className="p-2 rounded-lg hover:bg-blue-800 transition-colors"
          aria-label="Search"
        >
          <Search className="w-5 h-5" />
        </Link>

        {user && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center text-xs font-bold uppercase">
              {user.displayName?.[0] || user.email?.[0] || "U"}
            </div>
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-blue-800 transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
