"use client";

import { useState } from "react";
import { UserCheck, Users } from "lucide-react";
import { SegmentedControl } from "@/components/ui/segmented-control";
import AdminCuidadoresPage from "../cuidadores/AdminCuidadoresPage";
import AdminPacientesPage from "../pacientes/AdminPacientesPage";

export type TipoUsuarioAdmin = "cuidadores" | "pacientes";

/**
 * Cuidadores y pacientes en una sola pantalla con un selector deslizante. El
 * cambio es instantaneo (no navega: las dos listas se piden con React Query y
 * quedan en cache) y el tipo elegido se guarda en la URL (?tipo=...) para que
 * "Volver" desde un detalle regrese a la lista que se estaba viendo.
 */
export default function AdminUsuariosPage({ tipoInicial }: { tipoInicial: TipoUsuarioAdmin }) {
  const [tipo, setTipo] = useState<TipoUsuarioAdmin>(tipoInicial);

  function cambiarTipo(nuevo: TipoUsuarioAdmin) {
    setTipo(nuevo);
    window.history.replaceState(null, "", `/admin/usuarios?tipo=${nuevo}`);
  }

  return (
    <div className="page-container py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Gestionar usuarios</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Cuentas de cuidadores y de pacientes registradas en la plataforma.
          </p>
        </div>
        <SegmentedControl
          ariaLabel="Tipo de usuario"
          value={tipo}
          onChange={cambiarTipo}
          options={[
            { value: "cuidadores", label: "Cuidadores", icon: <UserCheck className="h-4 w-4" /> },
            { value: "pacientes", label: "Pacientes", icon: <Users className="h-4 w-4" /> },
          ]}
        />
      </div>

      <div key={tipo} className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        {tipo === "cuidadores" ? <AdminCuidadoresPage /> : <AdminPacientesPage />}
      </div>
    </div>
  );
}
