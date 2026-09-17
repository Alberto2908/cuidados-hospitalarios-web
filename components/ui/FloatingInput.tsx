"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: React.ReactNode;
  rightElement?: React.ReactNode;
  containerClassName?: string;
}

/**
 * Input con label flotante estilo Material: centrado como placeholder cuando
 * está vacío y sin foco, y al enfocar o rellenar sube y se posa sobre el
 * propio borde superior, con un fondo que tapa el trazo del borde detrás.
 */
export const FloatingInput = React.forwardRef<HTMLInputElement, FloatingInputProps>(
  ({ label, id, rightElement, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn("relative", containerClassName)}>
        <input
          ref={ref}
          id={id}
          placeholder=" "
          className={cn(
            "peer w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm text-foreground outline-none ring-ring focus:ring-2 transition-shadow",
            rightElement && "pr-10",
            className
          )}
          {...props}
        />
        <label
          htmlFor={id}
          className={cn(
            "pointer-events-none absolute left-3 top-0 -translate-y-1/2 -translate-x-1 bg-background px-1 text-xs font-normal text-muted-foreground transition-all duration-150",
            "peer-[&:placeholder-shown:not(:focus)]:top-1/2 peer-[&:placeholder-shown:not(:focus)]:translate-x-0 peer-[&:placeholder-shown:not(:focus)]:bg-transparent peer-[&:placeholder-shown:not(:focus)]:px-0 peer-[&:placeholder-shown:not(:focus)]:text-sm"
          )}
        >
          {label}
        </label>
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightElement}
          </div>
        )}
      </div>
    );
  }
);
FloatingInput.displayName = "FloatingInput";
