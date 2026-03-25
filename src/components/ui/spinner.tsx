import React from "react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.ComponentProps<"div"> {
  size?: number; // e.g. 16, 24, 32
  invert?: boolean;
  disabled?: boolean;
}

export function Spinner({ size = 16, invert, disabled, className, ...props }: SpinnerProps) {
  if (disabled) return null;

  const barWidth = size * 0.2;
  const barHeight = size * 0.075;

  return (
    <div className={cn("relative text-white", className)} style={{ width: size, height: size }} {...props}>
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="absolute inset-0 flex animate-spin justify-center"
          style={{
            animationDelay: `${i * 100}ms`,
          }}
        >
          <div
            suppressHydrationWarning
            className={cn("rounded-full bg-current", invert && "text-white")}
            style={{
              width: barWidth,
              height: barHeight,
            }}
          />
        </div>
      ))}
    </div>
  );
}
