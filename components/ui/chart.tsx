"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";

import { cn } from "@/lib/utils";

export type ChartConfig = {
  [key: string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);

  if (!context) {
    throw new Error("useChart must be used within a ChartContainer");
  }

  return context;
}

export function ChartContainer({
  id,
  className,
  children,
  config,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}) {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-slate-500 [&_.recharts-grid_line]:stroke-slate-200 dark:[&_.recharts-cartesian-axis-tick_text]:fill-slate-400 dark:[&_.recharts-grid_line]:stroke-slate-800",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
  const colorConfig = Object.entries(config).filter(([, itemConfig]) => itemConfig.color);

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: colorConfig
          .map(([key, itemConfig]) => `[data-chart=${id}] { --color-${key}: ${itemConfig.color}; }`)
          .join("\n"),
      }}
    />
  );
}

type ChartTooltipContentProps = {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string | number;
    value?: string | number;
    color?: string;
  }>;
  label?: string | number;
};

export function ChartTooltipContent({ active, payload, label }: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <p className="mb-2 font-semibold text-slate-950 dark:text-slate-100">{label}</p>
      <div className="space-y-1">
        {payload.map((item) => {
          const key = String(item.dataKey ?? item.name ?? "value");
          const labelText = config[key]?.label ?? item.name ?? key;

          return (
            <div className="flex items-center justify-between gap-6" key={key}>
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
                <span>{labelText}</span>
              </div>
              <span className="font-semibold text-slate-950 dark:text-slate-100">{item.value}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
