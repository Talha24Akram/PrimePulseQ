import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-lg border px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
          "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 hover:border-gray-400",
          "dark:border-white/10 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500 dark:hover:border-white/20",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export { Textarea };
