"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
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
import {
  hospitalesByProvincia,
  type Hospital,
} from "@/lib/mock/hospitales";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (hospitalId: string) => void;
  provincia: string;
  hospitals?: Hospital[];
  error?: boolean;
  disabled?: boolean;
}

export default function SelectorHospital({
  value,
  onChange,
  provincia,
  hospitals,
  error,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () => hospitals ?? hospitalesByProvincia(provincia),
    [hospitals, provincia],
  );

  const selected = useMemo(
    () => options.find((h) => h.id === value) ?? null,
    [options, value],
  );

  const isDisabled = disabled || !provincia;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (isDisabled) return;
        setOpen(next);
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={isDisabled}
        aria-expanded={open}
        aria-invalid={error || undefined}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-auto min-h-9 w-full justify-between px-3 py-2 font-normal",
          (!selected || isDisabled) && "text-muted-foreground",
        )}
      >
        <span className="flex min-w-0 flex-1 items-start gap-2 text-left">
          <MapPin className="mt-0.5 size-4 shrink-0 opacity-60" />
          {selected ? (
            <span className="min-w-0">
              <span className="block truncate text-sm text-foreground">
                {selected.nombre}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {selected.direccion}, {selected.ciudad}
              </span>
            </span>
          ) : (
            <span className="text-sm">
              {provincia
                ? "Buscar hospital…"
                : "Primero elige una provincia"}
            </span>
          )}
        </span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--anchor-width) max-w-[min(100vw-2rem,28rem)] p-0"
      >
        <Command>
          <CommandInput placeholder="Nombre, ciudad o dirección…" />
          <CommandList>
            <CommandEmpty>No hay hospitales en esta provincia.</CommandEmpty>
            <CommandGroup>
              {options.map((h) => (
                <CommandItem
                  key={h.id}
                  value={`${h.nombre} ${h.ciudad} ${h.direccion} ${h.codigoPostal}`}
                  data-checked={value === h.id || undefined}
                  onSelect={() => {
                    onChange(h.id);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {h.nombre}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {h.direccion}, {h.ciudad} ({h.codigoPostal})
                    </span>
                  </span>
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === h.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
