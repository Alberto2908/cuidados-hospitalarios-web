"use client";

import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { useQuery } from "@tanstack/react-query";
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
import { fetchHospitalesPorProvincia } from "@/lib/api/hospitales";
import type { Hospital } from "@/lib/mock/hospitales";
import { cn } from "@/lib/utils";

function normalizarTexto(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function filtrarPorCoincidencia(value: string, search: string) {
  const consulta = normalizarTexto(search).trim();
  if (!consulta) return 1;
  return normalizarTexto(value).includes(consulta) ? 1 : 0;
}

function seleccionarConShiftInicioFin(event: KeyboardEvent<HTMLDivElement>) {
  if (!event.shiftKey || (event.key !== "Home" && event.key !== "End")) {
    return;
  }
  const input = event.target;
  if (!(input instanceof HTMLInputElement)) return;

  event.preventDefault();
  if (event.key === "Home") {
    input.setSelectionRange(0, input.selectionEnd ?? input.value.length);
  } else {
    input.setSelectionRange(input.selectionStart ?? 0, input.value.length);
  }
}

interface Props {
  provincia: string;
  selectedIds: string[];
  onToggle: (hospital: Hospital) => void;
  disabled?: boolean;
}

/**
 * Igual que SelectorHospital pero permite marcar varios hospitales a la vez:
 * el popover no se cierra al elegir uno, y cada opción muestra su propio check.
 */
export default function SelectorHospitalesMultiple({
  provincia,
  selectedIds,
  onToggle,
  disabled,
}: Props) {
  const [open, setOpen] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const listaRef = useRef<HTMLDivElement>(null);
  const { data: options = [], isPending, isError } = useQuery({
    queryKey: ["hospitales", { provincia }],
    queryFn: () => fetchHospitalesPorProvincia(provincia),
    enabled: Boolean(provincia),
  });

  useLayoutEffect(() => {
    listaRef.current?.scrollTo({ top: 0 });
  }, [busqueda]);

  const isDisabled = disabled || !provincia || isPending || isError;
  const seleccionadosEnProvincia = options.filter((h) => selectedIds.includes(h.id)).length;

  let placeholder = "Primero elige una provincia";
  if (provincia && isPending) placeholder = "Cargando hospitales…";
  else if (provincia && isError) placeholder = "No se pudieron cargar los hospitales";
  else if (provincia && seleccionadosEnProvincia > 0) {
    placeholder = `${seleccionadosEnProvincia} hospital${seleccionadosEnProvincia === 1 ? "" : "es"} seleccionado${seleccionadosEnProvincia === 1 ? "" : "s"} en esta provincia`;
  } else if (provincia) placeholder = "Buscar y añadir hospitales…";

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (isDisabled) return;
        setOpen(next);
        if (!next) setBusqueda("");
      }}
    >
      <PopoverTrigger
        type="button"
        disabled={isDisabled}
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-auto min-h-9 w-full justify-between px-3 py-2 font-normal",
          (seleccionadosEnProvincia === 0 || isDisabled) && "text-muted-foreground",
        )}
      >
        <span className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <MapPin className="size-4 shrink-0 opacity-60" />
          <span className="truncate text-sm">{placeholder}</span>
        </span>
        <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-(--anchor-width) max-w-[min(100vw-2rem,28rem)] p-0"
      >
        <Command
          filter={filtrarPorCoincidencia}
          onKeyDown={seleccionarConShiftInicioFin}
        >
          <CommandInput
            placeholder="Nombre, ciudad o dirección…"
            value={busqueda}
            onValueChange={setBusqueda}
          />
          <CommandList ref={listaRef}>
            <CommandEmpty>
              {busqueda.trim()
                ? "Ningún hospital coincide con la búsqueda."
                : "No hay hospitales en esta provincia."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((h) => {
                const marcado = selectedIds.includes(h.id);
                return (
                  <CommandItem
                    key={h.id}
                    value={`${h.nombre} ${h.ciudad} ${h.direccion} ${h.codigoPostal}`}
                    data-checked={marcado || undefined}
                    onSelect={() => onToggle(h)}
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
                        marcado ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
