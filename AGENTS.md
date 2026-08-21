<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Cuidados Hospitalarios — reglas de dominio y estilo

Este bloque es específico del proyecto (no lo regenera `next dev`). Léelo antes de diseñar
o implementar cualquier pantalla, endpoint o componente nuevo.

## Qué es la app

Marketplace que conecta pacientes/familias ingresados en un hospital con cuidadores
profesionales que cubren turnos de acompañamiento. Tres roles: `PACIENTE`, `CUIDADOR`,
`ADMIN` (ver `lib/auth/AuthContext.tsx`).

Fase actual (agosto 2026): **prototipo de frontend**. Datos en `lib/mock/*`, auth falsa
(selector de rol, sin contraseñas reales), sin backend ni persistencia. Los pagos y el
backend se implementan más adelante — este documento fija las reglas para que lo que se
construya ahora no haya que rehacerlo entonces.

## Roles y acceso

| Rol      | Rutas principales                                              |
|----------|------------------------------------------------------------------|
| PACIENTE | `/paciente/anuncio/nuevo`, `/paciente/buscar`, `/paciente/historial` |
| CUIDADOR | `/cuidador/buscar`, `/cuidador/historial`                        |
| ADMIN    | `/admin/anuncios`, `/admin/cuidadores`, `/admin/pacientes`, `/admin/configuracion` |

Hoy no hay `middleware.ts`: nada impide que un usuario navegue a una ruta de otro rol
cambiando la URL. **Cuando se añada backend/auth real, cada ruta de la tabla debe quedar
protegida por rol** (middleware o guard equivalente) — no asumir que ocultar el enlace en
el navbar basta.

Rutas que aparecen en `components/layout/Navbar.tsx` pero aún no existen como página
(pendientes, no eliminar del navbar sin crear la página): `/paciente/historial`,
`/cuidador/historial`, `/admin/anuncios`, `/perfil`, `/perfil/contrasena`,
`/admin/configuracion`, `/legal/aviso`, `/legal/privacidad`, `/recuperar`.

## Datos sensibles

Los campos `planta`, `habitacion` y `cama` de un anuncio (`lib/mock/anuncios.ts`) son
datos de localización de un paciente ingresado. **Solo deben ser visibles para el
cuidador después de que el paciente acepte su solicitud** para ese turno. Cuando exista
backend, esto se aplica en el servidor (el cliente nunca debe recibir esos campos antes
de la aceptación) — no basta con no mostrarlos en la UI si el dato ya viajó al navegador.

## Flujo de negocio (aplica cuando se conecte backend + pagos)

El bucle central que falta hoy y que todo lo demás depende de: **anuncio → solicitud del
cuidador → aceptación del paciente → turno confirmado → turno completado**. El pago se
ancla a este bucle, no es un paso aislado.

Modelo de pago acordado (Stripe Connect u equivalente con cuentas conectadas):

1. El cuidador se registra como cuenta conectada (KYC/IBAN lo gestiona el proveedor de
   pago, no la app).
2. El paciente paga al confirmar el turno; el dinero entra en el balance de la
   plataforma, **no** se transfiere al cuidador todavía.
3. Al completarse el turno (confirmación del paciente, o transcurrido un plazo sin
   disputa) se dispara una transferencia a la cuenta conectada del cuidador, restando la
   comisión de la plataforma.
4. Esto da una ventana de disputa/reembolso antes de pagar al cuidador — no simplificar
   a "cobrar y repartir al instante".

Pendiente de decidir (no inventar un valor, preguntar antes de implementar): porcentaje
de comisión, política de cancelación/no-show, calendario de payout al cuidador.

## Estilo visual

- Sistema de componentes: shadcn, estilo `base-nova`, color base `neutral`, tokens
  `oklch` en `app/globals.css` vía `@theme inline`. Usar siempre los tokens
  (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `--radius-*`, etc.)
  en vez de colores o radios sueltos — así el modo oscuro (clase `.dark`) funciona sin
  esfuerzo adicional en componentes nuevos.
- Color por rol (usado en `Navbar.tsx`, `app/page.tsx` y badges): **sky** = Paciente,
  **emerald** = Cuidador, **violet** = Admin. Reutilizar exactamente estas paletas
  Tailwind al añadir UI nueva relacionada con un rol, no introducir otro color para el
  mismo propósito.
- Iconos: `lucide-react` en todo el proyecto — mantener una única librería de iconos y un
  grosor de trazo consistente.
- Notificaciones/toasts: librería `sileo` vía `AppToaster`. No tocar las variables CSS
  `--sileo-width`, `--sileo-body-w`, `--sileo-body-x` documentadas en `globals.css`
  (controlan un morph SVG a medida fija en JS).
- Formularios: `react-hook-form` + `zodResolver` con los esquemas de `lib/anuncio/schema.ts`
  como referencia de estilo (validación con mensajes en español, límites de longitud
  explícitos). Cuando se añadan campos de pago, seguir la guía de formularios de pago de
  `.agents/skills/modern-web-guidance/guides/forms/autofill-payment-form.md` (autocomplete
  `cc-number`/`cc-exp`/`cc-csc`, `inputmode="numeric"`, nunca `type="password"` para el CVC).

## Deuda técnica conocida

- `@tanstack/react-query` está en `package.json` sin usarse en ningún componente —
  eliminarlo o adoptarlo como capa de datos al conectar el backend real, no dejarlo sin
  usar indefinidamente.
- `MOCK_ANUNCIOS.unshift(...)` en `app/paciente/anuncio/nuevo/page.tsx` muta el array
  importado en memoria; es solo válido mientras no haya backend — al conectar persistencia
  real, sustituir por una llamada al servidor.

