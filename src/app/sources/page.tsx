"use client";

import { useEffect, useState, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface RawSource {
  filename: string;
  size: number;
  type: string;
  uploadedAt: string;
  ingested: boolean;
}

interface IngestResult {
  summary: string;
  pagesCreated: string[];
  pagesUpdated: string[];
}

export default function SourcesPage() {
  const [sources, setSources] = useState<RawSource[]>([]);
  const [uploading, setUploading] = useState(false);
  const [ingesting, setIngesting] = useState<string | null>(null);
  const [ingestResult, setIngestResult] = useState<IngestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const loadSources = useCallback(() => {
    fetch("/api/sources").then(r => r.json()).then(setSources).catch(() => {});
  }, []);

  useEffect(() => { loadSources(); }, [loadSources]);

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    setError(null);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        await fetch("/api/sources/upload", { method: "POST", body: formData });
      } catch {
        setError(`Failed to upload ${file.name}`);
      }
    }
    setUploading(false);
    loadSources();
  };

  const handleIngest = async (filename: string) => {
    setIngesting(filename);
    setIngestResult(null);
    setError(null);
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ingest failed");
      }
      const result = await res.json();
      setIngestResult(result);
      loadSources();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ingest failed");
    }
    setIngesting(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center gap-2">
        <Upload className="w-6 h-6" /> Raw Sources
      </h1>
      <p className="text-sm text-muted-foreground mb-6">Upload source documents, then ingest them into the wiki via LLM.</p>

      {/* Upload Drop Zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
        className={`border-2 border-dashed rounded-xl p-8 text-center mb-6 transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"
        }`}
      >
        <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-2">Drag & drop files here, or</p>
        <label className="inline-block px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm cursor-pointer hover:bg-primary/90">
          Browse Files
          <input
            type="file"
            multiple
            className="hidden"
            accept=".md,.txt,.html,.pdf,.csv,.json"
            onChange={e => e.target.files && handleUpload(e.target.files)}
          />
        </label>
        <p className="text-xs text-muted-foreground mt-2">Supports: .md, .txt, .html, .pdf, .csv, .json</p>
        {uploading && <p className="text-sm text-primary mt-2 flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Uploading...</p>}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Ingest Result */}
      {ingestResult && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-primary" /><p className="text-sm font-medium text-foreground">Ingestion Complete</p></div>
          <p className="text-sm text-muted-foreground">{ingestResult.summary}</p>
          {ingestResult.pagesCreated.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Created: {ingestResult.pagesCreated.join(", ")}</p>
          )}
          {ingestResult.pagesUpdated.length > 0 && (
            <p className="text-xs text-muted-foreground mt-1">Updated: {ingestResult.pagesUpdated.join(", ")}</p>
          )}
        </div>
      )}

      {/* Sources List */}
      <div className="space-y-2">
        {sources.map(source => (
          <div key={source.filename} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">{source.filename}</p>
                <p className="text-xs text-muted-foreground">{formatSize(source.size)} · {source.type}</p>
              </div>
            </div>
            <button
              onClick={() => handleIngest(source.filename)}
              disabled={ingesting === source.filename}
              className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs hover:bg-primary/90 disabled:opacity-50 flex items-center gap-1"
            >
              {ingesting === source.filename ? <><Loader2 className="w-3 h-3 animate-spin" />Ingesting...</> : "Ingest"}
            </button>
          </div>
        ))}
        {sources.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No sources uploaded yet.</p>
        )}
      </div>
    </div>
  );
}
