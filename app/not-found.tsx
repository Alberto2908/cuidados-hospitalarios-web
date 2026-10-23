import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="page-container flex flex-col items-center py-24 text-center">
      <p className="text-sm font-semibold text-accent-foreground dark:text-primary">Error 404</p>
      <h1 className="mt-2 text-2xl font-semibold text-foreground">No encontramos esta página</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        La dirección puede estar mal escrita o la página ya no existe.
      </p>
      <Link href="/" className={cn(buttonVariants(), "mt-6")}>
        Volver al inicio
      </Link>
    </div>
  );
}
