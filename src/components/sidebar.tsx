"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  GitFork,
  Upload,
  MessageSquare,
  ShieldCheck,
  ScrollText,
  Settings,
} from "lucide-react";
import { useBranding } from "@/lib/branding";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/wiki", label: "Wiki", icon: BookOpen },
  { href: "/graph", label: "Graph", icon: GitFork },
  { href: "/sources", label: "Sources", icon: Upload },
  { href: "/query", label: "Query", icon: MessageSquare },
  { href: "/lint", label: "Lint", icon: ShieldCheck },
  { href: "/log", label: "Log", icon: ScrollText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const branding = useBranding();

  return (
    <aside className="w-56 min-h-screen bg-sidebar border-r border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          {branding.logoUrl ? (
            <Image
              src={branding.logoUrl}
              alt={branding.appName}
              width={32}
              height={32}
              className="w-8 h-8 rounded-lg object-contain"
            />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <BookOpen className="w-4 h-4 text-white" />
            </div>
          )}
          <div>
            <h1 className="font-bold text-sm text-foreground">{branding.appName}</h1>
            <p className="text-[10px] text-muted-foreground">{branding.tagline}</p>
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

      <div className="p-4 border-t border-border space-y-1">
        {branding.footerText && (
          <p className="text-[10px] text-muted-foreground">
            {branding.footerLink ? (
              <a href={branding.footerLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {branding.footerText}
              </a>
            ) : (
              branding.footerText
            )}
          </p>
        )}
        {branding.showKarpathyCredit && (
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
        )}
      </div>
    </aside>
  );
}
