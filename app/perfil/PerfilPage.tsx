"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { useAuth, type AuthUser } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import type { ActualizarPerfilDatos, TipoDocumento } from "@/lib/auth/api";
import type { Hospital } from "@/lib/mock/hospitales";
import SelectorProvincia from "@/components/anuncio/SelectorProvincia";
import SelectorHospitalesMultiple from "@/components/perfil/SelectorHospitalesMultiple";
import { User, Stethoscope, ShieldCheck, AlertTriangle, Lock, Building2, X, Euro } from "lucide-react";
import { Progress } from "@/components/ui/progress";

const TIPOS_DOCUMENTO: TipoDocumento[] = ["DNI", "NIE", "NIF"];

export default function PerfilPage() {
  const { user, isLoading, isAuthenticated, sincronizarStripe } = useAuth();
  const router = useRouter();
  const sincronizado = useRef(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (user?.rol === "CUIDADOR" && !sincronizado.current) {
      sincronizado.current = true;
      sincronizarStripe().catch(() => {});
    }
  }, [user?.rol, sincronizarStripe]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Cargando tu perfil...
      </div>
    );
  }

  return <PerfilContenido user={user} />;
}

function PerfilContenido({ user }: { user: AuthUser }) {
  const { actualizarPerfil, convertirseCuidador, obtenerStripeOnboardingLink } = useAuth();

  const [nombre, setNombre] = useState(user.nombre);
  const [apellidos, setApellidos] = useState(user.apellidos);
  const [telefono, setTelefono] = useState(user.telefono ?? "");
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>(user.tipoDocumento ?? "DNI");
  const [numeroDocumento, setNumeroDocumento] = useState(user.numeroDocumento ?? "");

  const [guardando, setGuardando] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [verificando, setVerificando] = useState(false);

  const documentoBloqueado = user.documentoVerificado;

  async function handleGuardarDatos(e: React.FormEvent) {
    e.preventDefault();

    if (!nombre.trim() || !apellidos.trim()) {
      sileo.error({ title: "Faltan datos", description: "Nombre y apellidos son obligatorios." });
      return;
    }

    const datos: ActualizarPerfilDatos = {
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      telefono: telefono.trim() || undefined,
    };
    if (numeroDocumento.trim() && !documentoBloqueado) {
      datos.tipoDocumento = tipoDocumento;
      datos.numeroDocumento = numeroDocumento.trim();
    }

    setGuardando(true);
    try {
      const actualizado = await actualizarPerfil(datos);
      setNombre(actualizado.nombre);
      setApellidos(actualizado.apellidos);
      setTelefono(actualizado.telefono ?? "");
      setTipoDocumento(actualizado.tipoDocumento ?? "DNI");
      setNumeroDocumento(actualizado.numeroDocumento ?? "");
      sileo.success({ title: "Cambios guardados", description: "Tus datos personales se han actualizado." });
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se han podido guardar los cambios.";
      sileo.error({ title: "No se ha podido guardar", description: mensaje });
    } finally {
      setGuardando(false);
    }
  }

  async function handleConvertirse() {
    setConvirtiendo(true);
    try {
      await convertirseCuidador();
      sileo.success({
        title: "Ya eres cuidador",
        description: "Ya puedes indicar en que hospitales trabajas y configurar tus datos de cobro.",
      });
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se ha podido completar el alta como cuidador.";
      sileo.error({ title: "No se ha podido completar", description: mensaje });
    } finally {
      setConvirtiendo(false);
    }
  }

  async function handleVerificarStripe() {
    setVerificando(true);
    try {
      const { url } = await obtenerStripeOnboardingLink();
      window.location.href = url;
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se ha podido iniciar la verificación de pago.";
      sileo.error({ title: "No se ha podido continuar", description: mensaje });
      setVerificando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
            {user.nombre[0]}
            {user.apellidos[0]}
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-[-0.03em] text-foreground">
              {user.nombre} {user.apellidos}
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        {user.rol === "CUIDADOR" && (
          <div className="w-80 shrink-0">
            <SeccionCompletitud user={user} />
          </div>
        )}
      </div>

      {/* Datos personales */}
      <div className="rounded-2xl bg-card p-6 shadow-float">
        <div className="mb-4 flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-accent-foreground" />
          <h2 className="text-lg font-semibold">Datos personales</h2>
        </div>

        <form onSubmit={handleGuardarDatos} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="nombre" className="text-sm font-medium text-foreground">Nombre</label>
              <input
                id="nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground shadow-soft outline-none ring-ring transition-shadow focus:ring-2"
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="apellidos" className="text-sm font-medium text-foreground">Apellidos</label>
              <input
                id="apellidos"
                type="text"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                className="h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground shadow-soft outline-none ring-ring transition-shadow focus:ring-2"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="telefono" className="text-sm font-medium text-foreground">
              Teléfono <span className="text-muted-foreground">(opcional)</span>
            </label>
            <input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+34 600 000 000"
              className="h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none ring-ring transition-shadow focus:ring-2"
            />
          </div>

          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              Documento de identidad
              {documentoBloqueado && (
                <span className="flex items-center gap-1 text-xs font-normal text-muted-foreground">
                  <Lock className="h-3 w-3" /> verificado, no se puede modificar
                </span>
              )}
            </label>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[140px_1fr]">
              <select
                value={tipoDocumento}
                disabled={documentoBloqueado}
                onChange={(e) => setTipoDocumento(e.target.value as TipoDocumento)}
                className="h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground shadow-soft outline-none ring-ring transition-shadow focus:ring-2 disabled:opacity-60"
              >
                {TIPOS_DOCUMENTO.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={numeroDocumento}
                disabled={documentoBloqueado}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                placeholder="12345678A"
                className="h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none ring-ring transition-shadow focus:ring-2 disabled:opacity-60"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
          >
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
        </form>
      </div>

      {user.rol === "CUIDADOR" && (
        <div className="rounded-2xl bg-card p-6 shadow-float">
          <SeccionTarifa tarifaInicial={user.tarifaHora} />
        </div>
      )}

      {user.rol === "CUIDADOR" && (
        <div className="rounded-2xl bg-card p-6 shadow-float">
          <SeccionHospitales hospitalesIniciales={user.hospitalesTrabajo ?? []} />
        </div>
      )}

      {user.rol === "USUARIO" && (
        <div className="rounded-2xl bg-card p-6 shadow-float">
          <div className="mb-4 flex items-center gap-2 text-foreground">
            <Stethoscope className="h-5 w-5 text-accent-foreground" />
            <h2 className="text-lg font-semibold">Conviértete en cuidador</h2>
          </div>
          <p className="mb-5 text-sm text-muted-foreground">
            Empieza a ofrecer tus servicios como cuidador. Los datos de cobro (Stripe) se configuran después,
            cuando quieras.
          </p>

          {user.numeroDocumento ? (
            <button
              type="button"
              onClick={handleConvertirse}
              disabled={convirtiendo}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {convirtiendo ? "Enviando..." : "Convertirme en cuidador"}
            </button>
          ) : (
            <p className="rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Completa tu documento de identidad en “Datos personales” para poder convertirte en cuidador.
            </p>
          )}
        </div>
      )}

      {user.rol === "CUIDADOR" && (
        <div className="rounded-2xl bg-card p-6 shadow-float">
          <div className="mb-4 flex items-center gap-2 text-foreground">
            <ShieldCheck className="h-5 w-5 text-accent-foreground" />
            <h2 className="text-lg font-semibold">Datos de cobro</h2>
          </div>

          {user.stripeCobrosHabilitados ? (
            <>
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Pagos activados. Ya puedes recibir tus ingresos cuando completes un turno.</span>
              </div>
              <button
                type="button"
                onClick={handleVerificarStripe}
                disabled={verificando}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {verificando ? "Redirigiendo a Stripe..." : "Gestionar datos de cobro en Stripe"}
              </button>
            </>
          ) : (
            <>
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  Todavía no has verificado tus datos de cobro con Stripe. Puedes hacerlo ahora o más adelante,
                  pero <strong>no recibirás tus ingresos hasta que lo completes</strong>.
                </span>
              </div>
              <button
                type="button"
                onClick={handleVerificarStripe}
                disabled={verificando}
                className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
              >
                {verificando ? "Redirigiendo a Stripe..." : "Verificar datos de cobro con Stripe"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Interpola de rojo (0%) a verde (100%). Con una interpolacion lineal del
 * hue, a partir de ~hue 90 el ojo ya lo percibe como verde -> al 75% se veia
 * verde en vez de ambar. Con easing cubico el hue crece despacio al
 * principio (rojo/naranja se mantienen mas tiempo) y solo se acerca al
 * verde cerca del 100%.
 */
function colorCompletitud(porcentaje: number): string {
  const t = porcentaje / 100;
  const hue = t ** 3 * 142; // 0 = rojo, 142 ≈ verde emerald
  return `hsl(${hue}, 75%, 45%)`;
}

function SeccionCompletitud({ user }: { user: AuthUser }) {
  const items = [
    { label: "Teléfono de contacto", hecho: Boolean(user.telefono) },
    { label: "Tarifa por hora", hecho: user.tarifaHora != null },
    { label: "Hospitales en los que trabajas", hecho: (user.hospitalesTrabajo?.length ?? 0) > 0 },
    { label: "Datos de cobro verificados", hecho: Boolean(user.stripeCobrosHabilitados) },
  ];
  const completados = items.filter((item) => item.hecho).length;
  const porcentaje = Math.round((completados / items.length) * 100);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">Perfil de cuidador completo</span>
        <span className="font-semibold text-foreground">{porcentaje}%</span>
      </div>
      <Progress
        value={porcentaje}
        indicatorColor={colorCompletitud(porcentaje)}
        aria-label="Perfil de cuidador completo"
      />
    </div>
  );
}

function SeccionTarifa({ tarifaInicial }: { tarifaInicial: number | null }) {
  const { actualizarTarifaHora } = useAuth();
  const [tarifa, setTarifa] = useState(tarifaInicial != null ? String(tarifaInicial) : "");
  const [guardando, setGuardando] = useState(false);

  async function handleGuardar() {
    const valor = Number(tarifa);
    if (!valor || valor <= 0) {
      sileo.error({ title: "Indica una tarifa válida", description: "Debe ser un número mayor que 0." });
      return;
    }
    setGuardando(true);
    try {
      await actualizarTarifaHora(valor);
      sileo.success({ title: "Tarifa guardada", description: "Ya puedes postularte a anuncios con esta tarifa." });
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se ha podido guardar la tarifa.";
      sileo.error({ title: "No se ha podido guardar", description: mensaje });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <Euro className="h-5 w-5 text-accent-foreground" />
        <h2 className="text-lg font-semibold">Tu tarifa por hora</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Es el precio de partida con el que te postulas a un anuncio. El paciente/familiar podrá proponerte un
        precio distinto una vez te hayas postulado.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0.01"
          step="0.5"
          value={tarifa}
          onChange={(e) => setTarifa(e.target.value)}
          placeholder="Ej. 15"
          className="h-10 w-32 rounded-xl border-0 bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-soft outline-none ring-ring transition-shadow focus:ring-2"
        />
        <span className="text-sm text-muted-foreground">€ / hora</span>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando}
          className="ml-auto rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
        >
          {guardando ? "Guardando..." : "Guardar tarifa"}
        </button>
      </div>
    </div>
  );
}

function SeccionHospitales({ hospitalesIniciales }: { hospitalesIniciales: Hospital[] }) {
  const { actualizarHospitales } = useAuth();

  const [provincia, setProvincia] = useState("");
  const [seleccionados, setSeleccionados] = useState<Hospital[]>(hospitalesIniciales);
  const [guardando, setGuardando] = useState(false);

  function handleToggle(hospital: Hospital) {
    setSeleccionados((actual) =>
      actual.some((h) => h.id === hospital.id)
        ? actual.filter((h) => h.id !== hospital.id)
        : [...actual, hospital],
    );
  }

  function handleQuitar(hospitalId: string) {
    setSeleccionados((actual) => actual.filter((h) => h.id !== hospitalId));
  }

  async function handleGuardar() {
    setGuardando(true);
    try {
      const actualizados = await actualizarHospitales(seleccionados.map((h) => h.id));
      setSeleccionados(actualizados);
      sileo.success({
        title: "Hospitales guardados",
        description: "Se han actualizado los hospitales en los que trabajas.",
      });
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se han podido guardar los hospitales.";
      sileo.error({ title: "No se ha podido guardar", description: mensaje });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <Building2 className="h-5 w-5 text-accent-foreground" />
        <h2 className="text-lg font-semibold">Hospitales en los que trabajas</h2>
      </div>
      <p className="text-sm text-muted-foreground">
        Elige la provincia y añade todos los hospitales donde puedas prestar servicio. Puedes seleccionar varios.
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Provincia</label>
          <SelectorProvincia value={provincia} onChange={setProvincia} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-foreground">Hospitales</label>
          <SelectorHospitalesMultiple
            provincia={provincia}
            selectedIds={seleccionados.map((h) => h.id)}
            onToggle={handleToggle}
          />
        </div>
      </div>

      {seleccionados.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {seleccionados.map((h) => (
            <li
              key={h.id}
              className="flex items-center gap-1.5 rounded-full bg-muted py-1 pl-3 pr-1.5 text-xs text-foreground"
            >
              <span>
                {h.nombre} <span className="text-muted-foreground">({h.ciudad})</span>
              </span>
              <button
                type="button"
                onClick={() => handleQuitar(h.id)}
                className="rounded-full p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label={`Quitar ${h.nombre}`}
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={handleGuardar}
        disabled={guardando}
        className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
      >
        {guardando ? "Guardando..." : "Guardar hospitales"}
      </button>
    </div>
  );
}
