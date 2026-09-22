"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  HeartPulse,
  Megaphone,
  Search,
  History,
  LayoutDashboard,
  Users,
  UserCheck,
  ShieldCheck,
  Stethoscope,
  ArrowRight,
  Euro,
  Building2,
  Bell,
  MapPin,
} from "lucide-react";
import { useAuth, UserRole, type AuthUser } from "@/lib/auth/AuthContext";
import { misNotificacionesConteo as misNotificacionesAnuncios } from "@/lib/api/anuncios";
import { misNotificacionesConteo as misNotificacionesPostulaciones } from "@/lib/api/postulaciones";
import { fetchTodosLosHospitales } from "@/lib/api/hospitales";

interface AccesoRapido {
  label: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}

const ACCESOS_POR_ROL: Record<UserRole, AccesoRapido[]> = {
  USUARIO: [
    {
      label: "Poner anuncio",
      description: "Publica el turno que necesitas cubrir",
      href: "/paciente/anuncio/nuevo",
      icon: <Megaphone className="h-5 w-5" />,
    },
    {
      label: "Buscar cuidador",
      description: "Encuentra cuidadores cerca del hospital",
      href: "/paciente/buscar",
      icon: <Search className="h-5 w-5" />,
    },
    {
      label: "Mis anuncios",
      description: "Gestiona tus anuncios activos",
      href: "/paciente/historial",
      icon: <History className="h-5 w-5" />,
    },
  ],
  CUIDADOR: [
    {
      label: "Buscar anuncio",
      description: "Encuentra turnos disponibles",
      href: "/cuidador/buscar",
      icon: <Search className="h-5 w-5" />,
    },
    {
      label: "Mis postulaciones",
      description: "Sigue el estado de tus propuestas",
      href: "/cuidador/historial",
      icon: <History className="h-5 w-5" />,
    },
  ],
  ADMIN: [
    {
      label: "Gestionar anuncios",
      description: "Revisa los anuncios de la plataforma",
      href: "/admin/anuncios",
      icon: <LayoutDashboard className="h-5 w-5" />,
    },
    {
      label: "Gestionar cuidadores",
      description: "Administra las cuentas de cuidadores",
      href: "/admin/cuidadores",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      label: "Gestionar pacientes",
      description: "Administra las cuentas de pacientes",
      href: "/admin/pacientes",
      icon: <Users className="h-5 w-5" />,
    },
  ],
};

const ROLE_ACCENT: Record<UserRole, string> = {
  USUARIO: "text-sky-600 dark:text-sky-400",
  CUIDADOR: "text-emerald-600 dark:text-emerald-400",
  ADMIN: "text-violet-600 dark:text-violet-400",
};

const ROLE_BG: Record<UserRole, string> = {
  USUARIO: "bg-sky-200 dark:bg-sky-950/60",
  CUIDADOR: "bg-emerald-200 dark:bg-emerald-950/60",
  ADMIN: "bg-violet-200 dark:bg-violet-950/60",
};

const HERO_BULLETS = [
  "Publica el turno que necesitas cubrir en el hospital",
  "Compara propuestas de cuidadores profesionales",
  "El pago queda protegido hasta que el turno se completa",
];

const PASOS = [
  {
    icon: <Megaphone className="h-5 w-5" />,
    titulo: "Publica el turno",
    texto: "Indica el hospital, la planta y las franjas horarias en las que necesitas acompañamiento.",
  },
  {
    icon: <Search className="h-5 w-5" />,
    titulo: "Recibe propuestas",
    texto: "Cuidadores profesionales de la zona se postulan con su tarifa. Puedes negociar el precio.",
  },
  {
    icon: <ShieldCheck className="h-5 w-5" />,
    titulo: "Acepta y queda confirmado",
    texto: "Eliges al cuidador, confirmas el turno y el pago queda protegido hasta que se complete.",
  },
];

