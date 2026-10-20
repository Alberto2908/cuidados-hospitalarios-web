import { Suspense } from "react";
import RestablecerPage from "./RestablecerPage";

// RestablecerPage lee ?token= con useSearchParams, que exige un límite de Suspense.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <RestablecerPage />
    </Suspense>
  );
}
