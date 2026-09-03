import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 py-12 text-center dark:border-slate-700">
      <Icon className="h-10 w-10 text-slate-300 dark:text-slate-600" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
      {description && <p className="max-w-sm text-xs text-slate-400">{description}</p>}
      {action}
    </div>
  );
}
