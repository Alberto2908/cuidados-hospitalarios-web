import type { Metadata } from "next";
import { Sora, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth/AuthContext";
import AppToaster from "@/components/providers/AppToaster";
import QueryProvider from "@/components/providers/QueryProvider";
import EstadoCuentaBanner from "@/components/auth/EstadoCuentaBanner";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cuidados Hospitalarios",
  description: "Conectamos familias con cuidadores profesionales",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <QueryProvider>
            <AuthProvider>
              <Navbar />
              <EstadoCuentaBanner />
              <main className="flex-1">{children}</main>
              <Footer />
              <AppToaster />
            </AuthProvider>
          </QueryProvider>
        </body>
    </html>
  );
}
