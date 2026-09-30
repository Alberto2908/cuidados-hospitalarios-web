"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

// attribute="class" aplica `.dark` en <html>, que es lo que espera el
// @custom-variant dark de globals.css. "system" sigue prefers-color-scheme.
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
