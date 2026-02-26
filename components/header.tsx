"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth/client";
import { ThemeToggle } from "./theme-toggle";
import {
  GraduationCap,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  User,
  Shield,
  BookOpen,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Shield className="h-3.5 w-3.5" />,
  teacher: <BookOpen className="h-3.5 w-3.5" />,
  student: <GraduationCap className="h-3.5 w-3.5" />,
};

const roleColors: Record<string, string> = {
  admin: "bg-red-500/20 text-red-400 border-red-500/30",
  teacher: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  student: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

export function Header() {
  const { data: session, isPending } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const userRole = (session?.user as { role?: string })?.role || "student";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.04] bg-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-white text-black transition-transform group-hover:scale-105">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-sm font-bold tracking-tight uppercase">
            Adaptive Platform
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-6">
         

          {isPending ? (
            <div className="h-4 w-12 animate-pulse rounded bg-white/5" />
          ) : session ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 transition-opacity hover:opacity-80"
              >
                <div className="h-7 w-7 rounded border border-white/10 bg-white/5 flex items-center justify-center text-[10px] font-bold">
                  {session.user.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden sm:block text-xs font-medium text-white/60">
                  {session.user.name}
                </span>
                <ChevronDown className="h-3 w-3 text-white/30" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-4 w-52 rounded border border-white/[0.08] bg-black/90 backdrop-blur-2xl py-2 shadow-2xl">
                  <div className="px-4 py-3 pb-2 border-b border-white/[0.04]">
                    <p className="text-xs font-bold text-white uppercase tracking-wider">{session.user.name}</p>
                    <p className="text-[10px] text-white/40 truncate mt-1">{session.user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <LayoutDashboard className="h-3.5 w-3.5" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <User className="h-3.5 w-3.5" />
                    Profile
                  </Link>
                  <div className="border-t border-white/[0.04] mt-2 pt-2">
                    <button
                      onClick={async () => {
                        await signOut();
                        setMenuOpen(false);
                        window.location.href = "/";
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2.5 text-xs font-medium text-red-400 hover:bg-red-500/5 transition-colors"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-8">
              <Link
                href="/sign-in"
                className="text-xs font-bold uppercase tracking-wider text-white/50 hover:text-white transition-colors"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="text-xs font-bold uppercase tracking-wider text-black bg-white px-5 py-2.5 rounded hover:bg-white/90 transition-all"
              >
                Join Now
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
