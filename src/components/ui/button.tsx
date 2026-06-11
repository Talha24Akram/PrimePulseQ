import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-md shadow-violet-600/25 hover:shadow-lg hover:shadow-violet-600/35 hover:from-violet-400 hover:to-violet-600 dark:shadow-violet-900/50",
        destructive:
          "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 dark:hover:bg-red-500/30",
        outline:
          "border border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 text-gray-700 shadow-sm dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10 dark:hover:border-white/20 dark:text-gray-200 dark:shadow-none",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 dark:bg-white/8 dark:text-gray-200 dark:hover:bg-white/12 dark:border-white/8",
        ghost:
          "hover:bg-gray-100 text-gray-600 hover:text-gray-900 dark:hover:bg-white/8 dark:text-gray-300 dark:hover:text-gray-100",
        link: "text-violet-600 underline-offset-4 hover:underline hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-xl px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
