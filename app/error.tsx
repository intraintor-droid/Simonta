"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Jangan tampilkan stack trace ke user; cukup log ke console/observability.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <AlertTriangle className="h-12 w-12 text-red-500" />
      <h1 className="text-2xl font-semibold">500 — Terjadi Kesalahan</h1>
      <p className="max-w-sm text-sm text-slate-500">
        Terjadi kesalahan pada server. Tim teknis telah diberi tahu. Silakan coba lagi.
      </p>
      <Button onClick={() => reset()}>Coba lagi</Button>
    </div>
  );
}
