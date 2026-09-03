import { cn } from "@/lib/utils";

export function Progress({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  const color =
    clamped >= 100
      ? "bg-emerald-500"
      : clamped >= 60
      ? "bg-sky-500"
      : clamped >= 30
      ? "bg-amber-500"
      : "bg-red-500";
  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800", className)}>
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${clamped}%` }} />
    </div>
  );
}
