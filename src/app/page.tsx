"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Upload, MessageSquare, ShieldCheck, FileText, GitFork } from "lucide-react";

interface WikiPageSummary { slug: string; title: string; category: string; summary: string; updated: string; }
interface RawSource { filename: string; size: number; uploadedAt: string; }

export default function Dashboard() {
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [sources, setSources] = useState<RawSource[]>([]);
  const [log, setLog] = useState("");

  useEffect(() => {
    fetch("/api/wiki").then(r => r.json()).then(setPages).catch(() => {});
    fetch("/api/sources").then(r => r.json()).then(setSources).catch(() => {});
    fetch("/api/log").then(r => r.json()).then(d => setLog(d.content || "")).catch(() => {});
  }, []);

  const recentLog = log.split("\n").filter(l => l.startsWith("## [")).slice(-5).reverse();

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">LLM Wiki</h1>
        <p className="text-muted-foreground mt-1">Personal knowledge base powered by LLMs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard icon={<BookOpen className="w-5 h-5" />} label="Wiki Pages" value={pages.length} href="/wiki" />
        <StatCard icon={<FileText className="w-5 h-5" />} label="Raw Sources" value={sources.length} href="/sources" />
        <StatCard icon={<GitFork className="w-5 h-5" />} label="Categories" value={new Set(pages.map(p => p.category)).size} href="/graph" />
        <StatCard icon={<Upload className="w-5 h-5" />} label="Last Updated" value={pages.length > 0 ? pages.sort((a, b) => b.updated.localeCompare(a.updated))[0]?.updated || "\u2014" : "\u2014"} href="/log" isText />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/sources" className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary transition-colors">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Upload className="w-5 h-5 text-primary" /></div>
          <div><p className="font-medium text-foreground">Upload & Ingest</p><p className="text-xs text-muted-foreground">Add new source documents</p></div>
        </Link>
        <Link href="/query" className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary transition-colors">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><MessageSquare className="w-5 h-5 text-primary" /></div>
          <div><p className="font-medium text-foreground">Query Wiki</p><p className="text-xs text-muted-foreground">Ask questions about your knowledge</p></div>
        </Link>
        <Link href="/lint" className="flex items-center gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary transition-colors">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-primary" /></div>
          <div><p className="font-medium text-foreground">Health Check</p><p className="text-xs text-muted-foreground">Lint the wiki for issues</p></div>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3">Recent Activity</h2>
          {recentLog.length > 0 ? (
            <div className="space-y-2">{recentLog.map((entry, i) => (
              <p key={i} className="text-sm text-muted-foreground font-mono truncate">{entry.replace("## ", "")}</p>
            ))}</div>
          ) : (<p className="text-sm text-muted-foreground">No activity yet. Upload a source to get started.</p>)}
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-3">Recent Pages</h2>
          {pages.length > 0 ? (
            <div className="space-y-2">{pages.sort((a, b) => (b.updated || "").localeCompare(a.updated || "")).slice(0, 5).map(page => (
              <Link key={page.slug} href={`/wiki/${page.slug}`} className="block text-sm hover:text-primary transition-colors">
                <span className="text-foreground font-medium">{page.title}</span>
                <span className="text-muted-foreground ml-2 text-xs">({page.category})</span>
              </Link>
            ))}</div>
          ) : (<p className="text-sm text-muted-foreground">No wiki pages yet.</p>)}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, href, isText }: { icon: React.ReactNode; label: string; value: number | string; href: string; isText?: boolean }) {
  return (
    <Link href={href} className="bg-card rounded-xl border border-border p-4 hover:border-primary transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">{icon}<span className="text-xs">{label}</span></div>
      <p className={`font-bold ${isText ? "text-sm" : "text-2xl"} text-foreground`}>{value}</p>
    </Link>
  );
}
