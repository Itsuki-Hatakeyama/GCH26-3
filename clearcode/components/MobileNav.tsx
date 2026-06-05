"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import LogoutButton from "@/components/LogoutButton";

const navItems = [
  { href: "/dashboard", label: "ホーム" },
  { href: "/dashboard/connect-github", label: "リポジトリ追加" },
  { href: "/dashboard/settings", label: "使用手順" },
  { href: "/dashboard/profile", label: "プロフィール" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="sm:hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-md text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors"
        aria-label="メニューを開く"
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-neutral-100 shadow-sm z-20">
          <nav className="container mx-auto px-6 py-3 flex flex-col">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-neutral-600 hover:text-black border-b border-neutral-50 last:border-0 transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <div className="py-3">
              <LogoutButton />
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
