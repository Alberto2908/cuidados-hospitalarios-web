"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Clock } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/** Intervalo de 15 minutos: 00:00 … 23:45 */
function buildHoras(stepMinutes = 15): string[] {
  const horas: string[] = [];
  for (let m = 0; m < 24 * 60; m += stepMinutes) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    horas.push(`${hh}:${mm}`);
  }
  return horas;
}

const HORAS = buildHoras(15);

interface Props {
  id?: string;
  value: string;
  onChange: (hora: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export default function SelectorHora({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Hora",
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-29 justify-between px-2.5 font-normal tabular-nums",
          !value && "text-muted-foreground",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Clock className="size-3.5 shrink-0 opacity-60" />
          <span className="text-sm">{value || placeholder}</span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-40 p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar hora…" className="h-9" />
          <CommandList className="max-h-56">
            <CommandEmpty>Sin coincidencias</CommandEmpty>
            <CommandGroup>
              {HORAS.map((hora) => (
                <CommandItem
                  key={hora}
                  value={hora}
                  onSelect={() => {
                    onChange(hora);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 size-4",
                      value === hora ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="tabular-nums">{hora}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
