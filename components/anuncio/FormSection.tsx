import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FormSectionProps {
  step: number;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  /** El cuerpo crece para igualar altura en layouts side-by-side. */
  fill?: boolean;
}

export default function FormSection({
  step,
  title,
  description,
  children,
  className,
  fill = false,
}: FormSectionProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6",
        fill && "flex h-full min-h-0 flex-col",
        className,
      )}
    >
      <header className="mb-5 flex shrink-0 items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-foreground text-xs font-bold text-background">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold leading-snug text-foreground">
            {title}
          </h2>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {description}
          </p>
        </div>
      </header>

      <div className={cn(fill && "flex min-h-0 flex-1 flex-col")}>{children}</div>
    </section>
  );
}
