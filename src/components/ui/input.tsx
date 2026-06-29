import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border px-3 py-2 text-sm transition-all duration-200 focus:outline-none focus:ring-[3px] focus:ring-violet-500/20 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50",
          "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 hover:border-gray-400 shadow-sm",
          "dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-white/20 dark:shadow-none",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
