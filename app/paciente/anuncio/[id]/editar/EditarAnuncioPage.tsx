"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { sileo } from "sileo";
import { useAuth } from "@/lib/auth/AuthContext";
import AnuncioFormulario from "@/components/anuncio/AnuncioFormulario";
import { obtenerAnuncio } from "@/lib/api/anuncios";
import type { CrearAnuncioFormValues } from "@/lib/anuncio/schema";

export default function EditarAnuncioPage() {
  const params = useParams<{ id: string }>();
  const anuncioId = params.id;
  const router = useRouter();
  const { user } = useAuth();

  const anuncioQuery = useQuery({
    queryKey: ["anuncio", anuncioId],
    queryFn: () => obtenerAnuncio(anuncioId),
  });

  const anuncio = anuncioQuery.data;
  const esAutor = Boolean(user && anuncio && user.id === anuncio.usuarioId);
  const puedeEditar = esAutor && anuncio?.estado === "activo";

  useEffect(() => {
    if (!anuncio) return;
    if (!puedeEditar) {
      sileo.error({
        title: "No se puede modificar",
        description: !esAutor
          ? "Solo el autor puede modificar este anuncio."
          : "Solo se puede modificar un anuncio activo.",
      });
      router.replace(`/paciente/anuncio/${anuncioId}`);
    }
  }, [anuncio, esAutor, puedeEditar, anuncioId, router]);

  if (anuncioQuery.isLoading || !anuncio || !puedeEditar) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center text-sm text-muted-foreground">
        Cargando anuncio…
      </div>
    );
  }

  const valoresIniciales: CrearAnuncioFormValues = {
    titulo: anuncio.titulo,
    descripcion: anuncio.descripcion,
    provincia: anuncio.hospital.provincia,
    hospitalId: anuncio.hospital.id,
    planta: anuncio.planta ?? "",
    habitacion: anuncio.habitacion ?? "",
    cama: anuncio.cama ?? "",
    franjas: anuncio.franjas ?? [],
  };

  return <AnuncioFormulario modo="editar" anuncioId={anuncioId} valoresIniciales={valoresIniciales} />;
}
