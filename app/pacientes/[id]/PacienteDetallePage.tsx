"use client";

import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PerfilPacienteVista from "@/components/perfil/PerfilPacienteVista";

export default function PacienteDetallePage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();

  return (
    <div className="page-container py-8">
      <button
        type="button"
        onClick={() => router.back()}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>

      <PerfilPacienteVista pacienteId={params.id} />
    </div>
  );
}
