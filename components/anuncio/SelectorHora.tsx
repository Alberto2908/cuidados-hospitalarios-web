"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronsUpDown, Clock, Moon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { AccionContinuar, OpcionHora } from "@/lib/anuncio/turnos";

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

const HORAS: OpcionHora[] = buildHoras(15).map((hora) => ({ hora }));

/** Deja la lista centrada en la hora elegida (si no, siempre arrancaria en las 00:00). */
function centrarEnSeleccion(lista: HTMLElement | null, hora: string) {
  if (!lista || !hora) return;
  const item = lista.querySelector<HTMLElement>(`[data-hora="${hora}"]`);
  if (!item) return;
  const arriba = item.getBoundingClientRect().top - lista.getBoundingClientRect().top + lista.scrollTop;
  lista.scrollTop = arriba - (lista.clientHeight - item.offsetHeight) / 2;
}

interface Props {
  id?: string;
  value: string;
  onChange: (hora: string) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Lista de horas a mostrar (con etiqueta y/o deshabilitadas). Por defecto, 00:00 … 23:45. */
  opciones?: OpcionHora[];
  /** Entrada al final de la lista (p. ej. "Continuar el 19 oct"). */
  accionExtra?: AccionContinuar & { onSelect: () => void };
}

export default function SelectorHora({
  id,
  value,
  onChange,
  disabled = false,
  placeholder = "Hora",
  opciones = HORAS,
  accionExtra,
}: Props) {
  const [open, setOpen] = useState(false);
  const listaRef = useRef<HTMLDivElement>(null);

  // Solo al abrir: centrar al repetirse (p. ej. al mover el raton) impediria
  // desplazarse por la lista. Value solo cambia al elegir, que cierra el desplegable.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => centrarEnSeleccion(listaRef.current, value));
    return () => cancelAnimationFrame(frame);
  }, [open, value]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-29 justify-between border-0 bg-accent px-2.5 font-normal tabular-nums text-accent-foreground shadow-soft hover:bg-accent/70 hover:shadow-float aria-expanded:bg-accent aria-expanded:text-accent-foreground",
          !value && "text-muted-foreground",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <Clock className="size-3.5 shrink-0 opacity-60" />
          <span className="text-sm">{value || placeholder}</span>
        </span>
        <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command defaultValue={value}>
          <CommandInput placeholder="Buscar hora…" className="h-9" />
          <CommandList className="max-h-56" ref={listaRef}>
            <CommandEmpty>Sin coincidencias</CommandEmpty>
            <CommandGroup>
              {opciones.map(({ hora, deshabilitada }) => (
                <CommandItem
                  key={hora}
                  value={hora}
                  data-hora={hora}
                  disabled={deshabilitada}
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
            {accionExtra ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="continuar dia siguiente"
                    disabled={accionExtra.deshabilitada}
                    onSelect={() => {
                      accionExtra.onSelect();
                      setOpen(false);
                    }}
                  >
                    <Moon
                      className={cn("mr-2 size-4", accionExtra.marcada ? "text-primary" : "opacity-60")}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="whitespace-nowrap">{accionExtra.etiqueta}</span>
                      {accionExtra.motivo ? (
                        <span className="text-[11px] text-muted-foreground">{accionExtra.motivo}</span>
                      ) : null}
                    </span>
                    {accionExtra.marcada ? <Check className="ml-auto size-4" /> : null}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
