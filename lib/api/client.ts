const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refrescoEnCurso: Promise<boolean> | null = null;

function intentarRefresh(): Promise<boolean> {
  if (!refrescoEnCurso) {
    refrescoEnCurso = fetch(`${API_URL}/api/auth/refresh`, {
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

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  reintentado = false,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  if (res.status === 401 && !reintentado && path !== "/api/auth/refresh") {
    const refrescado = await intentarRefresh();
    if (refrescado) {
      return apiFetch<T>(path, init, true);
    }
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
