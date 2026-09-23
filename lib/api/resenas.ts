export interface Resena {
  id: string;
  autorNombre: string;
  valoracion: number;
  comentario: string;
  creadoEn: string;
}

/**
 * TODO: sustituir por una llamada real en cuanto exista el backend de
 * reseñas (ver TODO.md, "valoracion" de un servicio ya se guarda al
 * confirmarlo, pero todavia no hay un listado publico por cuidador).
 * Se deja como funcion async -misma forma que el resto de lib/api/*- para
 * que CuidadorDetallePage no tenga que cambiar nada al conectarla: solo
 * hace falta reemplazar el cuerpo por un fetch a
 * `/api/cuidadores/{id}/resenas`.
 */
export async function fetchResenasCuidador(_cuidadorId: string): Promise<Resena[]> {
  return [];
}
