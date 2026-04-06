"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, Tag } from "lucide-react";

interface WikiPageSummary {
  slug: string;
  title: string;
  category: string;
  summary: string;
  tags: string[];
  updated: string;
}

export default function WikiBrowser() {
  const [pages, setPages] = useState<WikiPageSummary[]>([]);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/wiki").then(r => r.json()).then(setPages).catch(() => {});
  }, []);

  const categories = ["all", ...new Set(pages.map(p => p.category))];
  const filtered = filter === "all" ? pages : pages.filter(p => p.category === filter);

  return (
    <div className="p-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <BookOpen className="w-6 h-6" /> Wiki Pages
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{pages.length} pages total</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-3">
          {filtered
            .sort((a, b) => a.title.localeCompare(b.title))
            .map(page => (
              <Link
                key={page.slug}
                href={`/wiki/${page.slug}`}
                className="bg-card rounded-xl border border-border p-4 hover:border-primary transition-colors block"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">{page.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{page.summary}</p>
                    {page.tags && page.tags.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {page.tags.map(tag => (
                          <span key={tag} className="flex items-center gap-1 text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                            <Tag className="w-2.5 h-2.5" />{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-1 rounded-md whitespace-nowrap">
                    {page.category}
                  </span>
                </div>
              </Link>
            ))}
        </div>
      ) : (
        <div className="bg-card rounded-xl border border-border p-8 text-center">
          <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No wiki pages yet. Upload and ingest a source to get started.</p>
        </div>
      )}
    </div>
  );
}
