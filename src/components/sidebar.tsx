"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  GitFork,
  Upload,
  MessageSquare,
  ShieldCheck,
  ScrollText,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/graph", label: "Graph", icon: GitFork },
  { href: "/sources", label: "Sources", icon: Upload },
  { href: "/query", label: "Query", icon: MessageSquare },
  { href: "/lint", label: "Lint", icon: ShieldCheck },
  { href: "/log", label: "Log", icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 min-h-screen bg-sidebar border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-sm text-foreground">LLM Wiki</h1>
            <p className="text-[10px] text-muted-foreground">Knowledge Base</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <p className="text-[10px] text-muted-foreground">
          Inspired by{" "}
          <a
            href="https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Karpathy&apos;s LLM Wiki
          </a>
        </p>
      </div>
    </aside>
  );
}
