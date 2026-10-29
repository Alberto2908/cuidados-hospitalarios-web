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
    // Se comprueba la firma pero NO la caducidad (currentDate fijo en 1970): el access token dura
    // minutos y el refresh token (cookie de /api/auth, que esta ruta no recibe) mantiene la sesion, asi
    // que un token caducado pero autentico no significa "sin sesion". Aqui solo se decide la ruta segun
    // el rol; quien renueva la sesion es la web (/api/auth/me) y quien protege los datos es el API.
    const { payload } = await jwtVerify(token, secret, { currentDate: new Date(0) });
    const rol = typeof payload.rol === "string" ? payload.rol : "";
    const rutasPermitidas = RUTAS_POR_ROL[rol] ?? [];

    if (!rutasPermitidas.includes(prefijo)) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  } catch {
    // Token ausente o con la firma invalida: al login, no al home — todavia no sabemos
    // ni siquiera si esta autenticado.
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/paciente/:path*", "/cuidador/:path*", "/admin/:path*"],
};
