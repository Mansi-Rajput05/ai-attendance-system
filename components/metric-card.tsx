import { LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

type MetricCardProps = {
  title: string;
  value: string | number;
  detail: string;
  icon: LucideIcon;
};

export function MetricCard({ title, value, detail, icon: Icon }: MetricCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight">{value}</p>
          </div>
          <span className="rounded-2xl bg-slate-100 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            <Icon className="h-6 w-6" />
          </span>
        </div>
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{detail}</p>
      </CardContent>
    </Card>
  );
}
