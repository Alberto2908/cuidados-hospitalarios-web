import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Rutas por rol, igual que la tabla de AGENTS.md. CUIDADOR conserva las
// rutas de USUARIO (rol jerarquico: ver diseno de la tabla usuario) — ADMIN
// tiene sus propias paginas de gestion, no las de paciente/cuidador.
const RUTAS_POR_ROL: Record<string, string[]> = {
  USUARIO: ["/paciente"],
  CUIDADOR: ["/paciente", "/cuidador"],
  ADMIN: ["/admin"],
};

const PREFIJOS_PROTEGIDOS = ["/paciente", "/cuidador", "/admin"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const prefijo = PREFIJOS_PROTEGIDOS.find(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!prefijo) {
    return NextResponse.next();
  }

  const token = request.cookies.get("access_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const rol = typeof payload.rol === "string" ? payload.rol : "";
    const rutasPermitidas = RUTAS_POR_ROL[rol] ?? [];

    if (!rutasPermitidas.includes(prefijo)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    // Token ausente/expirado/invalido: al login, no al home — todavia no sabemos
    // ni siquiera si esta autenticado.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/paciente/:path*", "/cuidador/:path*", "/admin/:path*"],
};
