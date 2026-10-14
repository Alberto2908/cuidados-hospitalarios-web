// Prepara una foto elegida por el usuario antes de subirla (verificacion de
// identidad): la decodifica en el navegador, la reduce y la recomprime a JPEG.
//
// - Cubre lo que sube un movil (fotos enormes, WebP de Android, HEIC de
//   iPhone cuando el navegador sabe decodificarlo) y lo que sube un ordenador
//   (JPG/PNG), dejando siempre un JPEG ligero que el servidor sabe tratar.
// - createImageBitmap aplica la orientacion EXIF, asi que la foto no llega
//   girada aunque el servidor descarte los metadatos al recomprimir.

const LADO_MAXIMO_PX = 1600;
const CALIDAD_JPEG = 0.8;
const TAMANO_MAXIMO_ORIGEN = 30 * 1024 * 1024;

export const FORMATOS_IMAGEN_ACEPTADOS = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export class ImagenNoValidaError extends Error {}

export async function prepararImagen(archivo: File): Promise<File> {
  if (archivo.size > TAMANO_MAXIMO_ORIGEN) {
    throw new ImagenNoValidaError("La imagen es demasiado grande. Elige una de menos de 30 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(archivo);
  } catch {
    throw new ImagenNoValidaError(
      "No se ha podido leer la imagen. Usa una foto en formato JPG o PNG, o haz la foto con la cámara del móvil.",
    );
  }

  try {
    const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(bitmap.width, bitmap.height));
    const ancho = Math.max(1, Math.round(bitmap.width * escala));
    const alto = Math.max(1, Math.round(bitmap.height * escala));

    const canvas = document.createElement("canvas");
    canvas.width = ancho;
    canvas.height = alto;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new ImagenNoValidaError("No se ha podido procesar la imagen en este navegador.");
    }
    // Fondo blanco: un PNG con transparencia no debe quedar negro en JPEG.
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, ancho, alto);
    ctx.drawImage(bitmap, 0, 0, ancho, alto);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", CALIDAD_JPEG));
    if (!blob) {
      throw new ImagenNoValidaError("No se ha podido procesar la imagen.");
    }
    return new File([blob], "imagen.jpg", { type: "image/jpeg" });
  } finally {
    bitmap.close();
  }
}
