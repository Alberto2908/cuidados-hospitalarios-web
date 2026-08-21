import { z } from "zod";

/** Solo intervalos de 15 minutos (00, 15, 30, 45). */
const horaRegex = /^([01]\d|2[0-3]):(00|15|30|45)$/;
const optionalDetail = z.string().trim().max(40, "Máximo 40 caracteres");

export const DEFAULT_HORA_DESDE = "09:00";
export const DEFAULT_HORA_HASTA = "21:00";
export const DIA_ENTERO_DESDE = "00:00";
export const DIA_ENTERO_HASTA = "00:00";

export const franjaSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
  horaDesde: z.string().regex(horaRegex, "Usa intervalos de 15 minutos"),
  horaHasta: z.string().regex(horaRegex, "Usa intervalos de 15 minutos"),
  diaEntero: z.boolean(),
});

export const crearAnuncioSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(120, "Máximo 120 caracteres"),
  descripcion: z
    .string()
    .trim()
    .min(20, "Describe un poco más la necesidad (mín. 20 caracteres)")
    .max(1000, "Máximo 1000 caracteres"),
  provincia: z.string().min(1, "Selecciona una provincia"),
  hospitalId: z.string().min(1, "Selecciona un hospital"),
  planta: optionalDetail,
  habitacion: optionalDetail,
  cama: optionalDetail,
  franjas: z
    .array(franjaSchema)
    .min(1, "Selecciona al menos un día en el calendario")
    .superRefine((franjas, ctx) => {
      const byFecha = new Map<string, typeof franjas>();
      for (const f of franjas) {
        const list = byFecha.get(f.fecha) ?? [];
        list.push(f);
        byFecha.set(f.fecha, list);
      }
      for (const [, list] of byFecha) {
        const enteros = list.filter((f) => f.diaEntero);
        if (enteros.length > 0 && list.length > 1) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              "No puedes mezclar «Día entero» con otros turnos el mismo día",
          });
        }
      }
    }),
});

export type CrearAnuncioFormValues = z.infer<typeof crearAnuncioSchema>;
export type FranjaHoraria = z.infer<typeof franjaSchema>;

/** Deriva el turno legado a partir de la primera franja (para listados actuales). */
export function turnoDesdeFranjas(
  franjas: FranjaHoraria[],
): "mañana" | "tarde" | "noche" | "flexible" {
  if (franjas.length === 0) return "flexible";
  if (franjas.some((f) => f.diaEntero)) return "flexible";
  if (franjas.length > 1) {
    const starts = new Set(franjas.map((f) => f.horaDesde.slice(0, 2)));
    if (starts.size > 1) return "flexible";
  }
  const hour = Number(franjas[0].horaDesde.slice(0, 2));
  if (hour >= 6 && hour < 14) return "mañana";
  if (hour >= 14 && hour < 21) return "tarde";
  return "noche";
}
