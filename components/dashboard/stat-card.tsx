import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-4">
        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800", color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className={cn("text-lg font-semibold leading-tight", color)}>{value}</p>
          <p className="text-xs leading-tight text-slate-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
