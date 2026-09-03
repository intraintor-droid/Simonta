"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FileText, Upload, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/utils";
import type { WorkDocument } from "@/types";

function formatSize(bytes: number | null) {
  if (!bytes) return "-";
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function DocumentUploader({
  workId,
  initialDocuments,
}: {
  workId: string;
  initialDocuments: WorkDocument[];
}) {
  const router = useRouter();
  const [documents, setDocuments] = useState(initialDocuments);
  const [uploading, setUploading] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/works/${workId}/documents`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal mengunggah dokumen");
      setDocuments((prev) => [json.data, ...prev]);
      toast.success("Dokumen berhasil diunggah");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah dokumen");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleDownload(docId: string) {
    try {
      const res = await fetch(`/api/works/${workId}/documents/${docId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal membuat tautan unduhan");
      window.open(json.url, "_blank");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunduh dokumen");
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-md border border-dashed border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800">
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {uploading ? "Mengunggah..." : "Unggah Dokumen"}
        <input
          type="file"
          className="hidden"
          disabled={uploading}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
          onChange={handleFileChange}
        />
      </label>
      <p className="text-xs text-slate-400">Format: PDF, DOC(X), XLS(X), JPG, PNG. Maks 10MB.</p>

      {documents.length === 0 ? (
        <EmptyState icon={FileText} title="Belum ada dokumen" />
      ) : (
        <ul className="flex flex-col divide-y divide-slate-100 rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="overflow-hidden">
                  <p className="truncate font-medium">{doc.file_name}</p>
                  <p className="text-xs text-slate-400">
                    {formatSize(doc.file_size)} · {formatDate(doc.created_at)}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => handleDownload(doc.id)}>
                <Download className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
