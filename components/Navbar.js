"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  BookOpen,
  Trophy,
  Shield,
  LogOut,
  GraduationCap,
  ListTodo,
} from "lucide-react";

const LINKS = [
  { href: "/dashboard", label: "Progress-Ku", icon: LayoutDashboard },
  { href: "/materi", label: "Materi", icon: BookOpen },
  { href: "/jadwal-saya", label: "Jadwal Saya", icon: ListTodo },
  { href: "/leaderboard", label: "Peringkat", icon: Trophy },
];

export default function Navbar({ profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const links = [...LINKS];
  if (profile?.is_admin) {
    links.push({ href: "/admin/materials", label: "Admin", icon: Shield });
  }

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-slate-800">
          <GraduationCap className="h-6 w-6 text-brand-600" />
          <span>StemsatoPTN</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-600 hover:bg-slate-100"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <span className="hidden max-w-[120px] truncate text-sm text-slate-600 md:inline">
            {profile?.full_name || "Pengguna"}
          </span>
          <button onClick={signOut} className="btn-ghost !px-2.5" title="Keluar">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
