"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Tag, Calendar, FileText, Pencil, Save, X } from "lucide-react";

interface WikiPage {
  slug: string;
  title: string;
  content: string;
  frontmatter: {
    title: string;
    tags?: string[];
    sources?: string[];
    created?: string;
    updated?: string;
    category?: string;
    summary?: string;
  };
}

export default function WikiPageView() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [page, setPage] = useState<WikiPage | null>(null);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/wiki/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(data => {
        setPage(data);
        setEditContent(data.content);
      })
      .catch(() => setPage(null))
      .finally(() => setLoading(false));
  }, [slug]);

  const handleSave = async () => {
    if (!page) return;
    setSaving(true);
    await fetch(`/api/wiki/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ frontmatter: page.frontmatter, content: editContent }),
    });
    setPage({ ...page, content: editContent });
    setEditing(false);
    setSaving(false);
  };

  // Transform [[wiki links]] in markdown
  const processWikiLinks = (text: string) => {
    return text.replace(/\[\[([^\]]+)\]\]/g, (_, title) => {
      const linkSlug = title.toLowerCase().replace(/[^\w\s-]/g, "").replace(/[\s_]+/g, "-");
      return `[${title}](/wiki/${linkSlug})`;
    });
  };

  if (loading) return <div className="p-8"><p className="text-muted-foreground">Loading...</p></div>;
  if (!page) return (
    <div className="p-8">
      <p className="text-muted-foreground">Page not found.</p>
      <Link href="/wiki" className="text-primary hover:underline text-sm mt-2 block">← Back to Wiki</Link>
    </div>
  );

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/wiki" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Wiki
      </Link>

      <div className="bg-card rounded-xl border border-border p-6">
        {/* Frontmatter header */}
        <div className="mb-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <h1 className="text-2xl font-bold text-foreground">{page.frontmatter.title}</h1>
            <div className="flex gap-2">
              {editing ? (
                <>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs">
                    <Save className="w-3 h-3" />{saving ? "Saving..." : "Save"}
                  </button>
                  <button onClick={() => { setEditing(false); setEditContent(page.content); }} className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs">
                    <X className="w-3 h-3" />Cancel
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-lg text-xs hover:bg-secondary/80">
                  <Pencil className="w-3 h-3" />Edit
                </button>
              )}
            </div>
          </div>

          {page.frontmatter.summary && (
            <p className="text-sm text-muted-foreground mt-2">{page.frontmatter.summary}</p>
          )}

          <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
            {page.frontmatter.category && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md">{page.frontmatter.category}</span>
            )}
            {page.frontmatter.created && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Created: {page.frontmatter.created}</span>
            )}
            {page.frontmatter.updated && (
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Updated: {page.frontmatter.updated}</span>
            )}
            {page.frontmatter.sources && page.frontmatter.sources.length > 0 && (
              <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{page.frontmatter.sources.length} source(s)</span>
            )}
          </div>

          {page.frontmatter.tags && page.frontmatter.tags.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {page.frontmatter.tags.map(tag => (
                <span key={tag} className="flex items-center gap-1 text-[10px] bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">
                  <Tag className="w-2.5 h-2.5" />{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        {editing ? (
          <textarea
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
            className="w-full h-96 bg-background text-foreground p-4 rounded-lg border border-border font-mono text-sm resize-y"
          />
        ) : (
          <div className="wiki-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {processWikiLinks(page.content)}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
