import AdminUsuariosPage from "./AdminUsuariosPage";

export default async function Page({ searchParams }: { searchParams: Promise<{ tipo?: string }> }) {
  const { tipo } = await searchParams;
  return <AdminUsuariosPage tipoInicial={tipo === "pacientes" ? "pacientes" : "cuidadores"} />;
}
