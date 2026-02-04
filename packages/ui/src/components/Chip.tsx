import * as React from "react";
import { cn } from "../lib/utils";

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {}

export function Chip({ className, ...props }: ChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface-elev px-2.5 py-1 text-xs text-text-muted",
        className
      )}
      {...props}
    />
  );
}
