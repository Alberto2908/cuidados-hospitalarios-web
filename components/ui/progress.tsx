"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"

import { cn } from "@/lib/utils"

interface ProgressProps extends ProgressPrimitive.Root.Props {
  /** Color CSS del indicador (p.ej. para degradados rojo->verde según el valor). Por defecto, emerald-500. */
  indicatorColor?: string
}

function Progress({ className, value, indicatorColor, ...props }: ProgressProps) {
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      className={cn("flex w-full flex-col gap-1", className)}
      {...props}
    >
      <ProgressPrimitive.Track
        data-slot="progress-track"
        className="relative h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <ProgressPrimitive.Indicator
          data-slot="progress-indicator"
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: value == null ? undefined : `${value}%`,
            backgroundColor: indicatorColor ?? "#10b981",
          }}
        />
      </ProgressPrimitive.Track>
    </ProgressPrimitive.Root>
  )
}

export { Progress }
