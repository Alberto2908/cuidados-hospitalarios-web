import { redirect } from "next/navigation";

// Cuidadores y pacientes viven ahora en /admin/usuarios (selector deslizante).
export default function Page() {
  redirect("/admin/usuarios?tipo=cuidadores");
}
