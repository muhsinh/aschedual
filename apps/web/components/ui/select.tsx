import * as React from "react";
import { cn } from "@/lib/utils";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-10 w-full rounded-xl border border-border bg-panel2 px-3 text-sm text-foreground focus:border-irish focus:outline-none",
      className
    )}
    {...props}
  >
    {children}
  </select>
));

Select.displayName = "Select";
