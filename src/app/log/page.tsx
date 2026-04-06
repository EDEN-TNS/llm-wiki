"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollText } from "lucide-react";

export default function LogPage() {
  const [log, setLog] = useState("");

  useEffect(() => {
    fetch("/api/log").then(r => r.json()).then(d => setLog(d.content || "")).catch(() => {});
  }, []);

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
        <ScrollText className="w-6 h-6" /> Operations Log
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Chronological record of all wiki operations</p>

      <div className="bg-card rounded-xl border border-border p-6">
        {log && log.trim() !== "# Operations Log" ? (
          <div className="wiki-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{log}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No operations logged yet.</p>
        )}
      </div>
    </div>
  );
}
