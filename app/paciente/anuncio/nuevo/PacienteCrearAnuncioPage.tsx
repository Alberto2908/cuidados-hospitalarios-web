"use client";

import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Lock } from "lucide-react";
import { sileo } from "sileo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CalendarioDiasAnuncio from "@/components/anuncio/CalendarioDiasAnuncio";
import FormSection from "@/components/anuncio/FormSection";
import FranjasPorDia from "@/components/anuncio/FranjasPorDia";
import SelectorHospital from "@/components/anuncio/SelectorHospital";
import SelectorProvincia from "@/components/anuncio/SelectorProvincia";
import {
  crearAnuncioSchema,
  turnoDesdeFranjas,
  type CrearAnuncioFormValues,
} from "@/lib/anuncio/schema";
import { MOCK_ANUNCIOS } from "@/lib/mock/anuncios";

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
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CrearAnuncioFormValues>({
    resolver: zodResolver(crearAnuncioSchema),
    defaultValues,
    mode: "onSubmit",
  });

  const franjas = watch("franjas");
  const provincia = watch("provincia");
  const hospitalId = watch("hospitalId");
  const titulo = watch("titulo");
  const canSubmit =
    Boolean(titulo?.trim()) &&
    Boolean(provincia) &&
    Boolean(hospitalId) &&
    franjas.length > 0;

  function onSubmit(values: CrearAnuncioFormValues) {
    const id = `a${Date.now()}`;
    MOCK_ANUNCIOS.unshift({
      id,
      hospitalId: values.hospitalId,
      titulo: values.titulo.trim(),
      descripcion: values.descripcion.trim(),
      pacienteNombre: "Tú",
      necesidades: [],
      turno: turnoDesdeFranjas(values.franjas),
      fechaPublicacion: format(new Date(), "yyyy-MM-dd"),
      estado: "activo",
      franjas: values.franjas,
      planta: values.planta.trim() || undefined,
      habitacion: values.habitacion.trim() || undefined,
      cama: values.cama.trim() || undefined,
    });

    sileo.success({
      title: "Anuncio publicado",
      description: "Los cuidadores ya pueden ver tu solicitud.",
    });

    router.push("/cuidador/buscar");
  }

  function onInvalid() {
    sileo.error({
      title: "Revisa el formulario",
      description: "Faltan datos obligatorios o hay algún error.",
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Crear anuncio</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Indica qué necesitas, dónde y en qué días y horarios.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="flex flex-col gap-6"
        noValidate
      >
        <div className="grid gap-6 lg:grid-cols-2 lg:items-stretch">
          <FormSection
            step={1}
            title="Qué necesitas"
            description="Un título claro ayuda a que te encuentren antes."
            fill
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="grid shrink-0 gap-1.5">
                <Label htmlFor="titulo">Título</Label>
                <Input
                  id="titulo"
                  placeholder="Ej. Cuidado nocturno en planta de geriatría"
                  aria-invalid={Boolean(errors.titulo) || undefined}
                  {...register("titulo")}
                />
                {errors.titulo ? (
                  <p className="text-xs text-destructive">
                    {errors.titulo.message}
                  </p>
                ) : null}
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-1.5">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Cuenta la situación, el tipo de apoyo y cualquier detalle útil para el cuidador."
                  aria-invalid={Boolean(errors.descripcion) || undefined}
                  className="field-sizing-fixed min-h-40 flex-1 resize-none"
                  {...register("descripcion")}
                />
                {errors.descripcion ? (
                  <p className="text-xs text-destructive">
                    {errors.descripcion.message}
                  </p>
                ) : null}
              </div>
            </div>
          </FormSection>

          <FormSection
            step={2}
            title="Dónde"
            description="Provincia, hospital y detalle privado opcional."
            fill
          >
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-1.5">
                  <Label>Provincia</Label>
                  <Controller
                    control={control}
                    name="provincia"
                    render={({ field }) => (
                      <SelectorProvincia
                        value={field.value}
                        error={Boolean(errors.provincia)}
                        onChange={(next) => {
                          field.onChange(next);
                          setValue("hospitalId", "");
                        }}
                      />
                    )}
                  />
                  {errors.provincia ? (
                    <p className="text-xs text-destructive">
                      {errors.provincia.message}
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-1.5 sm:col-span-2">
                  <Label>Hospital</Label>
                  <Controller
                    control={control}
                    name="hospitalId"
                    render={({ field }) => (
                      <SelectorHospital
                        value={field.value}
                        provincia={provincia}
                        onChange={field.onChange}
                        error={Boolean(errors.hospitalId)}
                      />
                    )}
                  />
                  {errors.hospitalId ? (
                    <p className="text-xs text-destructive">
                      {errors.hospitalId.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="rounded-xl border border-dashed border-border bg-muted/40 p-4">
                <div className="mb-3 flex gap-2.5">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                    <Lock className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Ubicación exacta (opcional y privada)
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                      Planta, habitación y cama son datos sensibles. No se
                      muestran en el anuncio público: el cuidador solo los verá
                      cuando aceptes su candidatura.
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="planta">Planta</Label>
                    <Input
                      id="planta"
                      placeholder="Ej. 3"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.planta) || undefined}
                      {...register("planta")}
                    />
                    {errors.planta ? (
                      <p className="text-xs text-destructive">
                        {errors.planta.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="habitacion">Habitación</Label>
                    <Input
                      id="habitacion"
                      placeholder="Ej. 312"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.habitacion) || undefined}
                      {...register("habitacion")}
                    />
                    {errors.habitacion ? (
                      <p className="text-xs text-destructive">
                        {errors.habitacion.message}
                      </p>
                    ) : null}
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="cama">Cama</Label>
                    <Input
                      id="cama"
                      placeholder="Ej. A"
                      autoComplete="off"
                      aria-invalid={Boolean(errors.cama) || undefined}
                      {...register("cama")}
                    />
                    {errors.cama ? (
                      <p className="text-xs text-destructive">
                        {errors.cama.message}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </FormSection>
        </div>

        <FormSection
          step={3}
          title="Cuándo"
          description="Marca los días y define uno o varios turnos por día (pasos de 15 min). Si la hora de fin es anterior o igual a la de inicio, cruza medianoche."
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch">
            <Controller
              control={control}
              name="franjas"
              render={({ field }) => (
                <CalendarioDiasAnuncio
                  franjas={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <div className="flex min-h-0 min-w-0 flex-1 flex-col">
              <Controller
                control={control}
                name="franjas"
                render={({ field }) => (
                  <FranjasPorDia
                    franjas={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.franjas ? (
                <p className="mt-2 text-xs text-destructive">
                  {errors.franjas.message ??
                    (errors.franjas as { root?: { message?: string } }).root
                      ?.message}
                </p>
              ) : null}
            </div>
          </div>
        </FormSection>

        <div className="flex justify-center pt-2">
          <Button
            type="submit"
            size="lg"
            className="min-w-48"
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? "Publicando…" : "Publicar anuncio"}
          </Button>
        </div>
      </form>
    </div>
  );
}
