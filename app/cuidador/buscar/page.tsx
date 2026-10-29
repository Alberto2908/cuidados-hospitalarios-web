import CuidadorBuscarPage from "./CuidadorBuscarPage";
import RequiereCuidadorCompleto from "@/components/cuidador/RequiereCuidadorCompleto";

export default function Page() {
  return (
    <RequiereCuidadorCompleto conSelectorBuscador>
      <CuidadorBuscarPage />
    </RequiereCuidadorCompleto>
  );
}
