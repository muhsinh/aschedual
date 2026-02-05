import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-panel p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-white/15",
        className
      )}
      {...props}
    />
  );
}
