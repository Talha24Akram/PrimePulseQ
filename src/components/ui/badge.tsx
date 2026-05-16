import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
        secondary: "border-gray-200 bg-gray-100 text-gray-600 dark:border-white/10 dark:bg-white/8 dark:text-gray-300",
        destructive: "border-red-200 bg-red-100 text-red-600 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-400",
        success: "border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400",
        warning: "border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400",
        outline: "border-gray-300 text-gray-600 dark:border-white/15 dark:text-gray-300",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
