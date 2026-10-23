"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { useAuth, type AuthUser } from "@/lib/auth/AuthContext";
import { ApiError } from "@/lib/api/client";
import type { ActualizarPerfilDatos, VerificacionIdentidadDatos } from "@/lib/auth/api";
import ModalVerificacionIdentidad from "@/components/perfil/ModalVerificacionIdentidad";
import type { Hospital } from "@/lib/mock/hospitales";
import SelectorProvincia from "@/components/anuncio/SelectorProvincia";
import SelectorHospitalesMultiple from "@/components/perfil/SelectorHospitalesMultiple";
import SeccionApariencia from "@/components/perfil/SeccionApariencia";
import { User, Stethoscope, ShieldCheck, AlertTriangle, Lock, Building2, X, Euro, Clock, BadgeCheck } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function PerfilPage() {
  const { user, isLoading, isAuthenticated, sincronizarStripe } = useAuth();
  const router = useRouter();
  const [comprobandoCobro, setComprobandoCobro] = useState(false);
  // sincronizarStripe cambia de identidad en cada render: se guarda en una ref para
  // que el efecto de abajo solo se ejecute al entrar, no en cada render.
  const sincronizarRef = useRef(sincronizarStripe);
  useEffect(() => {
    sincronizarRef.current = sincronizarStripe;
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  // Al entrar se consulta el estado de Stripe. Si el cuidador acaba de volver del
  // alta (?stripe=retorno), Stripe puede tardar unos segundos en activar la cuenta:
  // se vuelve a consultar cada pocos segundos hasta que quede habilitada.
  useEffect(() => {
    if (user?.rol !== "CUIDADOR") return;
    const vuelveDeStripe = new URLSearchParams(window.location.search).get("stripe") === "retorno";
    let cancelado = false;

    async function comprobar() {
      if (vuelveDeStripe) setComprobandoCobro(true);
      const intentos = vuelveDeStripe ? 10 : 1;
      for (let i = 0; i < intentos && !cancelado; i++) {
        try {
          const actualizado = await sincronizarRef.current();
          if (actualizado.stripeCobrosHabilitados) break;
        } catch {
          // se reintenta en la siguiente vuelta
        }
        if (i < intentos - 1) await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelado) setComprobandoCobro(false);
    }
    void comprobar();
    return () => {
      cancelado = true;
    };
  }, [user?.rol]);

  if (isLoading || !user) {
    return (
      <div className="flex flex-1 items-center justify-center py-24 text-sm text-muted-foreground">
        Cargando tu perfil...
      </div>
    );
  }

  return <PerfilContenido user={user} comprobandoCobro={comprobandoCobro} />;
}

function PerfilContenido({ user, comprobandoCobro }: { user: AuthUser; comprobandoCobro: boolean }) {
  const {
    actualizarPerfil,
    convertirseCuidador,
    obtenerStripeOnboardingLink,
    enviarVerificacionIdentidad,
    marcarResultadoVerificacionVisto,
  } = useAuth();

  const [nombre, setNombre] = useState(user.nombre);
  const [apellidos, setApellidos] = useState(user.apellidos);
  const [telefono, setTelefono] = useState(user.telefono ?? "");

  const [guardando, setGuardando] = useState(false);
  const [convirtiendo, setConvirtiendo] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [modalVerificacionAbierta, setModalVerificacionAbierta] = useState(false);
  const [clavesModalVerificacion, setClaveModalVerificacion] = useState(0);
  const [enviandoVerificacion, setEnviandoVerificacion] = useState(false);

  // Con la verificación de identidad pendiente o aprobada, nombre, apellidos y
  // documento quedan congelados (el servidor también lo impone).
  const datosCongelados = user.estadoVerificacion === "PENDIENTE" || user.estadoVerificacion === "APROBADA";

  // Abrir el perfil da por visto el resultado de la verificación (apaga las
  // notificaciones del menú de usuario). Solo se pide si hay algo sin ver.
  // El ref evita repetir la llamada: marcarResultadoVerificacionVisto cambia de
  // identidad en cada render del AuthProvider y, sin el, el efecto entraria en bucle.
  const hayResultadoSinVer = user.verificacionResultadoPendiente;
  const resultadoMarcadoVisto = useRef(false);
  useEffect(() => {
    if (hayResultadoSinVer && !resultadoMarcadoVisto.current) {
      resultadoMarcadoVisto.current = true;
      marcarResultadoVerificacionVisto().catch(() => {
        resultadoMarcadoVisto.current = false;
      });
    }
  }, [hayResultadoSinVer, marcarResultadoVerificacionVisto]);

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

    setGuardando(true);
    try {
      const actualizado = await actualizarPerfil(datos);
      setNombre(actualizado.nombre);
      setApellidos(actualizado.apellidos);
      setTelefono(actualizado.telefono ?? "");
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

  function abrirModalVerificacion() {
    setClaveModalVerificacion((k) => k + 1);
    setModalVerificacionAbierta(true);
  }

  async function handleEnviarVerificacion(datos: VerificacionIdentidadDatos) {
    setEnviandoVerificacion(true);
    try {
      await enviarVerificacionIdentidad(datos);
      setModalVerificacionAbierta(false);
      sileo.success({
        title: "Solicitud enviada",
        description: "Un administrador revisará tu documento. Tus datos personales quedan bloqueados mientras tanto.",
        duration: 8000,
      });
    } catch (err) {
      const mensaje = err instanceof ApiError ? err.message : "No se ha podido enviar la solicitud.";
      sileo.error({ title: "No se ha podido enviar", description: mensaje });
    } finally {
      setEnviandoVerificacion(false);
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
    <div className="page-container py-12">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="w-full sm:w-80 sm:shrink-0">
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
                  disabled={datosCongelados}
                  onChange={(e) => setNombre(e.target.value)}
                  className="h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground shadow-input outline-none ring-ring transition-shadow focus:ring-2 disabled:opacity-60"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="apellidos" className="text-sm font-medium text-foreground">Apellidos</label>
                <input
                  id="apellidos"
                  type="text"
                  value={apellidos}
                  disabled={datosCongelados}
                  onChange={(e) => setApellidos(e.target.value)}
                  className="h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground shadow-input outline-none ring-ring transition-shadow focus:ring-2 disabled:opacity-60"
                />
              </div>
            </div>

            {datosCongelados && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Lock className="h-3 w-3 shrink-0" />
                {user.estadoVerificacion === "APROBADA"
                  ? "Nombre y apellidos verificados: no se pueden modificar."
                  : "Nombre y apellidos bloqueados mientras se revisa tu identidad."}
              </p>
            )}

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
                className="h-10 w-full rounded-xl border-0 bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-input outline-none ring-ring transition-shadow focus:ring-2"
              />
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

        <SeccionApariencia />

        {user.rol === "CUIDADOR" && (
          <div className="rounded-2xl bg-card p-6 shadow-float">
            <SeccionVerificacionIdentidad user={user} onVerificar={abrirModalVerificacion} />
          </div>
        )}

        {user.rol === "CUIDADOR" && (
          <ModalVerificacionIdentidad
            key={clavesModalVerificacion}
            open={modalVerificacionAbierta}
            onOpenChange={setModalVerificacionAbierta}
            nombre={user.nombre}
            apellidos={user.apellidos}
            tipoDocumentoInicial={user.tipoDocumento}
            numeroDocumentoInicial={user.numeroDocumento}
            onEnviar={handleEnviarVerificacion}
            enviando={enviandoVerificacion}
          />
        )}

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

            <p className="mb-5 rounded-xl bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
              Para aparecer en las búsquedas e inscribirte en anuncios tendrás que verificar tu identidad con tu
              DNI o NIE desde tu perfil.
            </p>
            <button
              type="button"
              onClick={handleConvertirse}
              disabled={convirtiendo}
              className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {convirtiendo ? "Enviando..." : "Convertirme en cuidador"}
            </button>
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
                  <span>
                    Datos de cobro completados. Recibirás el dinero de cada cuidado en tu cuenta bancaria cuando el
                    paciente/familiar lo confirme.
                  </span>
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
                {comprobandoCobro && (
                  <div className="mb-4 flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>Stripe está comprobando tus datos. Puede tardar unos segundos; esta pantalla se actualizará sola.</span>
                  </div>
                )}
                <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Todavía no has completado tus datos de cobro. Puedes inscribirte y aceptar cuidados sin ellos, pero{" "}
                    <strong>no recibirás el dinero hasta que los completes</strong>: se queda retenido y se te entrega en
                    cuanto termines. Los datos los recoge Stripe (identidad y cuenta bancaria).
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleVerificarStripe}
                  disabled={verificando}
                  className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                  {verificando ? "Redirigiendo a Stripe..." : "Completar datos de cobro"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
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
    { label: "Identidad verificada", hecho: user.documentoVerificado },
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

function SeccionVerificacionIdentidad({ user, onVerificar }: { user: AuthUser; onVerificar: () => void }) {
  const estado = user.estadoVerificacion;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <BadgeCheck className="h-5 w-5 text-accent-foreground" />
        <h2 className="text-lg font-semibold">Verificación de identidad</h2>
      </div>

      {estado === "APROBADA" && (
        <div className="flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tu identidad está verificada
            {user.tipoDocumento && user.numeroDocumento ? ` (${user.tipoDocumento} ${user.numeroDocumento})` : ""}. Apareces
            en las búsquedas y puedes inscribirte en anuncios.
          </span>
        </div>
      )}

      {estado === "PENDIENTE" && (
        <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Tu solicitud
            {user.tipoDocumento && user.numeroDocumento ? ` (${user.tipoDocumento} ${user.numeroDocumento})` : ""} está
            pendiente de revisión. Hasta que se complete no aparecerás en las búsquedas ni podrás inscribirte en
            anuncios. Tus datos personales no se pueden modificar durante la revisión.
          </span>
        </div>
      )}

      {(estado === "SIN_SOLICITAR" || estado === "RECHAZADA") && (
        <>
          {estado === "RECHAZADA" && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                No hemos podido verificar tu documento. Revisa que las imágenes sean legibles y que los datos
                coincidan, y vuelve a enviarlo.
              </span>
            </div>
          )}
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Para aparecer en las búsquedas e inscribirte en anuncios necesitas verificar tu identidad con tu DNI o
              NIE.
            </span>
          </div>
          <button
            type="button"
            onClick={onVerificar}
            className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-primary transition-colors hover:bg-primary/90"
          >
            Verificar mi identidad
          </button>
        </>
      )}
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
      sileo.success({ title: "Tarifa guardada", description: "Ya puedes inscribirte en anuncios con esta tarifa." });
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
        Es el precio de partida con el que te inscribes en un anuncio. El paciente/familiar podrá proponerte un
        precio distinto una vez te hayas inscrito.
      </p>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="0.01"
          step="0.5"
          value={tarifa}
          onChange={(e) => setTarifa(e.target.value)}
          placeholder="Ej. 15"
          className="h-10 w-32 rounded-xl border-0 bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground shadow-input outline-none ring-ring transition-shadow focus:ring-2"
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
