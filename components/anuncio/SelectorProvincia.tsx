"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, MapPinned } from "lucide-react";
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
import { listProvincias } from "@/lib/mock/hospitales";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (provincia: string) => void;
  error?: boolean;
}

export default function SelectorProvincia({ value, onChange, error }: Props) {
  const [open, setOpen] = useState(false);
  const provincias = useMemo(() => listProvincias(), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        type="button"
        aria-expanded={open}
        aria-invalid={error || undefined}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-full justify-between px-3 font-normal",
          !value && "text-muted-foreground",
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <MapPinned className="size-4 shrink-0 opacity-60" />
          <span className="truncate text-sm">
            {value || "Seleccionar provincia…"}
          </span>
        </span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--anchor-width) max-w-[min(100vw-2rem,28rem)] p-0"
      >
        <Command>
          <CommandInput placeholder="Buscar provincia…" />
          <CommandList>
            <CommandEmpty>No hay provincias con ese criterio.</CommandEmpty>
            <CommandGroup>
              {provincias.map((p) => (
                <CommandItem
                  key={p}
                  value={p}
                  data-checked={value === p || undefined}
                  onSelect={() => {
                    onChange(p);
                    setOpen(false);
                  }}
                >
                  <span className="flex-1 truncate font-medium">{p}</span>
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      value === p ? "opacity-100" : "opacity-0",
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
