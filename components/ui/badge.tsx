import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-black uppercase tracking-[0.16em] transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400",
  {
    variants: {
      variant: {
        default: "border-transparent bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-950",
        secondary: "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        destructive: "border-transparent bg-red-600 text-white",
        outline: "border-slate-200 text-slate-700 dark:border-slate-700 dark:text-slate-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
