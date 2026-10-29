import type { AuthUser } from "@/lib/auth/AuthContext";

export interface ItemCompletitud {
  label: string;
  hecho: boolean;
}

// Mismo criterio que CuidadorRequisitos en el backend (buscador de cuidadores e
// inscribirse). Stripe y el email verificado no cuentan: lo primero solo
// condiciona el cobro (se recomienda) y lo segundo se exige antes, al usar la app.

/** Pasos obligatorios del alta como cuidador, en el mismo orden en que aparecen las tarjetas de `/perfil`. */
export function itemsCompletitud(user: AuthUser): ItemCompletitud[] {
  return [
    { label: "Teléfono de contacto", hecho: Boolean(user.telefono) },
    { label: "Identidad verificada", hecho: user.documentoVerificado },
    { label: "Tarifa por hora", hecho: user.tarifaHora != null },
    { label: "Hospitales en los que trabajas", hecho: (user.hospitalesTrabajo?.length ?? 0) > 0 },
  ];
}

export function porcentajeCompletitud(user: AuthUser): number {
  const items = itemsCompletitud(user);
  return Math.round((items.filter((i) => i.hecho).length / items.length) * 100);
}

/** Aparecer en el buscador, inscribirse y las pantallas de cuidador exigen el alta al 100 %. */
export function cuidadorCompleto(user: AuthUser | null | undefined): boolean {
  return user?.rol === "CUIDADOR" && porcentajeCompletitud(user) === 100;
}
