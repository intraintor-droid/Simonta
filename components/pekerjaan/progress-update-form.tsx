"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { WORK_STATUS_LABEL, type WorkStatus } from "@/types";
import { updateWorkProgress } from "@/app/(app)/pekerjaan/actions";

export function ProgressUpdateForm({
  workId,
  currentProgress,
  currentStatus,
}: {
  workId: string;
  currentProgress: number;
  currentStatus: WorkStatus;
}) {
  const router = useRouter();
  const [progress, setProgress] = useState(currentProgress);
  const [status, setStatus] = useState<WorkStatus>(currentStatus);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateWorkProgress(workId, { progress, status, notes });
      toast.success("Progress berhasil diperbarui");
      setNotes("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui progress");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="progress-input">Progress (%)</Label>
          <Input
            id="progress-input"
            type="number"
            min={0}
            max={100}
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="status-input">Status</Label>
          <select
            id="status-input"
            className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm dark:border-slate-700 dark:bg-slate-900"
            value={status}
            onChange={(e) => setStatus(e.target.value as WorkStatus)}
          >
            {Object.entries(WORK_STATUS_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="notes-input">Catatan / Update</Label>
        <Textarea
          id="notes-input"
          placeholder="Ceritakan progress terbaru..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={submitting} className="self-end">
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan Update
      </Button>
    </form>
  );
}
