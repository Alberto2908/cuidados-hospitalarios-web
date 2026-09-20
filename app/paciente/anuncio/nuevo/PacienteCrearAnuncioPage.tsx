"use client";

import AnuncioFormulario from "@/components/anuncio/AnuncioFormulario";
import type { CrearAnuncioFormValues } from "@/lib/anuncio/schema";

const defaultValues: CrearAnuncioFormValues = {
  titulo: "",
  descripcion: "",
  provincia: "",
  hospitalId: "",
  planta: "",
  habitacion: "",
  cama: "",
  franjas: [],
};

export default function PacienteCrearAnuncioPage() {
  return <AnuncioFormulario modo="crear" valoresIniciales={defaultValues} />;
}
