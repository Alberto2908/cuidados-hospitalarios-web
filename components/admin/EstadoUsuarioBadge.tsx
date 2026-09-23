import type { EstadoUsuario } from "@/lib/api/admin";

const ESTADO_STYLES: Record<EstadoUsuario, string> = {
  activo: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pendiente: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  suspendido: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  baja: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

export const ESTADO_USUARIO_LABEL: Record<EstadoUsuario, string> = {
  activo: "Activo",
  pendiente: "Pendiente",
  suspendido: "Suspendido",
  baja: "De baja",
};

export default function EstadoUsuarioBadge({ estado, className }: { estado: EstadoUsuario; className?: string }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${ESTADO_STYLES[estado]} ${className ?? ""}`}>
      {ESTADO_USUARIO_LABEL[estado]}
    </span>
  );
}
