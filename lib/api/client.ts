const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const RUTA_ME = "/api/auth/me";
const RUTA_REFRESH = "/api/auth/refresh";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// /api/auth/me renueva la sesion por si mismo en el servidor cuando el access token ha caducado
// (emite uno nuevo con el refresh token, sin rotarlo). /api/auth/refresh SI rota el refresh token, asi
// que ambas cosas a la vez se pisan: si /refresh gana, el refresh token que lleva /me ya esta revocado y
// da un 401 falso. Por eso una peticion que reciba un 401 espera al /me en vuelo y reintenta con la
// cookie nueva, y /me espera a un /refresh en vuelo antes de salir.
let refrescoEnCurso: Promise<boolean> | null = null;
let meEnCurso: Promise<void> | null = null;

function intentarRefresh(): Promise<boolean> {
  if (!refrescoEnCurso) {
    refrescoEnCurso = fetch(`${API_URL}${RUTA_REFRESH}`, {
      method: "POST",
      credentials: "include",
    })
      .then((res) => res.ok)
      .catch(() => false)
      .finally(() => {
        refrescoEnCurso = null;
      });
  }
  return refrescoEnCurso;
}

async function renovarTras401(): Promise<boolean> {
  if (meEnCurso) {
    await meEnCurso;
    return true;
  }
  return intentarRefresh();
}

/** Apunta la llamada a /me como "en vuelo" hasta que termine (bien o mal), para que los 401 de otras peticiones la esperen. */
function registrarMeEnCurso(llamada: Promise<unknown>): void {
  const terminada = llamada.then(
    () => undefined,
    () => undefined,
  );
  meEnCurso = terminada;
  void terminada.then(() => {
    if (meEnCurso === terminada) meEnCurso = null;
  });
}

export function apiFetch<T>(path: string, init: RequestInit = {}, reintentado = false): Promise<T> {
  if (path !== RUTA_ME || reintentado) {
    return enviar<T>(path, init, reintentado);
  }
  const llamada = refrescoEnCurso ? refrescoEnCurso.then(() => enviar<T>(path, init, reintentado)) : enviar<T>(path, init, reintentado);
  registrarMeEnCurso(llamada);
  return llamada;
}

async function enviar<T>(path: string, init: RequestInit, reintentado: boolean): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      // Con FormData el navegador pone el Content-Type (multipart + boundary).
      ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...init.headers,
    },
  });

  // /me no se refresca aqui: el servidor ya lo intenta y, si da 401, no hay sesion que recuperar.
  const sePuedeRenovar = !reintentado && path !== RUTA_REFRESH && path !== RUTA_ME;
  if (res.status === 401 && sePuedeRenovar && (await renovarTras401())) {
    return apiFetch<T>(path, init, true);
  }

  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    throw new ApiError(res.status, cuerpo?.message ?? "Ha ocurrido un error inesperado");
  }

  if (res.status === 204) {
    return undefined as T;
  }
  return res.json();
}

/** Descarga un recurso binario autenticado (p. ej. una imagen protegida) con la misma sesion/refresh que apiFetch. */
export async function apiFetchBlob(path: string, reintentado = false): Promise<Blob> {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include" });

  if (res.status === 401 && !reintentado && (await renovarTras401())) {
    return apiFetchBlob(path, true);
  }

  if (!res.ok) {
    throw new ApiError(res.status, "No se ha podido cargar la imagen");
  }
  return res.blob();
}
