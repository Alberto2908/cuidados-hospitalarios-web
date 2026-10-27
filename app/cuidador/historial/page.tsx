import CuidadorHistorialPage from "./CuidadorHistorialPage";
import RequiereCuidadorCompleto from "@/components/cuidador/RequiereCuidadorCompleto";

export default function Page() {
  return (
    <RequiereCuidadorCompleto>
      <CuidadorHistorialPage />
    </RequiereCuidadorCompleto>
  );
}
