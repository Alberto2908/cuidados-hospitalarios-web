import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Mismo boton "Ver perfil" en todas partes (Mis postulaciones, detalle de un
// anuncio, postulaciones de un anuncio): en negro para que se distinga bien
// del resto de acciones.
export default function BotonVerPerfil({ href, className }: { href: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        // La variante outline fuerza hover:text-foreground / hover:bg-card: hay que
        // pisar tambien el hover, si no el texto queda oscuro sobre fondo oscuro.
        "border-0 bg-foreground text-background hover:bg-foreground/90 hover:text-background hover:shadow-none",
        className,
      )}
    >
      Ver perfil
    </Link>
  );
}
