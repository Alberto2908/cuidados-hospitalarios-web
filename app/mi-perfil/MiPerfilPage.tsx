"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import PerfilCuidadorVista from "@/components/perfil/PerfilCuidadorVista";
import PerfilPacienteVista from "@/components/perfil/PerfilPacienteVista";

/**
 * "Mi perfil": la misma vista pública que ve el resto de usuarios de mí,
 * según mi rol. Editar los datos personales sigue en /perfil.
 */
export default function MiPerfilPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
    // El admin no tiene perfil público.
    if (user?.rol === "ADMIN") router.replace("/admin/dashboard");
  }, [isLoading, user, router]);

  if (isLoading || !user || user.rol === "ADMIN") return null;

  const editar = (
    <Link
      href="/perfil"
      className="flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
    >
      <Pencil className="h-3.5 w-3.5" />
      Editar mis datos
    </Link>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">Mi perfil</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">Así te ven el resto de usuarios.</p>
      </div>

      {user.rol === "CUIDADOR" ? (
        <PerfilCuidadorVista cuidadorId={user.id} accion={editar} columnas />
      ) : (
        <PerfilPacienteVista pacienteId={user.id} accion={editar} />
      )}
    </div>
  );
}