export default function InicioPage() {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div className="flex flex-1 flex-col">
      {/* ── Hero ── */}
      <section
        className={`relative overflow-hidden px-4 pb-24 pt-16 sm:px-6 lg:px-8 ${
          isAuthenticated && user ? ROLE_BG[user.rol] : "bg-neutral-200 dark:bg-neutral-800/60"
        }`}
      >
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-md">
            <HeartPulse className="h-8 w-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Acompañamiento hospitalario de confianza
          </h1>
          <p className="mt-3 text-base text-muted-foreground text-pretty">
            Conectamos a familias con un familiar ingresado con cuidadores profesionales que cubren
            turnos de acompañamiento en el hospital, cuando no puedes estar tú.
          </p>

          {/* Sin sesión: el navbar ya tiene "Iniciar sesión"/"Crear cuenta" justo encima; en vez
              de repetirlo aquí pegado, se resumen las 3 ideas clave y un único CTA al final. */}
          {!isLoading && !isAuthenticated && (
            <div className="mx-auto mt-8 max-w-md">
              <ul className="space-y-2.5 text-left text-sm text-foreground">
                {HERO_BULLETS.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2.5">
                    <span className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                    {bullet}
                  </li>
                ))}
              </ul>
              <Link
                href="/registro"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Crear cuenta gratis
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          {isAuthenticated && user && (
            <div className="mt-10 mx-auto max-w-2xl text-left">
              <p className="mb-4 text-center text-sm text-muted-foreground">
                Hola <span className={`font-semibold ${ROLE_ACCENT[user.rol]}`}>{user.nombre}</span>, ¿qué
                quieres hacer?
              </p>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {ACCESOS_POR_ROL[user.rol].map((acceso) => (
                  <Link
                    key={acceso.href}
                    href={acceso.href}
                    className="group flex items-center gap-3 rounded-2xl border border-border bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted ${ROLE_ACCENT[user.rol]}`}>
                      {acceso.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{acceso.label}</p>
                      <p className="text-xs text-muted-foreground">{acceso.description}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ))}
              </div>

              <ResumenCuenta user={user} />
            </div>
          )}
        </div>

        <OlaDivisor className="absolute inset-x-0 bottom-0 h-14 w-full text-background" />
      </section>

      {/* ── Sobre la plataforma ── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-foreground">Cuando no puedes estar tú, que haya alguien</h2>
          <div className="mt-4 space-y-4 text-sm text-muted-foreground">
            <p>
              Cuando un familiar está ingresado, alguien tiene que acompañarle. Pero la vida no se
              detiene: hay trabajo, otros hijos que atender, o simplemente vives lejos del hospital.
              Cuidados Hospitalarios nace para cubrir ese hueco con alguien de confianza.
            </p>
            <p>
              Publicas el turno que necesitas —el hospital, la planta y el horario exacto— y los
              cuidadores profesionales de la zona lo ven y se postulan con su tarifa por hora, así
              que puedes comparar propuestas antes de decidir.
            </p>
            <p>
              El turno puede ser de unas pocas horas, de un día entero o repartirse en varias
              franjas a lo largo de distintos días, según lo que necesite tu familiar en cada
              momento. Tú decides el horario; el cuidador decide si puede cubrirlo.
            </p>
            <p>
              Todo el proceso queda registrado dentro de la plataforma: desde la propuesta inicial
              hasta la aceptación final, pasando por cualquier ajuste de precio. Y el pago no llega
              al cuidador hasta que el turno se ha completado, así que ambas partes quedan
              protegidas.
            </p>
          </div>
        </div>
      </section>

      {/* ── Hospitales ── */}
      <HospitalesDestacados />

      {/* ── Cómo funciona ── */}
      <section className="relative overflow-hidden bg-neutral-200 px-4 pb-20 pt-20 dark:bg-neutral-800/60 sm:px-6 lg:px-8">
        <OlaDivisor className="absolute inset-x-0 top-0 h-14 w-full rotate-180 text-background" />
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold text-foreground">Cómo funciona</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
            De publicar el turno a tenerlo cubierto, en tres pasos.
          </p>

          <div className="relative mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {/* Línea que conecta los pasos, solo en pantallas medianas+ */}
            <div className="pointer-events-none absolute inset-x-0 top-13 hidden border-t-2 border-dashed border-border sm:block" />

            {PASOS.map((paso, i) => (
              <div
                key={paso.titulo}
                className="relative overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-sm"
              >
                <div className="relative mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  {paso.icon}
                </div>
                <p className="relative mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Paso {i + 1}
                </p>
                <h3 className="relative mb-2 text-base font-semibold text-foreground">{paso.titulo}</h3>
                <p className="relative text-sm text-muted-foreground">{paso.texto}</p>
              </div>
            ))}
          </div>
        </div>
        <OlaDivisor className="absolute inset-x-0 bottom-0 h-14 w-full text-background" />
      </section>

      {/* ── Para quién es (solo si no ha iniciado sesión) ── */}
      {!isLoading && !isAuthenticated && (
        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold text-foreground">Elige tu perfil</h2>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Paciente / familiar */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-neutral-200 p-6 shadow-sm dark:bg-neutral-800/60">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-400">
                  <Search className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Necesito un cuidador</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Tienes un familiar ingresado y necesitas a alguien de confianza que le acompañe
                  cuando tú no puedas.
                </p>
                <ul className="mb-6 space-y-1.5 text-sm text-muted-foreground">
                  <li>• Publica el turno en minutos</li>
                  <li>• Compara propuestas de cuidadores</li>
                  <li>• Tú decides a quién aceptar</li>
                </ul>
                <Link
                  href="/registro"
                  className="mt-auto rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Encuentra ahora un cuidador
                </Link>
              </div>

              {/* Cuidador */}
              <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-neutral-200 p-6 shadow-sm dark:bg-neutral-800/60">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">Soy cuidador profesional</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Ofrece tus servicios de acompañamiento hospitalario y encuentra turnos cerca de ti.
                </p>
                <ul className="mb-6 space-y-1.5 text-sm text-muted-foreground">
                  <li>• Fija tu propia tarifa por hora</li>
                  <li>• Elige los hospitales donde trabajas</li>
                  <li>• Cobra de forma segura por cada turno</li>
                </ul>
                <Link
                  href="/registro"
                  className="mt-auto rounded-full bg-primary px-5 py-2.5 text-center text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  Encuentra a quien cuidar
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Profundización ── */}
      <section className="px-4 py-14 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Qué cubre un turno de acompañamiento</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              El cuidador acompaña a tu familiar en la habitación durante el horario acordado: estar
              presente, avisar si algo cambia, ayudar con lo básico del día a día. No sustituye al
              personal sanitario del hospital, que sigue siendo quien atiende lo médico.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">Cómo se elige al cuidador</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Cuando un cuidador se postula a tu anuncio, ves su tarifa por hora y puedes
              proponerle un precio distinto antes de decidir. Nadie queda asignado hasta que tú
              aceptas su propuesta.
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}

/**
 * Datos reales del usuario (no inventados): notificaciones pendientes -misma
 * consulta que ya usa el Navbar, así no hay una segunda fuente de verdad- y,
 * para el cuidador, la tarifa y los hospitales ya guardados en su perfil.
 */
function ResumenCuenta({ user }: { user: AuthUser }) {
  const esPaciente = user.rol === "USUARIO";
  const esCuidador = user.rol === "CUIDADOR";

  const { data: notiAnuncios } = useQuery({
    queryKey: ["anuncios", "notificaciones-conteo"],
    queryFn: misNotificacionesAnuncios,
    enabled: esPaciente,
    staleTime: 20 * 1000,
  });
  const { data: notiPostulaciones } = useQuery({
    queryKey: ["postulaciones", "notificaciones-conteo"],
    queryFn: misNotificacionesPostulaciones,
    enabled: esCuidador,
    staleTime: 20 * 1000,
  });

  const pendientes = esPaciente ? notiAnuncios?.total ?? 0 : notiPostulaciones?.total ?? 0;
  const hrefPendientes = esPaciente ? "/paciente/historial" : "/cuidador/historial";

  if (user.rol === "ADMIN") return null;

  return (
    <div className="mt-4 flex flex-col gap-2 sm:flex-row">
      {(esPaciente || esCuidador) && pendientes > 0 && (
        <Link
          href={hrefPendientes}
          className="flex flex-1 items-center gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-primary/10"
        >
          <Bell className="h-4 w-4 shrink-0 text-primary" />
          Tienes {pendientes} {pendientes === 1 ? "novedad pendiente" : "novedades pendientes"} de revisar
        </Link>
      )}

      {esCuidador && (
        <div className="flex flex-1 flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Euro className="h-3.5 w-3.5" />
            {user.tarifaHora != null ? `${user.tarifaHora} €/hora` : "Sin tarifa configurada"}
          </span>
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            {user.hospitalesTrabajo?.length ?? 0}{" "}
            {(user.hospitalesTrabajo?.length ?? 0) === 1 ? "hospital" : "hospitales"}
          </span>
        </div>
      )}
    </div>
  );
}

const CANTIDAD_HOSPITALES_DESTACADOS = 8;

/**
 * Muestra unos pocos hospitales reales del catálogo (~850), elegidos al azar
 * en cada carga de la página -no siempre los mismos, no inventados-, para
 * dar una idea concreta de dónde se puede publicar un anuncio. Solo lectura,
 * mismo endpoint público que usa el selector de hospitales del formulario.
 */
function HospitalesDestacados() {
  const { data: hospitales } = useQuery({
    queryKey: ["hospitales", "todos"],
    queryFn: fetchTodosLosHospitales,
    staleTime: 10 * 60 * 1000,
  });

  const destacados = useMemo(() => {
    if (!hospitales || hospitales.length === 0) return [];
    const copia = [...hospitales];
    for (let i = copia.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copia[i], copia[j]] = [copia[j], copia[i]];
    }
    return copia.slice(0, CANTIDAD_HOSPITALES_DESTACADOS);
  }, [hospitales]);

  if (destacados.length === 0) return null;

  return (
    <section className="px-4 py-14 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <h2 className="text-center text-2xl font-bold text-foreground">
          Hospitales donde puedes publicar tu anuncio
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground">
          Estos son solo algunos ejemplos. Cubrimos hospitales de toda España: al publicar tu
          anuncio, eliges el hospital, la planta y la habitación exactos.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {destacados.map((hospital) => (
            <div
              key={hospital.id}
              className="flex items-start gap-2.5 rounded-xl border border-border bg-neutral-200 p-3.5 dark:bg-neutral-800/60"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-black dark:text-white" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{hospital.nombre}</p>
                <p className="text-xs text-muted-foreground">{hospital.ciudad}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Divisor curvo entre secciones: en vez de un corte recto, el color de la
 * sección "muerde" con una curva en el color de la siguiente. Un único
 * trazo asimétrico (no una onda repetida de varios picos) para que no se
 * confunda con el divisor típico de "wave" que usan un montón de landings.
 * Se posiciona absolute en el borde de la sección con color, y
 * `text-background` (o el color que se le pase) hace que la curva "revele"
 * el fondo de la sección de debajo.
 */
function OlaDivisor({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 74" preserveAspectRatio="none" className={className} aria-hidden="true">
      <path d="M0,8 C620,-16 900,64 1440,20 L1440,74 L0,74 Z" fill="currentColor" />
    </svg>
  );
}

