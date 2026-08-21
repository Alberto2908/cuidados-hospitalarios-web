import Link from "next/link";
import { HeartPulse } from "lucide-react";

const legalLinks = [
  { label: "Aviso legal", href: "/legal/aviso" },
  { label: "Política de privacidad", href: "/legal/privacidad" },
  { label: "Cookies", href: "/legal/cookies" },
  { label: "Términos de uso", href: "/legal/terminos" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 text-center">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <HeartPulse className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-base">Cuidados Hospitalarios</span>
          </Link>

          <p className="max-w-md text-sm text-muted-foreground text-pretty">
            La plataforma que conecta familias con cuidadores profesionales de confianza.
          </p>

          {/* Legal links */}
          <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Copyright */}
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Cuidados Hospitalarios. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
